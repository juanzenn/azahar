import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { SearchResults } from "@/components/search-results";
import type { Category, Product } from "@/lib/catalog/types";

/**
 * Wiring only.
 *
 * What matching, counting and paging *mean* is `lib/search`'s to prove and
 * `lib/facets`' to shape, and both are tested without a DOM. What is left —
 * and what no pure test can see — is whether this island is actually plugged
 * into the URL: that a control writes the criteria it claims to, that the
 * history verb is the one the Back button needs, and that a view mounted from a
 * query string is the view that query string describes.
 */

/**
 * A router that actually navigates, in the only sense this island cares about:
 * what it writes is what the next render reads back. Half the behaviour under
 * test is that round trip, so the stub has to close it.
 */
const { router, url } = vi.hoisted(() => {
  const url = { params: new URLSearchParams() };
  const navigate = (href: string) => {
    url.params = new URLSearchParams(href.split("?")[1] ?? "");
  };

  return { url, router: { replace: vi.fn(navigate), push: vi.fn(navigate) } };
});

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/buscar",
  useSearchParams: () => url.params,
}));

const CATEGORIES: Category[] = [
  { slug: "ramos", name: "Ramos" },
  { slug: "cajas", name: "Cajas de flores" },
];

function product(index: number, overrides: Partial<Product> = {}): Product {
  const slug = `producto-${index}`;

  return {
    id: slug,
    slug,
    name: `Producto ${index}`,
    description: "",
    priceUsdCents: 3000,
    images: ["/images/products/x.jpg"],
    categorySlug: "ramos",
    occasions: ["amor"],
    flowerTypes: ["mixtas"],
    colours: ["blanco"],
    size: "mediano",
    ...overrides,
  };
}

/** Fourteen products, so there is a second page, three of them red roses. */
const CATALOG: Product[] = [
  product(1, { colours: ["rojo"], flowerTypes: ["rosas"] }),
  product(2, { colours: ["rojo"], flowerTypes: ["rosas"] }),
  product(3, { colours: ["rojo"], flowerTypes: ["rosas"] }),
  ...Array.from({ length: 11 }, (_, index) => product(index + 4)),
];

/** A fresh element each time, so a re-render is never bailed out of. */
const island = () => (
  <SearchResults
    products={CATALOG}
    categories={CATEGORIES}
    suggestions={[]}
    scope={{ kind: "search" }}
  />
);

function mount(params = "") {
  url.params = new URLSearchParams(params);
  const view = render(island());

  return {
    /** What Next does once a navigation lands: render the route again. */
    navigated: () => view.rerender(island()),
  };
}

beforeAll(() => {
  // Paging scrolls to the top of the results, which jsdom has no notion of.
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  router.replace.mockClear();
  router.push.mockClear();
});

describe("SearchResults", () => {
  it("writes a filter change to the URL, replacing the history entry", async () => {
    const user = userEvent.setup();
    mount();

    await user.click(screen.getByRole("checkbox", { name: /^Rojo/ }));

    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith("/buscar?col=rojo", {
      scroll: false,
    });
    expect(router.push).not.toHaveBeenCalled();
  });

  it("pushes a page change, so Back steps through result pages", async () => {
    const user = userEvent.setup();
    mount();

    await user.click(screen.getByRole("link", { name: "Página 2" }));

    expect(router.push).toHaveBeenCalledWith("/buscar?page=2", {
      scroll: false,
    });
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("resets to the first page when a filter changes", async () => {
    const user = userEvent.setup();
    mount("page=2");

    await user.click(screen.getByRole("checkbox", { name: /^Rojo/ }));

    expect(router.replace).toHaveBeenCalledWith("/buscar?col=rojo", {
      scroll: false,
    });
  });

  it("removes exactly the constraint a chip names", async () => {
    const user = userEvent.setup();
    mount("col=rojo&col=blanco&sz=grande");

    await user.click(
      screen.getByRole("button", { name: "Quitar filtro: Rojo" }),
    );

    expect(router.replace).toHaveBeenCalledWith(
      "/buscar?col=blanco&sz=grande",
      { scroll: false },
    );
  });

  it("clears everything back to a clean base URL", async () => {
    const user = userEvent.setup();
    mount("q=rosas&col=rojo&sort=name&page=2");

    await user.click(screen.getByRole("button", { name: "Limpiar todo" }));

    expect(router.replace).toHaveBeenCalledWith("/buscar", { scroll: false });
  });

  it("reproduces the view its query string describes", () => {
    mount("q=rosas&col=rojo");

    expect(screen.getByRole("searchbox")).toHaveValue("rosas");
    expect(screen.getByRole("checkbox", { name: /^Rojo/ })).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Quitar filtro: «rosas»" }),
    ).toBeInTheDocument();
    // The count itself is the search module's arithmetic; what matters here is
    // that the heading echoes the query the URL carried.
    expect(
      screen.getByRole("heading", { name: /resultados para «rosas»/ }),
    ).toBeInTheDocument();
  });

  it("debounces the query box rather than navigating per keystroke", async () => {
    const user = userEvent.setup();
    mount();

    await user.type(screen.getByRole("searchbox"), "ros");

    // Still nothing: the box waits for a pause before it writes the URL.
    expect(router.replace).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/buscar?q=ros", {
        scroll: false,
      }),
    );
    // Three keystrokes, one history entry.
    expect(router.replace).toHaveBeenCalledTimes(1);
  });

  it("lets a second word be typed after the URL catches up", async () => {
    const user = userEvent.setup();
    const { navigated } = mount();
    const box = screen.getByRole("searchbox");

    await user.type(box, "rosas ");
    await waitFor(() => expect(router.replace).toHaveBeenCalled());
    navigated();
    await user.type(box, "blancas");

    // The URL parses criteria trimmed, so echoing them back over the box would
    // swallow the space and glue the words together.
    expect(box).toHaveValue("rosas blancas");
  });

  it("empties the box when the query is dropped from outside it", async () => {
    const user = userEvent.setup();
    const { navigated } = mount("q=rosas");

    await user.click(
      screen.getByRole("button", { name: "Quitar filtro: «rosas»" }),
    );
    navigated();

    expect(screen.getByRole("searchbox")).toHaveValue("");
  });
});
