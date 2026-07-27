import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library only registers this itself when Vitest runs with globals, and
// this suite does not — without it, mounted components pile up across tests in a
// file and every query starts finding duplicates.
afterEach(cleanup);
