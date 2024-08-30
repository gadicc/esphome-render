import React from "react";

// @ts-expect-error: :/
import JSCPP, { CRuntime, Variable, ObjectVariable } from "JSCPP";
import { ESPHomeConfig } from "./ESPHomeConfig";
import printf from "printf";

export type Id =
  | { type: "font"; entry: ESPHomeConfig["font"][0] }
  | { type: "globals"; entry: ESPHomeConfig["globals"][0] }
  | { type: "color"; entry: ESPHomeConfig["color"][0] };

let context: {
  doc: { children: unknown[] };
  ids: Record<string, Id>;
  extra: Record<string, unknown>;
};
function initContext(ids: Record<string, Id>, extra: Record<string, unknown>) {
  context = {
    ids,
    doc: { children: [] },
    extra,
  };
}

// TODO (maybe): Could also resolve an id if an id otherwise return orig?
function _resolveId(rt: CRuntime, v: ObjectVariable) {
  if (!(v.t.type === "class" && v.t.name === "Id"))
    throw new Error("not an id: " + JSON.stringify(v));
  const idVar = rt.getMember(v, "id");
  const id = rt.getStringFromCharArray(idVar);
  const resolved = context.ids[id];
  if (resolved === undefined) throw new Error("id not found in context: " + id);
  return resolved;
}

function _resolveColor(rt: CRuntime, v: ObjectVariable) {
  if (!v) return null;
  const resolved = _resolveId(rt, v);
  if (resolved.type !== "color")
    throw new Error("not a color: " + JSON.stringify(v));
  const color = resolved.entry;
  if (color.hex !== undefined) return "#" + color.hex;
  throw new Error("Unimplemented color resolver for: " + JSON.stringify(color));
}

const config = {
  includes: {
    "id.h": {
      load: function (rt: CRuntime) {
        const pchar = rt.normalPointerType(rt.charTypeLiteral);

        const type = rt.newClass("Id", [
          {
            name: "id",
            type: pchar,
          },
        ]);
        const typeSig = rt.getTypeSignature(type);
        rt.types[typeSig].father = "object";

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

          // console.log('id("' + name + '")');
          return {
            t: { type: "class", name: "Id" },
            v: {
              members: {
                id: rt.makeCharArrayFromString(name),
                entry: context.ids[name],
              },
            },
          };
        };

        // rt.regFunc(_id, "global", "id", [pchar], pchar);
        rt.regFunc(_id, "global", "id", [pchar], type);
      },
    },
    "display.h": {
      load: function (rt: CRuntime) {
        const resolveId = _resolveId.bind(null, rt);
        const resolveColor = _resolveColor.bind(null, rt);
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
          color: Variable,
          format: Variable,
          ...params: Variable[]
        ) {
          // this would be better, but i couldn't figure out how to make correct target
          // const sprintf = rt.getFunc("global", "sprintf", [pchar, pchar, "?"]);
          // const target = rt.makeCharArrayFromString("                    ")
          // sprintf(rt, null, target, format, ...params);

          const _font = resolveId(font);
          const _color = resolveColor(color);

          const _format = rt.getStringFromCharArray(format);
          // console.log("format", _format, format);

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
            // @ts-expect-error: TODO
            fontFamily: _font.entry._fontFamily,
            // Default: 20 (https://esphome.io/components/font#display-fonts)
            // @ts-expect-error: TODO
            fontSize: _font.entry.size || 20,
            text,
            color: _color,
          });
        };

        rt.regFunc(
          _printf,
          DisplayIt,
          "printf",
          [
            rt.intTypeLiteral, // x
            rt.intTypeLiteral, // y
            { type: "class", name: "Id" }, // font
            { type: "class", name: "Id" }, // color
            pchar, // format
            "?",
          ],
          rt.intTypeLiteral,
        );

        function _printfFormatOnly(
          rt: CRuntime,
          _this: Variable,
          x: Variable,
          y: Variable,
          font: Variable,
          format: Variable,
          ...params: Variable[]
        ) {
          _printf(rt, _this, x, y, font, null, format, ...params);
        }

        rt.regFunc(
          _printfFormatOnly,
          DisplayIt,
          "printf",
          [
            rt.intTypeLiteral, // x
            rt.intTypeLiteral, // y
            { type: "class", name: "Id" }, // font
            pchar, // format
            "?",
          ],
          rt.intTypeLiteral,
        );

        function _fill(rt: CRuntime, _this: Variable, color: Variable) {
          context.doc.children.push({
            type: "rect",
            x: 0,
            y: 0,
            width: context.extra.width,
            height: context.extra.height,
            fill: resolveColor(color),
          });
        }

        rt.regFunc(
          _fill,
          DisplayIt,
          "fill",
          [
            { type: "class", name: "Id" }, // color
          ],
          rt.intTypeLiteral,
        );
      },
    },
  },
};

// https://github.com/esphome/esphome/blob/caaae59ea9db397bc80e6e51504bd698ece059f3/esphome/core/__init__.py#L273
const LAMBDA_PROG = /id\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)(\.?)/g;
// https://github.com/esphome/esphome/blob/caaae59ea9db397bc80e6e51504bd698ece059f3/esphome/config_validation.py#L1437
const LAMBDA_ENTITY_ID_PROG = /\Wid\(\s*([a-zA-Z0-9_]+\.[.a-zA-Z0-9_]+)\s*\)/g;

function prepareLambda(lambda: string) {
  return `
  #include "id.h"
  #include "display.h"
  #include "globals.h"
  #include <cstdio>
  using namespace std;

  int main() {
    DisplayIt it;
    ${lambda
      .replace(LAMBDA_PROG, 'id("$1")')
      // JSCPP doesn't seem to support / decode large unicode ranges
      .replace(/\\U([0-9A-Fa-f]{8,8})/g, (_, hexStr) => {
        return String.fromCodePoint(Number("0x" + hexStr));
      })}
    return 0;
  }`;
}

export function run(
  lambda: string,
  {
    globals,
    globalState,
    ids,
    width,
    height,
  }: {
    globals: ESPHomeConfig["globals"];
    globalState: Record<string, unknown>;
    ids: Record<string, Id>;
    width: number;
    height: number;
  },
) {
  initContext(ids, { width, height });
  const code = prepareLambda(lambda);

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

  const interpreter = JSCPP.run(code, "", config);
  return { doc: context.doc };
}
