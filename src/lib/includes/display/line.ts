// @ts-expect-error: :/
import type { CRuntime, Variable } from "JSCPP";
import type { DisplayContext } from ".";

export default {
  load(rt: CRuntime, ctx: DisplayContext) {
    const { context, DisplayIt } = ctx;

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
};
