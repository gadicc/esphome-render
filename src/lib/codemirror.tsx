import React from "react";
import CodeMirrorOrig, {
  ReactCodeMirrorRef,
  useCodeMirror,
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
  const { extensions, value, ...rest } = props;
  const combinedExtensions = React.useMemo(
    () => [..._extensions, ...(extensions ?? [])],
    [extensions],
  );

  React.useEffect(() => {
    console.log(1, value, ref.current, ref.current?.view);
    if (ref.current?.view) {
      console.log(2, value);
      ref.current.view.dispatch({
        changes: {
          from: 0,
          insert: value,
        },
      });
    }
  }, [ref.current?.view]);

  return <CodeMirrorOrig ref={ref} extensions={combinedExtensions} {...rest} />;
});

export default CodeMirror;
