"use client";

import React from "react";
import { parse } from "yaml";
import JSCPP, { CRuntime } from "JSCPP";
console.log(JSCPP);

const models = {
  ili9xxx: {
    S3BOX: {
      width: 320,
      height: 240,
    },
  },
};

//import src from "raw-loader!@/../tests/fixtures/s3b.yaml";

const src = `
display:
  - platform: ili9xxx
    model: S3BOX
    lambda: |-
      it.line(0, 0, 50, 50);
`;

const parsed = parse(src.replace(/(\S)#/g, "$1 #"));

const config = {
  includes: {
    "myheader.h": {
      load: function (rt: CRuntime) {
        console.log("load", rt);

        const it_line = function (
          rt: CRuntime,
          _this: unknown,
          x1: number,
          x2: number,
          y1: number,
          y2: number,
        ) {
          console.log("_this", _this);
          console.log("x1", x1);
          console.log(`line(${x1.v}, ${y1.v}, ${x2.v}, ${y2.v})`);
        };

        rt.regFunc(
          it_line,
          "global",
          "it_line",
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

function process(parsed: any) {
  const display = parsed.display[0];
  const pages = display.pages;
  const pageIds = pages ? pages.map((page) => page.id) : [];
  return { display, pages, pageIds };
}

export default function Index() {
  const { display, pages, pageIds } = process(parsed);
  const [currentPageId, setCurrentPageId] = React.useState(pages?.[0] ?? "");
  console.log(parsed);
  console.log(pageIds);

  const lambda = display.lambda;
  const code =
    '#include "myheader.h"\nint main() {\n' +
    lambda.replace(/it\.line/g, "it_line") +
    "\nreturn 0;\n}";
  console.log(code);
  const interpreter = JSCPP.run(code, "", config);

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
    </div>
  );
}
