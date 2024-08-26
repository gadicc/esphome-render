import React from "react";
import CodeMirrorOrig from "@uiw/react-codemirror";
import { parser as yamlParser } from "@lezer/yaml";
import { parser as cppParser } from "@lezer/cpp";
import { parseMixed } from "@lezer/common";
import { LRLanguage } from "@codemirror/language";

const mixedYamlParser = yamlParser.configure({
  wrap: parseMixed((node) => {
    // console.log(node.from, node.name, node);
    return node.name === "BlockLiteralContent" ? { parser: cppParser } : null;
  }),
});

const mixedYaml = LRLanguage.define({ parser: mixedYamlParser });

// const extensions = [yaml(), cpp()];
const _extensions = [mixedYaml];

const CodeMirror = React.memo(function CodeMirror(
  props: Parameters<typeof CodeMirrorOrig>[0],
) {
  const { extensions, ...rest } = props;
  const combinedExtensions = React.useMemo(
    () => [..._extensions, ...(extensions ?? [])],
    [extensions],
  );

  return <CodeMirrorOrig extensions={combinedExtensions} {...rest} />;
});

export default CodeMirror;
