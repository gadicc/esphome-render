"use client";

import React from "react";
// @ts-expect-error: :/
import { Node, Render } from "json-rich-text";

class Line extends Node {
  render(key: string | number) {
    // @ts-expect-error: :/
    const { x1, y1, x2, y2 } = this.block;
    return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" />;
  }
}

class Rect extends Node {
  render(key: string | number) {
    // @ts-expect-error: :/
    const { x, y, width, height, fill } = this.block;
    return (
      <rect key={key} x={x} y={y} width={width} height={height} fill={fill} />
    );
  }
}

class Printf extends Node {
  render(key: string | number) {
    // @ts-expect-error: :/
    const { x, y, fontFamily, fontSize, color, text } = this.block;
    return (
      <text
        key={key}
        x={x}
        y={y}
        fontFamily={fontFamily}
        fontSize={fontSize}
        fill={color}
      >
        {text}
      </text>
    );
  }
}

export const blocks = {
  line: Line,
  printf: Printf,
  rect: Rect,
};
Node.registerBlocks(blocks);

// NB: If we don't export "Node", React fast refresh won't pickup Component
// changes.
export { Node, Render };
