"use client";

import React from "react";
import { parse } from "yaml";
import Split from "@uiw/react-split";
import CodeMirror from "@/lib/codemirror";
import { getModel } from "@/lib/models";
import { run } from "@/lib/jscpp";
import { Render } from "./jrt";

// console.log(JSCPP);

interface ESPHomeConfig {
  [key: string]: unknown;
  display: [
    {
      platform: string;
      model: string;
      lambda?: string;
      pages?: {
        id: string;
        lambda: string;
      }[];
    },
  ];
}

// import src from "raw-loader!@/../tests/fixtures/s3b.yaml";

const defaultSrc = `display:
  - platform: ili9xxx
    model: S3BOX
    lambda: |-
      it.line(50, 50, 150, 150);
globals:
  - id: bool1
    type: bool
    initial_value: false
  - id: int1
    type: int
    initial_value: 10
`;

export default function Index() {
  const [src, setSrc] = React.useState(defaultSrc);
  const [parsed, setParsed] = React.useState({} as ESPHomeConfig);
  const [error, setError] = React.useState<Error | null>(null);
  const [doc, setDoc] = React.useState<ReturnType<typeof run>["doc"]>({
    children: [],
  });

  React.useEffect(() => {
    try {
      setParsed(parse(src.replace(/(\S)#/g, "$1 #")));
      setError(null);
    } catch (error) {
      console.log(error);
      setError(error as Error);
    }
  }, [src]);
  // console.log(parsed);

  const display = parsed.display?.[0];
  const pages = display?.pages;
  const pageIds = pages ? pages.map((page) => page.id) : [];

  const [currentPageId, setCurrentPageId] = React.useState(pages?.[0].id ?? "");
  const model = display && getModel(display.platform, display.model);
  const { width, height } = model ?? { width: 256, height: 256 };

  const page = pages?.find((page) => page.id === currentPageId);
  const lambda = (page ? page.lambda : display?.lambda) ?? "";

  React.useEffect(() => {
    // const parsed = cppParser.parse(lambda);
    // console.log(parsed);
  }, [lambda]);

  React.useEffect(() => {
    try {
      const { doc } = run(lambda);
      console.log("setDoc", doc);
      setDoc(doc);
      setError(null);
    } catch (error) {
      console.log(error);
      setError(error as Error);
    }
    // console.log(context);
  }, [lambda]);
  console.log("doc", doc);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Split>
        <div style={{ width: "50%" }}>
          <CodeMirror value={src} onChange={setSrc} />
          {error && (
            <div style={{ padding: 5 }}>
              {error.name}: {error.message}
            </div>
          )}
        </div>
        <div style={{ padding: 15 }}>
          <svg
            style={{ border: "1px solid black", width: 300 }}
            viewBox={`0 0 ${width} ${height}`}
          >
            <Render doc={doc} />
          </svg>
          <div>
            Model: {display?.model ?? "Unknown"} ({width}x{height})
          </div>
          <br />
          <select
            name="currentPageId"
            id="currentPageId"
            value={currentPageId}
            onChange={(e) => setCurrentPageId(e.target.value)}
          >
            {pageIds.map((pageId) => (
              <option key={pageId} value={pageId}>
                {pageId}
              </option>
            ))}
          </select>
        </div>
      </Split>
    </div>
  );
}
