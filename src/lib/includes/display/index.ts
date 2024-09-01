// @ts-expect-error: :/
import type { CRuntime, ObjectVariable } from "JSCPP";
import { _resolveId, _resolveColor, getContext, Id } from "../../util";

import line from "./line";
import printf from "./printf";
import fill from "./fill";

export interface DisplayContext {
  context: ReturnType<typeof getContext>;
  resolveId: (v: ObjectVariable) => Id;
  resolveColor: (v: ObjectVariable) => string | null;
  DisplayIt: ReturnType<typeof CRuntime>["newClass"];
}

const index = {
  load: function (rt: CRuntime) {
    const context = getContext();
    const resolveId = _resolveId.bind(null, rt);
    const resolveColor = _resolveColor.bind(null, rt);
    const DisplayIt = rt.newClass("DisplayIt", []);

    // console.log("load", rt);
    const displayContext = { context, resolveId, resolveColor, DisplayIt };
    line.load(rt, displayContext);
    printf.load(rt, displayContext);
    fill.load(rt, displayContext);
  },
};

export default index;
