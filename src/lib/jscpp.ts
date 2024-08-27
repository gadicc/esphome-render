import React from "react";

// @ts-expect-error: :/
import JSCPP, { CRuntime, Variable, ArrayVariable } from "JSCPP";
import { ESPHomeConfig } from "./ESPHomeConfig";
import printf from "printf";

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

        const pchar = rt.normalPointerType(rt.charTypeLiteral);

        const _printf = function (
          rt: CRuntime,
          _this: Variable,
          x: Variable,
          y: Variable,
          font: Variable,
          format: Variable,
          ...params: Variable[]
        ) {
          // this would be better, but i couldn't figure out how to make correct target
          // const sprintf = rt.getFunc("global", "sprintf", [pchar, pchar, "?"]);
          // const target = rt.makeCharArrayFromString("                    ")
          // sprintf(rt, null, target, format, ...params);

          const _format = rt.getStringFromCharArray(format);
          const text = printf(
            _format,
            ...params.map((v) => {
              if (v.t.type === "primitive") return v.v;
              if (
                v.t.type === "pointer" &&
                v.t.ptrType === "array" &&
                v.t.eleType.name === "char"
              )
                return rt.getStringFromCharArray(v);
              console.warn("Returning unknown type, may or may not work", v);
              return v.v;
            }),
          );

          context.doc.children.push({
            type: "printf",
            x: x.v,
            y: y.v,
            font: font.v,
            text,
          });
        };

        rt.regFunc(
          _printf,
          DisplayIt,
          "printf",
          [
            rt.intTypeLiteral, // x
            rt.intTypeLiteral, // y
            rt.intTypeLiteral, // font TODO
            pchar, // format
            "?",
          ],
          rt.intTypeLiteral,
        );
      },
    },
  },
};

function prepareLambda(lambda: string) {
  return `
  #include "id.h"
  #include "display.h"
  #include "globals.h"
  #include <cstdio>
  using namespace std;

  int main() {
    DisplayIt it;
    ${lambda.replace(/id\((\w+)\)/g, 'id("$1")')}
    return 0;
  }`;
}

export function run(
  lambda: string,
  {
    globals,
    globalState,
  }: {
    globals: ESPHomeConfig["globals"];
    globalState: Record<string, unknown>;
  },
) {
  initContext();
  const code = prepareLambda(lambda);

  // @ts-expect-error: later
  config.includes["globals.h"] = {
    load: function (rt: CRuntime) {
      const varTypes = {
        bool: rt.boolTypeLiteral,
        int: rt.intTypeLiteral,
      };

      if (globals)
        globals.forEach((v) => {
          const type = varTypes[v.type];
          rt.defVar(
            v.id,
            type,
            rt.val(type, globalState[v.id] ?? v.initial_value),
          );
        });
    },
  };

  const interpreter = JSCPP.run(code, "", config);
  return { doc: context.doc };
}
