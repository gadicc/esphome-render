import React from "react";
import CodeMirrorOrig, {
  ReactCodeMirrorProps,
  ReactCodeMirrorRef,
  ViewUpdate,
} from "@uiw/react-codemirror";
import { parser as yamlParser } from "@lezer/yaml";
import { parser as cppParser } from "@lezer/cpp";
import {
  LRLanguage,
  delimitedIndent,
  indentNodeProp,
  foldNodeProp,
  foldInside,
  LanguageSupport,
} from "@codemirror/language";
import { SyntaxNode, parseMixed } from "@lezer/common";

// See https://codemirror.net/examples/mixed-language/
const mixedYamlParser = yamlParser.configure({
  // Mixed support
  wrap: parseMixed((node) => {
    // console.log(node.from, node.name, node);
    return node.name === "BlockLiteralContent" ? { parser: cppParser } : null;
  }),

  // From https://github.com/codemirror/lang-yaml/blob/main/src/yaml.ts
  props: [
    indentNodeProp.add({
      Stream: (cx) => {
        for (
          let before = cx.node.resolve(cx.pos, -1) as SyntaxNode | null;
          before && before.to >= cx.pos;
          before = before.parent
        ) {
          if (before.name == "BlockLiteralContent" && before.from < before.to)
            return cx.baseIndentFor(before);
          if (before.name == "BlockLiteral")
            return cx.baseIndentFor(before) + cx.unit;
          if (before.name == "BlockSequence" || before.name == "BlockMapping")
            return cx.column(before.from, 1);
          if (before.name == "QuotedLiteral") return null;
          if (before.name == "Literal") {
            const col = cx.column(before.from, 1);
            if (col == cx.lineIndent(before.from, 1)) return col; // Start on own line
            if (before.to > cx.pos) return null;
          }
        }
        return null;
      },
      FlowMapping: delimitedIndent({ closing: "}" }),
      FlowSequence: delimitedIndent({ closing: "]" }),
    }),
    foldNodeProp.add({
      "FlowMapping FlowSequence": foldInside,
      "BlockSequence Pair BlockLiteral": (node, state) => ({
        from: state.doc.lineAt(node.from).to,
        to: node.to,
      }),
    }),
  ],
});

const mixedYamlLanguage = LRLanguage.define({
  name: "yaml",
  parser: mixedYamlParser,
  languageData: {
    commentTokens: { line: "#" },
    indentOnInput: /^\s*[\]}]$/,
  },
});

function mixedYaml() {
  return new LanguageSupport(
    mixedYamlLanguage,
    // data.of etc...
  );
}

// console.log({ mixedYaml, mixedYamlSupport: mixedYamlSupport(), yaml: yaml() });
// const extensions = [yaml(), cpp()];

const _extensions = [mixedYaml()];

const CodeMirror = React.memo(function CodeMirror(
  props: Parameters<typeof CodeMirrorOrig>[0],
) {
  const ref = React.useRef<ReactCodeMirrorRef>(null);
  const { extensions, value, onChange } = props;
  const valueRef = React.useRef<string | undefined>(value);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const _onChange: ReactCodeMirrorProps["onChange"] = React.useCallback(
    (value: string, viewUpdate: ViewUpdate) => {
      valueRef.current = value;
      onChange?.(value, viewUpdate);
    },
    [onChange],
  );

  const combinedExtensions = React.useMemo(
    () => [..._extensions, ...(extensions ?? [])],
    [extensions],
  );

  React.useEffect(() => {
    if (value !== valueRef.current) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        ref.current?.view?.dispatch({
          changes: { from: 0, to: valueRef.current?.length, insert: value },
        });
        valueRef.current = value;
      }, 500);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value]);

  const cm = React.useMemo(() => {
    return (
      <CodeMirrorOrig
        ref={ref}
        extensions={combinedExtensions}
        onChange={_onChange}
        value={valueRef.current}
      />
    );
  }, [_onChange, combinedExtensions]);

  return cm;
});

export default CodeMirror;
