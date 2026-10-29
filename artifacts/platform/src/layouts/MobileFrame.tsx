import type { ReactNode } from "react";

// h-screen + overflow-hidden is required so <main> becomes the scroll container; min-h-screen breaks sticky header/footer.
export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-full bg-muted/40 overflow-hidden">
      <div className="mx-auto w-full max-w-[440px] h-full bg-background shadow-md flex flex-col">
        {children}
      </div>
    </div>
  );
}
