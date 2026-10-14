/** Theme-neutral textual Archeon mark shared by the app hub and all tools. */
export function ArcheonMark({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      a<span>.</span>
    </span>
  );
}
