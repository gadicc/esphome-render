"use client";

import React from "react";
// @ts-expect-error: :/
import { Node, Render } from "json-rich-text";

class Line extends Node {
  render(key: string | number) {
    // @ts-expect-error: :/
    const { x1, y1, x2, y2 } = this.block;
    // @ts-expect-error: :/
    console.log(this.block);

    return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" />;
  }
}

export const blocks = {
  line: Line,
};
Node.registerBlocks(blocks);

// NB: If we don't export "Node", React fast refresh won't pickup Component
// changes.
export { Node, Render };
