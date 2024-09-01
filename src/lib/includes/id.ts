// @ts-expect-error: :/
import { CRuntime, Variable } from "JSCPP";
import { getContext } from "../util";

const idModule = {
  load: function (rt: CRuntime) {
    const context = getContext();
    const pchar = rt.normalPointerType(rt.charTypeLiteral);

    const type = rt.newClass("Id", [
      {
        name: "id",
        type: pchar,
      },
    ]);
    const typeSig = rt.getTypeSignature(type);
    rt.types[typeSig].father = "object";

    const _id = function (rt: CRuntime, _this: Variable, nameVar: Variable) {
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
};

export default idModule;
