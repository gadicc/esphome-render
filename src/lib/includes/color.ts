// @ts-expect-error: :/
import { CRuntime, Variable } from "JSCPP";

// https://esphome.io/api/color_8h_source
// https://esphome.io/api/structesphome_1_1_color

export default {
  load(rt: CRuntime) {
    // NB: esphome color.h uses a union for very convenient aliases but
    // we can't represent that in JavaScript.  So, we should consider
    // a Proxy over color object to also handle: r,g,b, raw[4], raw_32.
    const Color = rt.newClass("Color", [
      {
        name: "red",
        type: rt.intTypeLiteral,
      },
      {
        name: "green",
        type: rt.intTypeLiteral,
      },
      {
        name: "blue",
        type: rt.intTypeLiteral,
      },
      {
        name: "white",
        type: rt.intTypeLiteral,
      },
    ]);
    const typeSig = rt.getTypeSignature(Color);
    rt.types[typeSig].father = "object";

    rt.registerTypedef(Color, "color");

    const _color = function (
      rt: CRuntime,
      _this: Variable,
      red: Variable,
      green: Variable,
      blue: Variable,
    ) {
      return {
        t: { type: "class", name: "Color" },
        v: {
          members: { red, green, blue },
        },
      };
    };

    rt.regFunc(
      _color,
      "global",
      "Color",
      [rt.intTypeLiteral, rt.intTypeLiteral, rt.intTypeLiteral],
      Color,
    );
  },
};
