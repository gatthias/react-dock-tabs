import React from "react";
import { Tab } from "./Tab";
import {
  HorizontalSplitter,
  VerticalSplitter,
  HSplit,
  VSplit
} from "./Splitter";
import { Dock } from "./Dock";

export const DockTabs = ({
  layout: initialLayout,
  onLayoutChange,
  children,
  onCloseTab
}) => {
  const childrenArr =
    children instanceof Array
      ? children
      : children instanceof Object
      ? [children]
      : null;

  const [layout, setLayout] = React.useState(initialLayout);
  const [movingTab, setMovingTab] = React.useState(null);

  React.useEffect(() => {
    setLayout(initialLayout);
  }, [initialLayout]);

  const childTabs = (childrenArr || []).filter(c => c.type === Tab);

  const getChildTabWithKey = key => {
    for (let tab of childTabs) {
      if (tab.key === key) {
        return tab;
      }
    }

    return null;
  };

  const findAndReplaceNode = (currentNode, nodeToFind, replacer) => {
    if (currentNode === nodeToFind) {
      return replacer(currentNode);
    } else {
      if (currentNode.children) {
        return {
          ...currentNode,
          children: currentNode.children.map(node =>
            findAndReplaceNode(node, nodeToFind, replacer)
          )
        };
      } else {
        return currentNode;
      }
    }
  };

  const setTabActive = React.useCallback(
    (dock, tab) => {
      const newLayoutDraft = { ...layout };

      const findAndReplaceDock = startNode =>
        findAndReplaceNode(startNode, dock, found => {
          return {
            ...found,
            activeTab: tab.key
          };
        });

      newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

      onLayoutChange(newLayoutDraft);
    },
    [layout, onLayoutChange]
  );

  const closeTab = React.useCallback(
    (dock, tab) => {
      onCloseTab(tab);
    },
    [onCloseTab]
  );

  const splitResized = React.useCallback(
    (splitNode, newSplits) => {
      const newLayoutDraft = { ...layout };

      const findAndReplaceSplit = startNode =>
        findAndReplaceNode(startNode, splitNode, node => {
          return {
            ...node,
            children: node.children.map((n, i) => ({
              ...n,
              ratio: newSplits[i].ratio
            }))
          };
        });

      newLayoutDraft.mainArea = findAndReplaceSplit(newLayoutDraft.mainArea);

      onLayoutChange(newLayoutDraft);
    },
    [layout, onLayoutChange]
  );

  const onTabMoving = React.useCallback((dragEvent, tabKey) => {
    // console.log(dragEvent, tabKey);
    const target = dragEvent.target;
    let $dock;
    if (($dock = target.closest("[data-dt-dock]"))) {
      let $header, $content;
      if (($header = target.closest("[data-dt-dock-header]"))) {
        console.log("On Dock Header !", $header);
      } else if (($content = target.closest("[data-dt-dock-content]"))) {
        console.log("On Dock Content !", $content);
      }
    }
  });

  const onTabMoveStart = React.useCallback((dockNode, tabKey) => {
    const onEnd = endEvent => {
      setMovingTab(null);

      window.removeEventListener("mouseup", onEnd);
    };

    window.addEventListener("mouseup", onEnd);

    setMovingTab(tabKey);

    const newLayoutDraft = { ...layout };

    const findAndReplaceDock = startNode =>
      findAndReplaceNode(startNode, dockNode, found => {
        const tabIdx = found.tabs.indexOf(tabKey);
        return {
          ...found,
          tabs: [
            ...found.tabs.slice(0, tabIdx),
            ...found.tabs.slice(tabIdx + 1)
          ]
        };
      });

    newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

    console.log("Leaving", layout, newLayoutDraft);

    setLayout(newLayoutDraft);
  });

  const onMovingTabEnteringDockHeader = React.useCallback(
    dockNode => {
      console.log(`${movingTab} entering header of `, dockNode);

      const newLayoutDraft = { ...layout };

      const findAndReplaceDock = startNode =>
        findAndReplaceNode(startNode, dockNode, found => {
          return {
            ...found,
            tabs: [...found.tabs, movingTab]
          };
        });

      newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

      console.log("Entering", layout, newLayoutDraft);

      setLayout(newLayoutDraft);
    },
    [movingTab, layout]
  );

  const onMovingTabLeavingDockHeader = React.useCallback(
    dockNode => {
      console.log(`${movingTab} leaving header of `, dockNode);

      const newLayoutDraft = { ...layout };

      const findAndReplaceDock = startNode =>
        findAndReplaceNode(startNode, dockNode, found => {
          const tabIdx = found.tabs.indexOf(movingTab);
          return {
            ...found,
            tabs: [
              ...found.tabs.slice(0, tabIdx),
              ...found.tabs.slice(tabIdx + 1)
            ]
          };
        });

      newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

      console.log("Leaving", layout, newLayoutDraft);

      setLayout(newLayoutDraft);
    },
    [movingTab, layout]
  );

  const onMovingTabEnteringDockContent = React.useCallback(
    dockNode => {
      console.log(`${movingTab} entering content of `, dockNode);
    },
    [movingTab, layout]
  );

  const drawLayoutNode = layoutNode => {
    if (layoutNode.type === "split" && layoutNode.orientation === "h") {
      return (
        <HorizontalSplitter
          onResized={newSplits => splitResized(layoutNode, newSplits)}
        >
          {layoutNode.children.map(child => (
            <HSplit ratio={child.ratio}>{drawLayoutNode(child)}</HSplit>
          ))}
        </HorizontalSplitter>
      );
    } else if (layoutNode.type === "split" && layoutNode.orientation === "v") {
      return (
        <VerticalSplitter
          onResized={newSplits => splitResized(layoutNode, newSplits)}
        >
          {layoutNode.children.map(child => (
            <VSplit ratio={child.ratio}>{drawLayoutNode(child)}</VSplit>
          ))}
        </VerticalSplitter>
      );
    } else if (layoutNode.type === "dock") {
      return (
        <Dock
          tabs={layoutNode.tabs
            .map(key => getChildTabWithKey(key, layoutNode))
            .filter(t => t != null)}
          activeTabKey={layoutNode.activeTab || layoutNode.tabs[0]}
          setTabActive={tab => setTabActive(layoutNode, tab)}
          closeTab={tab => closeTab(layoutNode, tab)}
          onTabMoveStart={tabKey => onTabMoveStart(layoutNode, tabKey)}
          onTabMoving={onTabMoving}
          movingTab={movingTab}
          onMovingTabEnteringHeader={() =>
            onMovingTabEnteringDockHeader(layoutNode)
          }
          onMovingTabEnteringContent={() =>
            onMovingTabEnteringDockContent(layoutNode)
          }
          onMovingTabLeavingHeader={() =>
            onMovingTabLeavingDockHeader(layoutNode)
          }
        />
      );
    } else {
      return null;
    }
  };

  return drawLayoutNode(layout.mainArea);
};
