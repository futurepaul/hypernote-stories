import { cn } from "../lib/utils";
import { type ReactNode } from "react";

export const SHOW_DEBUG_LAYOUT = false;

interface LayoutProps {
  children: ReactNode;
  className?: string;
  editor?: boolean;
}

export function LeftColumn({ children, className }: LayoutProps) {
  return (
    <div
      className={cn(
        "hidden col-start-1 col-end-2 md:block pointer-events-auto",
        SHOW_DEBUG_LAYOUT && "bg-red-500/20",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CenterColumn({ children, className }: LayoutProps) {
  return (
    <div
      className={cn(
        "absolute self-center flex item-center w-full justify-center col-start-1 col-end-2 md:col-start-2 md:col-end-3 z-20 md:static pointer-events-auto",
        SHOW_DEBUG_LAYOUT && "bg-blue-500/20 border border-pink-500",
        className
      )}
    >
      <div
        className={cn(
          "aspect-9/16 h-screen overflow-clip md:p-2",
          SHOW_DEBUG_LAYOUT && "bg-green-500/20 border-yellow-500 border"
        )}
      >
        <div
          className={cn(
            "aspect-9/16 w-full overflow-clip",
            SHOW_DEBUG_LAYOUT && "bg-green-500/20 border-red-500 border"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function RightColumn({ children, className, editor }: LayoutProps) {
  return (
    <div
      className={cn(
        "absolute flex item-center w-full justify-center col-start-1 col-end-2 md:col-start-3 md:col-end-4 md:static",
        SHOW_DEBUG_LAYOUT && "bg-green-500/20",
        className,
        editor && "md:w-auto"
      )}
    >
      <div
        className={cn(
          "h-screen aspect-9/16 overflow-clip flex flex-col",
          SHOW_DEBUG_LAYOUT && "bg-green-500/20",
          className,
          editor && "md:aspect-auto"
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface SingleRowProps {
  children?: ReactNode;
  className?: string;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  editor?: boolean;
}

export function SingleRow({ children, className, left, center, right, editor }: SingleRowProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] h-screen",
      SHOW_DEBUG_LAYOUT && "bg-pink-500/50 md:bg-pink-500/10",
      className
    )}>
      <LeftColumn>
        {left}
      </LeftColumn>
      
      <CenterColumn>
        {center}
      </CenterColumn>

      <RightColumn editor={editor}>
        {right}
      </RightColumn>
      {children}
    </div>
  );
} 