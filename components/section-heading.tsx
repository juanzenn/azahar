import { cn } from "@/lib/utils";

/**
 * Centred section header: an uppercase eyebrow above a serif H2.
 *
 * `tone="onEmerald"` is for the occasion band, where the section sits on the
 * solid primary colour and the default plum eyebrow would disappear.
 */
export function SectionHeading({
  eyebrow,
  tone = "default",
  children,
}: {
  eyebrow: string;
  tone?: "default" | "onEmerald";
  children: React.ReactNode;
}) {
  const onEmerald = tone === "onEmerald";

  return (
    <div className="mb-10 text-center">
      <p className={cn("eyebrow", onEmerald && "text-emerald-soft")}>
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-2.5 font-serif text-[clamp(26px,3.4vw,36px)] font-medium tracking-[-0.01em]",
          onEmerald && "text-primary-foreground",
        )}
      >
        {children}
      </h2>
    </div>
  );
}
