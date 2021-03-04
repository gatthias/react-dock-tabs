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
  const tabBtnWidth = 90;

  const getChildTabWithKey = key => {
    for (let tab of childTabs) {
      if (tab.key === key) {
        return tab;
      }
    }

    return null;
  };

  const findWithCallbackAndReplaceNode = (currentNode, findCallback, replacer) => {
    if (findCallback(currentNode)) {
      return replacer(currentNode);
    } else {
      if (currentNode.children) {
        return {
          ...currentNode,
          children: currentNode.children.map(node =>
            findWithCallbackAndReplaceNode(node, findCallback, replacer)
          )
        };
      } else {
        return currentNode;
      }
    }
  }

  const findAndReplaceNode = (currentNode, nodeToFind, replacer) => {
    return findWithCallbackAndReplaceNode(currentNode, (node) => node === nodeToFind, replacer);
  };

  const fixupLayout = (layout) => {
    const newLayoutDraft = { ...layout };

    newLayoutDraft.mainArea = findWithCallbackAndReplaceNode(newLayoutDraft.mainArea, (node) => node.type === "dock" && node.dummyHeaderTab != null, node => {
      const tabKey = node.dummyHeaderTab.key;
      const newTabs = [...new Set(node.tabs.filter(tab => tab !== tabKey))];
      const dummyX = node.dummyHeaderTab.x || 0;
      const dummyTabIdx = Math.floor(dummyX / tabBtnWidth);
      newTabs.splice(dummyTabIdx, 0, tabKey);
      return {
        ...node,
        tabs: newTabs,
        _lastActiveTab: node.activeTab,
        activeTab: tabKey,
        dummyHeaderTab: undefined
      }
    });

    return newLayoutDraft;
  }

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

  const onMouseUp = React.useCallback(() => {
    if(movingTab){
      const newLayout = fixupLayout(layout);

      setMovingTab(null);
      onLayoutChange(newLayout);
    }
  }, [movingTab, layout])

  const onTabMoveStart = React.useCallback((dockNode, tabKey, newX = 0) => {
    const newLayoutDraft = { ...layout };

    const findAndReplaceDock = startNode =>
      findAndReplaceNode(startNode, dockNode, found => {
        const newTabs = found.tabs.filter(tabName => tabName != tabKey);
        return {
          ...found,
          // tabs: newTabs,
          activeTab: tabKey,
          dummyHeaderTab: {
            key: tabKey,
            title: getChildTabWithKey(tabKey, dockNode)?.props?.title,
            x: newX
          }
        };
      });

    newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

    // console.log("MoveStart", layout, newLayoutDraft);

    setMovingTab(tabKey);
    setLayout(newLayoutDraft);
  });

  const onMovingTabMovingOnDockHeader = React.useCallback(
    (dockNode, newX) => {
      // console.log(`${movingTab} moving on header `, dockNode, newX);

      const newLayoutDraft = { ...layout };

      const findAndReplaceDock = startNode =>
        findAndReplaceNode(startNode, dockNode, found => {
          return {
            ...found,
            dummyHeaderTab: {
              key: movingTab,
              title: getChildTabWithKey(movingTab, dockNode)?.props?.title,
              x: newX
            }
          };
        });

      newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

      // console.log("Moving", layout, newLayoutDraft);

      setLayout(newLayoutDraft);
    },
    [movingTab, layout]
  );

  const onMovingTabEnteringDockHeader = React.useCallback(
    (dockNode, newX = 0) => {
      // console.log(`${movingTab} entering header of `, dockNode);

      const newLayoutDraft = { ...layout };

      const findAndReplaceDock = startNode =>
        findAndReplaceNode(startNode, dockNode, found => {
          return {
            ...found,
            tabs: [...new Set([...found.tabs, movingTab])],
            activeTab: movingTab,
            _lastActiveTab: found.activeTab,
            dummyHeaderTab: {
              key: movingTab,
              title: getChildTabWithKey(movingTab, dockNode)?.props?.title,
              x: newX
            }
          };
        });

      newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

      // console.log("Entering", layout, newLayoutDraft);

      setLayout(newLayoutDraft);
    },
    [movingTab, layout]
  );

  const onMovingTabLeavingDockHeader = React.useCallback(
    dockNode => {
      // console.log(`${movingTab} leaving header of `, dockNode);

      const newLayoutDraft = { ...layout };

      const findAndReplaceDock = startNode =>
        findAndReplaceNode(startNode, dockNode, found => {
          const newTabs = found.tabs.filter(tabName => tabName != movingTab);
          return {
            ...found,
            tabs: newTabs,
            activeTab: found._lastActiveTab || newTabs[newTabs.length - 1],
            _lastActiveTab: undefined,
            dummyHeaderTab: undefined
          };
        });

      newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

      // console.log("Leaving", layout, newLayoutDraft);

      setLayout(newLayoutDraft);
    },
    [movingTab, layout]
  );

  const onMovingTabEnteringDockContent = React.useCallback(
    dockNode => {
      // console.log(`${movingTab} entering content of `, dockNode);
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
          onTabMoveStart={(tabKey, newX) => onTabMoveStart(layoutNode, tabKey, newX)}
          onTabMoving={onTabMoving}
          movingTab={movingTab}
          onMovingTabEnteringHeader={(newX) =>
            onMovingTabEnteringDockHeader(layoutNode, newX)
          }
          onMovingTabEnteringContent={() =>
            onMovingTabEnteringDockContent(layoutNode)
          }
          onMovingTabLeavingHeader={() =>
            onMovingTabLeavingDockHeader(layoutNode)
          }
          onMovingTabMovingOnHeader={(newX) =>
            onMovingTabMovingOnDockHeader(layoutNode, newX)
          }

          dummyHeaderTab={layoutNode.dummyHeaderTab}
        />
      );
    } else {
      return null;
    }
  };

  return (
    <div className="dock-tabs" onMouseUp={onMouseUp}>
      { drawLayoutNode(layout.mainArea) }
    </div>
  );
};
