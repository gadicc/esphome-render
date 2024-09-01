// @ts-expect-error: :/
import JSCPP, { CRuntime } from "JSCPP";
import { ESPHomeConfig } from "./ESPHomeConfig";
import { getContext, Id, initContext } from "./util";

import includes from "./includes";

const config = {
  includes,
};

// https://github.com/esphome/esphome/blob/caaae59ea9db397bc80e6e51504bd698ece059f3/esphome/core/__init__.py#L273
const LAMBDA_PROG = /id\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)(\.?)/g;
// https://github.com/esphome/esphome/blob/caaae59ea9db397bc80e6e51504bd698ece059f3/esphome/config_validation.py#L1437
// const LAMBDA_ENTITY_ID_PROG = /\Wid\(\s*([a-zA-Z0-9_]+\.[.a-zA-Z0-9_]+)\s*\)/g;

function prepareLambda(lambda: string, color: ESPHomeConfig["color"] = []) {
  const context = getContext();
  const colors = color.map((c) => {
    if (c.hex !== undefined) {
      const hex = c.hex.toString().padStart(6, "0");
      return {
        id: c.id,
        red: Number("0x" + hex.substring(0, 2)),
        green: Number("0x" + hex.substring(2, 4)),
        blue: Number("0x" + hex.substring(4, 6)),
      };
    }
    throw new Error(
      "prepareLambda: Unimplemented color resolver for: " + JSON.stringify(c),
    );
  });

  return `
  #include "id.h"
  #include "display.h"
  #include "globals.h"
  #include "color.h"
  #include <cstdio>
  using namespace std;

  int main() {
    DisplayIt it;
    color COLOR_BLACK = Color(0, 0, 0);
    color COLOR_WHITE = Color(255, 255, 255);
    color COLOR_ON = Color(${context.extra.COLOR_ON.join(", ")});
    color COLOR_OFF = Color(${context.extra.COLOR_OFF.join(", ")});
    ${colors.map((c) => `color ${c.id} = Color(${c.red}, ${c.green}, ${c.blue});`).join("\n")}
    ${lambda
      .replace(LAMBDA_PROG, 'id("$1")')
      // JSCPP doesn't seem to support / decode large unicode ranges
      .replace(/\\U([0-9A-Fa-f]{8,8})/g, (_, hexStr) => {
        return String.fromCodePoint(Number("0x" + hexStr));
      })
      .replace(/auto\s+(\w+\s*=\s*Color\s*\()/g, "color $1")
      .replace(/Color::BlACK/g, "COLOR_BLACK")
      .replace(/Color::WHITE/g, "COLOR_WHITE")}
    return 0;
  }`;
}

export function run(
  lambda: string,
  {
    globals,
    globalState,
    color,
    ids,
    width,
    height,
    COLOR_ON,
    COLOR_OFF,
  }: {
    globals: ESPHomeConfig["globals"];
    globalState: Record<string, unknown>;
    color: ESPHomeConfig["color"];
    ids: Record<string, Id>;
    width: number;
    height: number;
    COLOR_ON: [number, number, number];
    COLOR_OFF: [number, number, number];
  },
) {
  initContext(ids, { width, height, COLOR_ON, COLOR_OFF });
  const code = prepareLambda(lambda, color);
  // console.log("code", code);

  // @ts-expect-error: later
  config.includes["globals.h"] = {
    load: function (rt: CRuntime) {
      const varTypes = {
        bool: rt.boolTypeLiteral,
        int: rt.intTypeLiteral,
        "std::string": rt.normalPointerType(rt.charTypeLiteral),
      };

      if (globals)
        globals.forEach((v) => {
          const type = varTypes[v.type];
          rt.defVar(
            v.id,
            type,
            v.type === "std::string"
              ? rt.makeCharArrayFromString(globalState[v.id] ?? v.initial_value)
              : rt.val(type, globalState[v.id] ?? v.initial_value),
          );
        });
    },
  };

  // const interpreter =
  JSCPP.run(code, "", config);
  return { doc: getContext().doc };
}
