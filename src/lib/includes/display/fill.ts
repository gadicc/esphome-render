// @ts-expect-error: :/
import type { CRuntime, Variable } from "JSCPP";
import type { DisplayContext } from ".";

const fill = {
  load(rt: CRuntime, ctx: DisplayContext) {
    const { context, DisplayIt, resolveColor } = ctx;

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
    rt.regFunc(
      _fill,
      DisplayIt,
      "fill",
      [{ type: "class", name: "Color" }],
      rt.intTypeLiteral,
    );
  },
};

export default fill;
