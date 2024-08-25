"use client";

import React from "react";
import { parse } from "yaml";
// @ts-expect-error: :/
import JSCPP, { CRuntime, Variable } from "JSCPP";
import Split from "@uiw/react-split";
import CodeMirror from "@uiw/react-codemirror";
import { Render } from "./jrt";

import { parser as yamlParser } from "@lezer/yaml";
import { parser as cppParser } from "@lezer/cpp";
import { parseMixed } from "@lezer/common";
import { LRLanguage } from "@codemirror/language";

const mixedYamlParser = yamlParser.configure({
  wrap: parseMixed((node) => {
    // console.log(node.from, node.name, node);
    return node.name === "BlockLiteralContent" ? { parser: cppParser } : null;
  }),
});

const mixedYaml = LRLanguage.define({ parser: mixedYamlParser });

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

const defaultSrc = `display:
  - platform: ili9xxx
    model: S3BOX
    lambda: |-
      it.line(0, 0, 50, 50);
`;

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

// const extensions = [yaml(), cpp()];
const extensions = [mixedYaml];

function wrapLambda(lambda: string) {
  return `
  #include "display.h"
  int main() {
    DisplayIt it;
    ${lambda}
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
  console.log(parsed);

  const display = parsed.display?.[0];
  const pages = display?.pages;
  const pageIds = pages ? pages.map((page) => page.id) : [];

  const [currentPageId, setCurrentPageId] = React.useState(pages?.[0].id ?? "");
  const model = display && models[display.platform][display.model];
  const { width, height } = model ?? { width: 256, height: 256 };

  const page = pages?.find((page) => page.id === currentPageId);
  const lambda = (page ? page.lambda : display?.lambda) ?? "";

  React.useEffect(() => {
    initContext();
    const code = wrapLambda(lambda);
    try {
      const interpreter = JSCPP.run(code, "", config);
      // @ts-expect-error: :/
      setDoc(context.doc);
      setError(null);
    } catch (error) {
      console.log(error);
      setError(error as Error);
    }
    console.log(context);
  }, [lambda]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Split>
        <div style={{ width: "50%" }}>
          <CodeMirror value={src} onChange={setSrc} extensions={extensions} />
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
