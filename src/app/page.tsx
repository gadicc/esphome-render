"use client";

import React from "react";
import { parse } from "yaml";
import Split from "@uiw/react-split";
import CodeMirror from "@/lib/codemirror";
import { getModel } from "@/lib/models";
import { run } from "@/lib/jscpp";
import type { ESPHomeConfig } from "@/lib/ESPHomeConfig";
import type { Id } from "@/lib/jscpp";
import { Render } from "./jrt";
import { IconButton, Switch, TextField, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";

// console.log(JSCPP);

// import src from "raw-loader!@/../tests/fixtures/s3b.yaml";

const defaultSrc = `display:
  - platform: ili9xxx
    model: S3BOX
    lambda: |-
      auto blue = Color(0, 0, 255);
      it.fill(id(black));
      it.printf(10, 20, id(my_font), id(white), "Hello, %s!", name);
      if (show)
        it.line(50, 50, x2, 150);
      it.printf(150, 120, id(icon_font_55), id(yellow), "\\U000F06E8");
      it.printf(x2 + 3, 160, id(my_font), id(white), "x2: %d", x2);

globals:
  - id: name
    type: std::string
    initial_value: "world"
  - id: show
    type: bool
    initial_value: true
  - id: x2
    type: int
    initial_value: 150

font:
  - file: "https://github.com/BigBobbas/ESP32-S3-Box3-Custom-ESPHome/raw/main/fonts/consola.ttf"
    id: my_font
    size: 14
    glyphs:
      '&@!"''%()+=,-_.:°/$€£¥?0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyzÀàÁáÂâÃãÄäĀāĂăÅåǺǻẠạĄąÆæǼǽĆćĈĉČčĊċÇçĎďĐđÐðÈèÉéÊêẼẽĚěËëĒēĔĕĖėẸẹĘęĜĝǦǧĞğĠġĢģĤĥĦħıÌìÍíÎîĨĩÏïĪīĬĭİỊịĮįȷĴĵĶķĸĹĺĽľĻļŁłĿŀŃńÑñŇňŅņƝɲŊŋŉÒòÓóÔôÕõÖöŌōŎŏŐőỌọǪǫØøǾǿŒœŔŕŘřŖŗŚśŜŝŠšŞşȘșẞßŤťŢţȚțŦŧÞþÙùÚúÛûŨũÜüŪūŬŭŮůŰűỤụŲųẀẁẂẃŴŵẄẅỲỳÝýŶŷỸỹŸÿȲȳŹźŽžŻżĲĳƏə'
  - file: "https://github.com/BigBobbas/ESP32-S3-Box3-Custom-ESPHome/raw/main/fonts/materialdesignicons-webfont.ttf"
    id: icon_font_55
    size: 45

color:
  - id: red
    hex: FF0000
  - id: black
    hex: 000000
  - id: white
    hex: FFFFFF
  - id: yellow
    hex: FFFF00
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

// TODO, rather do this in useEffect and only return a new object on change.
function collectIds(config: ESPHomeConfig) {
  const ids = {} as Record<string, Id>;
  for (const type of ["globals", "font", "color"] as Id["type"][]) {
    if (Array.isArray(config[type])) {
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
  const [src, setSrc] = React.useState(defaultSrc);
  const [parsed, setParsed] = React.useState({} as ESPHomeConfig);
  const [error, setError] = React.useState<Error | null>(null);
  const [doc, setDoc] = React.useState<ReturnType<typeof run>["doc"]>({
    children: [],
  });
  const ids = React.useMemo(() => collectIds(parsed), [parsed]);
  const [globals, setGlobal] = useGlobals(parsed.globals);
  // console.log("globals", globals);
  // console.log("ids", ids);

  const fontStyle = React.useMemo(() => {
    const byFamily = {} as Record<string, ESPHomeConfig["font"][0]>;
    parsed.font?.forEach((font) => {
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
  }, [parsed.font]);
  // console.log("fonts", fontStyle);

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
        color: parsed.color,
        ids,
        width,
        height,
      });
      setDoc(doc);
      setError(null);
    } catch (error) {
      console.log(error);
      setError(error as Error);
    }
    // console.log(context);
  }, [lambda, parsed.globals, globals, ids, width, height]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Split>
        <div style={{ width: "50%" }}>
          <CodeMirror value={src} onChange={setSrc} />
        </div>
        <div style={{ padding: 15 }}>
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
                        ) : type === "int" ? (
                          <TextField
                            size="small"
                            type="number"
                            sx={{ width: 100 }}
                            value={globals[id]?.toString() ?? ""}
                            onChange={(e) =>
                              setGlobal(id, parseInt(e.target.value))
                            }
                          />
                        ) : (
                          <TextField
                            size="small"
                            value={globals[id] ?? ""}
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
            background: "rgba(255, 240, 240, 0.95)",
            zIndex: 100,
            fontFamily: "monospace",
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
