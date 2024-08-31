// @ts-expect-error: :/
import type { CRuntime, Variable } from "JSCPP";
import type { DisplayContext } from ".";
import { componentsToHex } from "../color";

export default {
  load(rt: CRuntime, ctx: DisplayContext) {
    const { context, DisplayIt, resolveColor } = ctx;

    const _line = function (
      rt: CRuntime,
      _this: Variable,
      x1: Variable,
      y1: Variable,
      x2: Variable,
      y2: Variable,
      color: Variable | null,
    ) {
      const _color =
        resolveColor(color) || componentsToHex(...context.extra.COLOR_ON);

      context.doc.children.push({
        type: "line",
        x1: x1.v,
        y1: y1.v,
        x2: x2.v,
        y2: y2.v,
        stroke: _color,
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
        // Would be better to have a separate signature for color
        // but had some issues with that.  TODO try again another time.
        "?",
      ],
      rt.intTypeLiteral,
    );
  },
};
