import React from "react";
import { SplitterHandle } from "./SplitterHandle";
import "./Splitter.css";

const Splitter = (typeSymbol, splitCtor) => {
  const propName = typeSymbol === "h" ? "width" : "height";

  return ({ children = [], onResized }) => {
    const childrenArr = children instanceof Array ? children : [children];

    const [splits, setSplits] = React.useState([]);

    React.useEffect(() => {
      const newSplits = childrenArr
        .filter(c => c.type === splitCtor)
        .map(split => ({
          ratio: split.props.ratio,
          children: split.props.children
        }));
      setSplits(newSplits);
    }, [children]);

    const resizeSplit = React.useCallback(
      (event, splitIndex, dragEnd = false) => {
        const splitsToResize = [splits[splitIndex], splits[splitIndex + 1]];

        const absSize =
          typeSymbol === "h"
            ? splitterRef.current.clientWidth
            : splitterRef.current.clientHeight;

        const splitElements = [
          splitterRef.current.querySelector(
            `:scope > div.split:nth-of-type(${splitIndex + 1})`
          ),
          splitterRef.current.querySelector(
            `:scope > div.split:nth-of-type(${splitIndex + 2})`
          )
        ];
        const currentSizes = splitElements.map(elt =>
          typeSymbol === "h" ? elt.clientWidth : elt.clientHeight
        );
        const delta = typeSymbol === "h" ? event.movementX : event.movementY;
        const nextRatios = [
          (currentSizes[0] + delta) / absSize,
          (currentSizes[1] - delta) / absSize
        ];

        const newSplits = [
          ...splits.slice(0, splitIndex),
          {
            ...splitsToResize[0],
            ratio: nextRatios[0]
          },
          {
            ...splitsToResize[1],
            ratio: nextRatios[1]
          },
          ...splits.slice(splitIndex + 2)
        ];
        setSplits(newSplits);

        if (dragEnd && onResized) {
          onResized(newSplits);
        }
      },
      [splits]
    );

    const splitterRef = React.useRef();

    return (
      <div className={`splitter ${typeSymbol}-splitter`} ref={splitterRef}>
        {splits.map((split, i) => (
          <>
            <div
              className={`split ${typeSymbol}-split`}
              style={{ [propName]: `${split.ratio * 100}%` }}
            >
              {split.children}
            </div>
            {i < splits.length - 1 && (
              <SplitterHandle
                onResizing={e => resizeSplit(e, i)}
                onResized={e => resizeSplit(e, i, true)}
              />
            )}
          </>
        ))}
      </div>
    );
  };
};

export const HSplit = ({ children }) => children;
export const VSplit = ({ children }) => children;

export const HorizontalSplitter = Splitter("h", HSplit);
export const VerticalSplitter = Splitter("v", VSplit);
