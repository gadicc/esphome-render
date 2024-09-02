"use client";

import React from "react";
import { parse } from "yaml";
import Split from "@uiw/react-split";
import CodeMirror from "@/lib/codemirror";
import { getModel } from "@/lib/models";
import { run } from "@/lib/jscpp";
import type { ESPHomeConfig } from "@/lib/ESPHomeConfig";
import type { Id } from "@/lib/util";
import { Render } from "./jrt";
import { IconButton, Switch, TextField, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";

// @ts-expect-error: its ok
import simpleExample from "raw-loader!./examples/simple.yaml";
// @ts-expect-error: its ok
import s3customExample from "raw-loader!./examples/s3custom.yaml";

// console.log(JSCPP);

function useIdStates(ids: Record<string, Id>) {
  const [state, setState] = React.useState<Record<string, unknown>>({});

  React.useEffect(() => {
    const next = {} as Record<string, unknown>;
    for (const id in ids) {
      if ("initial_value" in ids[id].entry)
        next[id] = JSON.parse(ids[id].entry.initial_value as string);
    }
    setState(next);
  }, [ids]);

  const setIdState = React.useCallback((id: string, value: unknown) => {
    console.log("setIdState", { id, value });
    setState((state) => ({ ...state, [id]: value }));
  }, []);

  return [state, setIdState] as const;
}

// TODO, rather do this in useEffect and only return a new object on change.
function collectIds(config: ESPHomeConfig) {
  const ids = {} as Record<string, Id>;
  for (const type of ["globals", "font", "color"] as Id["type"][]) {
    if (config?.[type] && Array.isArray(config[type])) {
      const entries = config[type];
      entries.forEach((entry) => {
        // @ts-expect-error: later
        ids[entry.id] = { type, entry };
      });
    }
  }
  // console.log(ids);
  return ids;
}

export default function Index() {
  const [src, setSrc] = React.useState(simpleExample);
  const [parsed, setParsed] = React.useState({} as ESPHomeConfig);
  const [error, setError] = React.useState<Error | null>(null);
  const docRef = React.useRef<ReturnType<typeof run>["doc"]>();
  const [doc, setDoc] = React.useState<ReturnType<typeof run>["doc"]>({
    children: [],
  });
  const _ids = React.useMemo(() => collectIds(parsed), [parsed]);
  const [state, setIdState] = useIdStates(_ids);
  const ids = React.useMemo(() => {
    const next = { ..._ids };
    for (const id in next) {
      // @ts-expect-error: later
      if (state[id] !== undefined) next[id] = { ...next[id], state: state[id] };
    }
    // console.log("merge ids", _ids, state, next);
    return next;
  }, [_ids, state]);

  // console.log("ids", ids);
  // console.log("doc", doc);

  const fontStyle = React.useMemo(() => {
    const byFamily = {} as Record<string, ESPHomeConfig["font"][0]>;
    parsed?.font?.forEach((font) => {
      // TODO, rather use hash of url
      // @ts-expect-error: later
      const fontFamily = font.file.split("/").pop().split(".ttf")[0];
      if (!font._fontFamily) font._fontFamily = fontFamily;
      if (!byFamily[fontFamily]) byFamily[fontFamily] = font;
    });

    // TODO, unique
    return (
      <style type="text/css">
        {Object.values(byFamily).map(
          (font) =>
            `@font-face {
              font-family: '${font._fontFamily}';
              src: url("${font.file.replace(/^https:\/\/github.com\/(.*)\/(.*)\/raw\/main\/(.*)/, "https://cdn.jsdelivr.net/gh/$1/$2/$3")}") format("truetype");
              crossorigin: 'anonymous';
            }`,
        )}
      </style>
    );
  }, [parsed?.font]);
  // console.log("fonts", fontStyle);

  React.useEffect(() => {
    const origSrc = src;
    try {
      let src = origSrc;
      // Add space before #, required by spec, not enforced by esphome
      src = src.replace(/(\S)#/g, "$1 #");
      setParsed(parse(src));
      setError(null);
    } catch (error) {
      console.log(error);
      setError(error as Error);
    }
  }, [src]);
  // console.log(parsed);

  const display = parsed?.display?.[0];
  const pages = display?.pages;
  const pageIds = React.useMemo(
    () => (pages ? pages.map((page) => page?.id) : []),
    [pages],
  );
  const [currentPageId, setCurrentPageId] = React.useState(
    pages?.[0]?.id ?? "",
  );
  React.useEffect(() => {
    if (!pageIds?.includes(currentPageId)) {
      setCurrentPageId(pageIds[0]);
    }
  }, [pageIds, currentPageId]);

  const model = display && getModel(display.platform, display.model);
  const { width, height } = model ?? { width: 256, height: 256 };
  const { COLOR_ON, COLOR_OFF } = model ?? {
    COLOR_ON: [255, 255, 255],
    COLOR_OFF: [0, 0, 0],
  };

  const page = pages?.find((page) => page?.id === currentPageId);
  const lambda = (page ? page.lambda : display?.lambda) ?? "";

  React.useEffect(() => {
    if (!lambda) {
      if (docRef?.current?.children.length) {
        const doc = { children: [] };
        docRef.current = doc;
        setDoc({ children: [] });
      }
      return;
    }
    try {
      const { doc } = run(lambda, {
        ids,
        color: parsed?.color,
        width,
        height,
        COLOR_ON,
        COLOR_OFF,
      });
      setDoc(doc);
      setError(null);
      docRef.current = doc;
    } catch (error) {
      console.log(error);
      setError(error as Error);
    }
    // console.log(context);
  }, [lambda, ids, width, height, COLOR_ON, COLOR_OFF, parsed?.color]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Split style={{ height: "100%" }}>
        <div style={{ height: "100%", width: "50%", overflow: "auto" }}>
          <div style={{ padding: 10 }}>
            <button onClick={() => setSrc("")}>Clear</button>{" "}
            <button onClick={() => setSrc(simpleExample)}>Simple</button>{" "}
            <button onClick={() => setSrc(s3customExample)}>
              S3 Custom (WIP)
            </button>
          </div>
          <CodeMirror value={src} onChange={setSrc} />
        </div>
        <div style={{ height: "100%", padding: 15, overflow: "auto" }}>
          <svg
            style={{ border: "1px solid black", width: 300 }}
            viewBox={`0 0 ${width} ${height}`}
          >
            <defs>{fontStyle}</defs>
            <Render doc={doc} />
          </svg>
          <div>
            Model: {display?.model ?? "Unknown"} ({width}x{height})
          </div>
          <br />
          {pageIds.length ? (
            <select
              name="currentPageId"
              id="currentPageId"
              value={currentPageId}
              onChange={(e) => setCurrentPageId(e.target.value)}
              style={{ marginBottom: 15 }}
            >
              {pageIds.map((pageId) => (
                <option key={pageId} value={pageId}>
                  {pageId}
                </option>
              ))}
            </select>
          ) : null}
          {Object.values(state).length ? (
            <div>
              <Typography variant="h6">State</Typography>
              <table cellSpacing={5}>
                <tbody>
                  {Object.entries(ids)
                    .filter(([, data]) => "state" in data)
                    // @ts-expect-error: later... state in data
                    .map(([id, { entry, state }]) => (
                      <tr key={id}>
                        <td align="right">
                          <label htmlFor={id}>{id}</label>
                        </td>
                        <td>
                          {/* @ts-expect-error: later */}
                          {entry.type === "bool" ? (
                            <Switch
                              checked={!!state}
                              onChange={(e) => setIdState(id, e.target.checked)}
                            />
                          ) : // @ts-expect-error: later
                          entry.type === "int" ? (
                            <TextField
                              size="small"
                              type="number"
                              sx={{ width: 100 }}
                              value={state.toString() ?? ""}
                              onChange={(e) =>
                                setIdState(id, parseInt(e.target.value))
                              }
                            />
                          ) : (
                            <TextField
                              size="small"
                              value={state ?? ""}
                              onChange={(e) => setIdState(id, e.target.value)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </Split>
      {error && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            border: "1px solid #aaa",
            borderRadius: 5,
            margin: 15,
            padding: 15,
            paddingRight: 30,
            background: "rgba(255, 240, 240, 0.95)",
            zIndex: 100,
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
          }}
        >
          <IconButton
            style={{ position: "absolute", top: 0, right: 0 }}
            onClick={() => setError(null)}
          >
            <Close />
          </IconButton>
          {error.name}: {error.message}
        </div>
      )}
    </div>
  );
}
