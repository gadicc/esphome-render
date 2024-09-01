import React from "react";
import CodeMirrorOrig, {
  ReactCodeMirrorProps,
  ReactCodeMirrorRef,
  ViewUpdate,
} from "@uiw/react-codemirror";
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
  const ref = React.useRef<ReactCodeMirrorRef>(null);
  const { extensions, value, onChange } = props;
  const valueRef = React.useRef<string | undefined>(value);

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
