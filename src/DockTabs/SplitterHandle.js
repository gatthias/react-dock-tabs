import React from "react";

export const SplitterHandle = ({ onResizing, onResized }) => {
  const mouseDown = React.useCallback(
    e => {
      const onDrag = dragEvent => {
        onResizing(dragEvent);
      };

      const onEnd = endEvent => {
        onResized && onResized(endEvent);
        window.removeEventListener("mousemove", onDrag);
        window.removeEventListener("mouseup", onEnd);
      };

      window.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", onEnd);
    },
    [onResizing]
  );

  return <span className="splitter-handle" onMouseDown={mouseDown} />;
};
