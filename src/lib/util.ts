// @ts-expect-error: :/
import { CRuntime, ObjectVariable } from "JSCPP";
import { ESPHomeConfig } from "./ESPHomeConfig";

export type Id =
  | { type: "font"; entry: ESPHomeConfig["font"][0] }
  | { type: "globals"; entry: ESPHomeConfig["globals"][0] }
  | { type: "color"; entry: ESPHomeConfig["color"][0] };

// TODO, better name
interface Extra {
  width: number;
  height: number;
  COLOR_ON: [number, number, number];
  COLOR_OFF: [number, number, number];
}

let context: {
  doc: { children: unknown[] };
  ids: Record<string, Id>;
  extra: Extra;
};

export function initContext(ids: Record<string, Id>, extra: Extra) {
  context = {
    ids,
    doc: { children: [] },
    extra,
  };
}

export function getContext() {
  return context;
}

// TODO (maybe): Could also resolve an id if an id otherwise return orig?
export function _resolveId(rt: CRuntime, v: ObjectVariable) {
  if (!(v.t.type === "class" && v.t.name === "Id"))
    throw new Error("not an id: " + JSON.stringify(v));
  const idVar = rt.getMember(v, "id");
  const id = rt.getStringFromCharArray(idVar);
  const resolved = context.ids[id];
  if (resolved === undefined) throw new Error("id not found in context: " + id);
  return resolved;
}

export function _resolveColor(rt: CRuntime, v: ObjectVariable) {
  if (!v) return null;

  if (v.t.type === "class" && v.t.name === "Color") {
    const red = rt.getMember(v, "red").v;
    const green = rt.getMember(v, "green").v;
    const blue = rt.getMember(v, "blue").v;
    return (
      "#" +
      [red, green, blue].map((v) => v.toString(16).padStart(2, "0")).join("")
    );
  }

  const resolved = _resolveId(rt, v);
  if (resolved.type !== "color")
    throw new Error("not a color: " + JSON.stringify(v));
  const color = resolved.entry;
  if (color.hex !== undefined) return "#" + color.hex;
  throw new Error("Unimplemented color resolver for: " + JSON.stringify(color));
}
