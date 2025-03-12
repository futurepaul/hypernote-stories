import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/grid-tester")({
  component: GridComponent,
});

function GridComponent() {
  return (
    <>
      <SingleRow />
      <SingleRow />
      <SingleRow />
      <SingleRow />
      <SingleRow />
      <SingleRow />
      <SingleRow />
      <SingleRow />
    </>
  );
}

function SingleRow() {
  const [showDebug, setShowDebug] = useState(false);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-screen bg-pink-500/50 md:bg-pink-500/10">
      <div className="absolute bg-red-500/20 w-full z-10 col-start-1 col-end-2 h-full md:static">
        {showDebug && (
          <div className="bg-green-500/20 w-full h-full flex flex-col justify-center">
            <pre className="bg-red-500 flex flex-col gap-2 whitespace-pre-wrap w-full break-all">
              this is a bunch of text
              hhhhhhhhhhhhadsfadsfadsfasdfasdisasdfadsfadsfassssssssssssssssssss
            </pre>
          </div>
        )}
      </div>
      <div className="absolute bg-blue-500/20 flex item-center w-full justify-center col-start-1 col-end-2 md:col-start-2 md:col-end-3 z-20 md:static">
        <div className="bg-green-500/20 aspect-9/16 h-screen overflow-clip">
          <div className="bg-red-500/10 w-full">testing 123</div>
          <div className="bg-blue-500/10 h-full">testing 456</div>
        </div>
      </div>
      <div className="absolute bg-green-500/20 flex item-center w-full justify-center col-start-1 col-end-2 md:col-start-3 md:col-end-4 z-30 md:static">
        <div className="bg-green-500/20 aspect-9/16 h-screen overflow-clip flex flex-col">
          <div className="bg-red-500/20 flex flex-col gap-2 justify-between self-end md:self-start h-full max-w-20 p-2">
            <div className="bg-pink-500 flex flex-col gap-2">
              <button className="bg-blue-500">button 1</button>
              <button className="bg-blue-500">button 2</button>
            </div>
            <div className="bg-pink-500 flex flex-col gap-2">
              <button
                className="bg-blue-500"
                onClick={() => setShowDebug(!showDebug)}
              >
                Show Debug
              </button>
              <button className="bg-blue-500">button 2</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
