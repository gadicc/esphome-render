"use client";

import React from "react";
import { parse } from "yaml";
// @ts-expect-error: :/
import JSCPP, { CRuntime, Variable } from "JSCPP";
import { Render } from "./jrt";

console.log(JSCPP);

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

const models: {
  [key: string]: { [key: string]: { width: number; height: number } };
} = {
  ili9xxx: {
    S3BOX: {
      width: 320,
      height: 240,
    },
  },
};

// import src from "raw-loader!@/../tests/fixtures/s3b.yaml";

const src = `
display:
  - platform: ili9xxx
    model: S3BOX
    lambda: |-
      it.line(0, 0, 50, 50);
`;

const parsed = parse(src.replace(/(\S)#/g, "$1 #")) as ESPHomeConfig;

let context: { doc: { children: unknown[] } };
function initContext() {
  context = {
    doc: { children: [] },
  };
}

const config = {
  includes: {
    "display.h": {
      load: function (rt: CRuntime) {
        console.log("load", rt);

        const DisplayIt = rt.newClass("DisplayIt", []);

        const _line = function (
          rt: CRuntime,
          _this: Variable,
          x1: Variable,
          y1: Variable,
          x2: Variable,
          y2: Variable,
        ) {
          console.log("_this", _this);
          console.log("x1", x1);
          console.log(`line(${x1.v}, ${y1.v}, ${x2.v}, ${y2.v})`);
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

function process(parsed: ESPHomeConfig) {
  const display = parsed.display[0];
  const pages = display.pages;
  const pageIds = pages ? pages.map((page) => page.id) : [];
  return { display, pages, pageIds };
}

export default function Index() {
  console.log(parsed);

  const { display, pages, pageIds } = process(parsed);
  const [currentPageId, setCurrentPageId] = React.useState(pages?.[0] ?? "");
  const model = models[display.platform][display.model];

  const page = pages?.find((page) => page.id === currentPageId);
  const lambda = (page ? page.lambda : display.lambda) ?? "";

  const code = `
  #include "display.h"
  int main() {
    DisplayIt it;
    ${lambda}
    return 0;
  }`;
  console.log(code);

  initContext();
  const interpreter = JSCPP.run(code, "", config);
  console.log(context);

  return (
    <div>
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
      <h1>Page</h1>
      <svg
        style={{ border: "1px solid black", width: 300 }}
        viewBox={`0 0 ${model.width} ${model.height}`}
      >
        <Render doc={context.doc} />
      </svg>
    </div>
  );
}
