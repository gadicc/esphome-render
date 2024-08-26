"use client";

import React from "react";
import { parse } from "yaml";
import Split from "@uiw/react-split";
import CodeMirror from "@/lib/codemirror";
import { getModel } from "@/lib/models";
import { run } from "@/lib/jscpp";
import type { ESPHomeConfig } from "@/lib/ESPHomeConfig";
import { Render } from "./jrt";
import { Switch, TextField, Typography } from "@mui/material";

// console.log(JSCPP);

// import src from "raw-loader!@/../tests/fixtures/s3b.yaml";

const defaultSrc = `display:
  - platform: ili9xxx
    model: S3BOX
    lambda: |-
      if (show)
        it.line(50, 50, x2, 150);

globals:
  - id: show
    type: bool
    initial_value: true
  - id: x2
    type: int
    initial_value: 150
`;

function useGlobals(globals: ESPHomeConfig["globals"]) {
  const [state, setState] = React.useState<Record<string, unknown>>({});

  React.useEffect(() => {
    if (globals) {
      const next = globals.reduce(
        (acc, { id, initial_value }) => {
          acc[id] = initial_value;
          return acc;
        },
        {} as Record<string, unknown>,
      );
      setState(next);
    }
  }, [globals]);

  const setGlobal = React.useCallback((id: string, value: any) => {
    console.log({ id, value });
    setState((state) => ({ ...state, [id]: value }));
  }, []);

  return [state, setGlobal] as const;
}

export default function Index() {
  const [src, setSrc] = React.useState(defaultSrc);
  const [parsed, setParsed] = React.useState({} as ESPHomeConfig);
  const [error, setError] = React.useState<Error | null>(null);
  const [doc, setDoc] = React.useState<ReturnType<typeof run>["doc"]>({
    children: [],
  });
  const [globals, setGlobal] = useGlobals(parsed.globals);
  console.log("globals", globals);

  React.useEffect(() => {
    try {
      setParsed(parse(src.replace(/(\S)#/g, "$1 #")));
      setError(null);
    } catch (error) {
      console.log(error);
      setError(error as Error);
    }
  }, [src]);
  // console.log(parsed);

  const display = parsed.display?.[0];
  const pages = display?.pages;
  const pageIds = pages ? pages.map((page) => page.id) : [];

  const [currentPageId, setCurrentPageId] = React.useState(pages?.[0].id ?? "");
  const model = display && getModel(display.platform, display.model);
  const { width, height } = model ?? { width: 256, height: 256 };

  const page = pages?.find((page) => page.id === currentPageId);
  const lambda = (page ? page.lambda : display?.lambda) ?? "";

  React.useEffect(() => {
    // const parsed = cppParser.parse(lambda);
    // console.log(parsed);
  }, [lambda]);

  React.useEffect(() => {
    try {
      const { doc } = run(lambda, {
        globals: parsed.globals,
        globalState: globals,
      });
      setDoc(doc);
      setError(null);
    } catch (error) {
      console.log(error);
      setError(error as Error);
    }
    // console.log(context);
  }, [lambda, parsed.globals, globals]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Split>
        <div style={{ width: "50%" }}>
          <CodeMirror value={src} onChange={setSrc} />
          {error && (
            <div style={{ padding: 5 }}>
              {error.name}: {error.message}
            </div>
          )}
        </div>
        <div style={{ padding: 15 }}>
          <svg
            style={{ border: "1px solid black", width: 300 }}
            viewBox={`0 0 ${width} ${height}`}
          >
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
            >
              {pageIds.map((pageId) => (
                <option key={pageId} value={pageId}>
                  {pageId}
                </option>
              ))}
            </select>
          ) : null}
          {parsed.globals ? (
            <div>
              <Typography variant="h6">Globals</Typography>
              <table cellSpacing={5}>
                <tbody>
                  {parsed.globals.map(({ id, type }) => (
                    <tr key={id}>
                      <td align="right">
                        <label htmlFor={id}>{id}</label>
                      </td>
                      <td>
                        {type === "bool" ? (
                          <Switch
                            checked={!!globals[id]}
                            onChange={(e) => setGlobal(id, e.target.checked)}
                          />
                        ) : (
                          <TextField
                            size="small"
                            type="number"
                            sx={{ width: 100 }}
                            value={globals[id]?.toString()}
                            onChange={(e) => setGlobal(id, e.target.value)}
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
    </div>
  );
}
