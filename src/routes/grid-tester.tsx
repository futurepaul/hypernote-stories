import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "../lib/utils";
import { SingleRow, SHOW_DEBUG_LAYOUT } from "../components/GridLayout";

export const Route = createFileRoute("/grid-tester")({
  component: GridComponent,
});

function DebugRow() {
  const [showDebug, setShowDebug] = useState(false);

  const leftContent = showDebug && (
    <div className={cn(
      "w-full h-full flex flex-col justify-center",
      SHOW_DEBUG_LAYOUT && "bg-green-500/20"
    )}>
      <pre className={cn(
        "flex flex-col gap-2 whitespace-pre-wrap w-full break-all",
        SHOW_DEBUG_LAYOUT && "bg-red-500"
      )}>
        this is a bunch of text
        hhhhhhhhhhhhadsfadsfadsfasdfasdisasdfadsfadsfassssssssssssssssssss
      </pre>
    </div>
  );

  const centerContent = (
    <>
      <div className={cn(
        "w-full",
        SHOW_DEBUG_LAYOUT && "bg-red-500/10"
      )}>testing 123</div>
      <div className={cn(
        "h-full",
        SHOW_DEBUG_LAYOUT && "bg-blue-500/10"
      )}>testing 456</div>
    </>
  );

  const rightContent = (
    <div className={cn(
      "flex flex-col gap-2 justify-between self-end md:self-start h-full max-w-20 p-2",
      SHOW_DEBUG_LAYOUT && "bg-red-500/20"
    )}>
      <div className={cn(
        "flex flex-col gap-2",
        SHOW_DEBUG_LAYOUT && "bg-pink-500"
      )}>
        <button className={cn(
          "",
          SHOW_DEBUG_LAYOUT && "bg-blue-500"
        )}>button 1</button>
        <button className={cn(
          "",
          SHOW_DEBUG_LAYOUT && "bg-blue-500"
        )}>button 2</button>
      </div>
      <div className={cn(
        "flex flex-col gap-2",
        SHOW_DEBUG_LAYOUT && "bg-pink-500"
      )}>
        <button
          className={cn(
            "",
            SHOW_DEBUG_LAYOUT && "bg-blue-500"
          )}
          onClick={() => setShowDebug(!showDebug)}
        >
          Show Debug
        </button>
        <button className={cn(
          "",
          SHOW_DEBUG_LAYOUT && "bg-blue-500"
        )}>button 2</button>
      </div>
    </div>
  );

  return (
    <SingleRow
      left={leftContent}
      center={centerContent}
      right={rightContent}
    />
  );
}

function GridComponent() {
  return (
    <>
      <DebugRow />
      <DebugRow />
      <DebugRow />
      <DebugRow />
      <DebugRow />
      <DebugRow />
      <DebugRow />
      <DebugRow />
    </>
  );
}
