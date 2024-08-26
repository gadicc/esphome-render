"use client";

import React from "react";
import { parse } from "yaml";
// @ts-expect-error: :/
import JSCPP, { CRuntime, Variable } from "JSCPP";
import Split from "@uiw/react-split";
import CodeMirror from "@/lib/codemirror";
import { getModel } from "@/lib/models";
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

let context: { doc: { children: unknown[] } };
function initContext() {
  context = {
    doc: { children: [] },
  };
}

const config = {
  includes: {
    "id.h": {
      load: function (rt: CRuntime) {
        const pchar = rt.normalPointerType(rt.charTypeLiteral);

        console.log(rt);
        const _id = function (
          rt: CRuntime,
          _this: Variable,
          nameVar: Variable,
        ) {
          const vt = nameVar.v.target as Variable[];
          const name = vt
            .slice(0, vt.length - 1)
            .map((v) => String.fromCharCode(v.v))
            .join("");

          console.log('id("' + name + '")');
          return rt.val(rt.intTypeLiteral, 0);
        };

        rt.regFunc(_id, "global", "id", [pchar], rt.intTypeLiteral);
      },
    },
    "display.h": {
      load: function (rt: CRuntime) {
        // console.log("load", rt);
        const DisplayIt = rt.newClass("DisplayIt", []);

        const _line = function (
          rt: CRuntime,
          _this: Variable,
          x1: Variable,
          y1: Variable,
          x2: Variable,
          y2: Variable,
        ) {
          context.doc.children.push({
            type: "line",
            x1: x1.v,
            y1: y1.v,
            x2: x2.v,
            y2: y2.v,
          });
        };

        rt.regFunc(
          _line,
          DisplayIt,
          "line",
          [
            rt.intTypeLiteral,
            rt.intTypeLiteral,
            rt.intTypeLiteral,
            rt.intTypeLiteral,
          ],
          rt.intTypeLiteral,
        );
      },
    },
  },
};

function preprocessLambda(lambda: string) {
  return `
  #include "id.h"
  #include "display.h"
  int main() {
    DisplayIt it;
    ${lambda.replace(/id\((\w+)\)/g, 'id("$1")')}
    return 0;
  }`;
}
initContext();

export default function Index() {
  const [src, setSrc] = React.useState(defaultSrc);
  const [parsed, setParsed] = React.useState({} as ESPHomeConfig);
  const [error, setError] = React.useState<Error | null>(null);
  const [doc, setDoc] = React.useState({ children: [] });

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
    initContext();
    const code = preprocessLambda(lambda);
    // console.log(code);
    try {
      const interpreter = JSCPP.run(code, "", config);
      // @ts-expect-error: :/
      setDoc(context.doc);
      setError(null);
    } catch (error) {
      console.log(error);
      setError(error as Error);
    }
    // console.log(context);
  }, [lambda]);

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
            <Render doc={context.doc} />
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
