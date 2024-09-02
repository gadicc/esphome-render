// @ts-expect-error: :/
import { CRuntime, Variable } from "JSCPP";
import { getContext } from "../util";

const idModule = {
  load: function (rt: CRuntime) {
    const context = getContext();
    const pchar = rt.normalPointerType(rt.charTypeLiteral);

    // TODO, remove?  super useful for now.
    if (typeof window === "object") {
      // @ts-expect-error: tmp
      window.rt = rt;
    }

    const idType = rt.newClass("Id", []);
    const typeSig = rt.getTypeSignature(idType);
    const typeEntry = rt.types[typeSig];
    typeEntry.father = "object";

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

    rt.regFunc(_id, "global", "id", [pchar], idType);

    function getValue(v: Variable) {
      if (v.t.type === "class" && v.t.name === "Id") {
        const entry = rt.getMember(v, "entry");
        // const id = rt.getStringFromCharArray(rt.getMember(v, "id"));
        // console.log("id", id, v, entry.state);
        return entry.state;
      }
      return v.v;
    }

    typeEntry.handlers["o(==)"] = {
      default(rt: CRuntime, a: Variable, b: Variable) {
        const _a = getValue(a);
        const _b = getValue(b);
        // console.log("id(==)", a, _a, b, _b);
        return rt.val(rt.boolTypeLiteral, _a == _b);
      },
    };

    const _bool = function (rt: CRuntime, _this: Variable) {
      return rt.val(rt.boolTypeLiteral, !!getValue(_this));
    };
    rt.regOperator(_bool, idType, "bool", [], rt.boolTypeLiteral);
  },
};

export default idModule;
