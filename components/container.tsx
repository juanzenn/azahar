import { cn } from "@/lib/utils";

/**
 * The page gutter: a 1160px measure with generous side padding, matching the
 * locked visual direction. Every full-width band uses this to line its content
 * up with everything else on the page.
 */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1160px] px-7", className)}>
      {children}
    </div>
  );
}
