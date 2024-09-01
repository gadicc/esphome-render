// @ts-expect-error: :/
import type { CRuntime, Variable } from "JSCPP";
import printf from "printf";

import type { DisplayContext } from ".";

const printfModule = {
  load(rt: CRuntime, ctx: DisplayContext) {
    const pchar = rt.normalPointerType(rt.charTypeLiteral);
    const { context, DisplayIt, resolveId, resolveColor } = ctx;

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
    rt.regFunc(
      _printf,
      DisplayIt,
      "printf",
      [
        rt.intTypeLiteral, // x
        rt.intTypeLiteral, // y
        { type: "class", name: "Id" }, // font
        { type: "class", name: "Color" }, // color
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
  },
};

export default printfModule;
