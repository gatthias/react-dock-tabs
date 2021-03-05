import React from "react";
import { Tab } from "./Tab";
import {
  HorizontalSplitter,
  VerticalSplitter,
  HSplit,
  VSplit
} from "./Splitter";
import { Dock } from "./Dock";


const DEBUG = true;
const debugLog = (...args) => DEBUG && console.log(...args);

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
  const [movingTabData, setMovingTabData] = React.useState(null);
  const dockTabsRef = React.useRef();

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

    newLayoutDraft.mainArea = findWithCallbackAndReplaceNode(newLayoutDraft.mainArea, (node) => node.type === "split" && node.children && node.children.filter(children => children.dummyContentSplit != null).length > 0, node => {
      const splittingDock = node.children.filter(children => children.dummyContentSplit != null)[0];
      const splittingDockIndex = node.children.indexOf(splittingDock);
      const splitData = splittingDock.dummyContentSplit;

      if(splitData.position === "center"){
        const tabKey = splitData.key;
        const newTabs = [...new Set([...splittingDock.tabs.filter(tab => tab !== tabKey), tabKey])];
        const newChild = {
          ...splittingDock,
          tabs: newTabs,
          activeTab: tabKey,
          dummyContentSplit: undefined
        }
        const newChildren = [...node.children];
        newChildren.splice(splittingDockIndex, 1, newChild);

        return {
          ...node,
          children: newChildren
        }
      }else{
        const bMainAxis = (node.orientation === "h" && (splitData.position === "left" || splitData.position === "right")) || (node.orientation === "v" && (splitData.position === "top" || splitData.position === "bottom"))
      
        if(bMainAxis){
          const dockRatios = splittingDock.ratio / 2;
          const createdDock = {
            type: 'dock',
            ratio: dockRatios,
            tabs: [splitData.key],
            activeTab: splitData.key
          }

          const newTabs = [...new Set(splittingDock.tabs.filter(tab => tab !== splitData.key))];
          const updatedDock = {
            ...splittingDock,
            ratio: dockRatios,
            tabs: newTabs,
            activeTab: splittingDock._lastActiveTab || newTabs[newTabs.length - 1],
            dummyContentSplit: undefined
          }

          const newChildren = [...node.children];

          if(splitData.position === "left" || splitData.position === "top"){
            newChildren.splice(splittingDockIndex, 1, createdDock, updatedDock);
          }else if(splitData.position === "right" || splitData.position === "bottom"){
            newChildren.splice(splittingDockIndex, 1, updatedDock, createdDock);
          }

          return {
            ...node,
            children: newChildren
          }
        }else{
          const dockRatios = 0.5;
          const createdDock = {
            type: 'dock',
            ratio: dockRatios,
            tabs: [splitData.key],
            activeTab: splitData.key
          }
          
          const newTabs = [...new Set(splittingDock.tabs.filter(tab => tab !== splitData.key))];
          const updatedDock = {
            ...splittingDock,
            ratio: dockRatios,
            tabs: newTabs,
            activeTab: splittingDock._lastActiveTab || newTabs[newTabs.length - 1],
            dummyContentSplit: undefined
          }

          let newSplitChildren;
          if(splitData.position === "left" || splitData.position === "top"){
            newSplitChildren = [createdDock, updatedDock];
          }else if(splitData.position === "right" || splitData.position === "bottom"){
            newSplitChildren = [updatedDock, createdDock];
          }

          const createdSplit = {
            type: "split",
            orientation: node.orientation === "h" ? "v" : "h",
            ratio: splittingDock.ratio,
            children: newSplitChildren
          }

          const newChildren = [...node.children];
          newChildren.splice(splittingDockIndex, 1, createdSplit);

          return {
            ...node,
            children: newChildren
          }
        }
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
  

  const onMouseUp = React.useCallback(() => {
    if(movingTab){
      setMovingTab(null);
      setMovingTabData(null);
      onLayoutChange(fixupLayout(layout));
    }
  }, [movingTab, layout]);

  const onMouseMove = React.useCallback((e) => {
    setMovingTabData(movingTabData => {
      if(movingTabData && movingTabData.status != "on-header" && dockTabsRef.current){
        const newPos = {
          x: e.pageX - dockTabsRef.current.offsetLeft,
          y: e.pageY - dockTabsRef.current.offsetTop
        };
        return {
          ...movingTabData,
          position: newPos
        };
      }
      return movingTabData;
    });

  }, [])

  const onTabMoveStart = React.useCallback((dockNode, tabKey, newX = 0, handleOffset = {x: 0, y: 0}) => {
    

    // console.log("MoveStart", layout, newLayoutDraft);

    setMovingTab(tabKey);
    setMovingTabData({
      key: tabKey,
      title: getChildTabWithKey(tabKey)?.props?.title,
      status: "on-header",
      position: {
        x: newX,
        y: 0
      },
      handleOffset
    })
    setLayout(layout => {
      const newLayoutDraft = { ...layout };

      if(dockNode.tabs.length === 1){
        newLayoutDraft.mainArea = findWithCallbackAndReplaceNode(newLayoutDraft.mainArea, (node) => node.type === "split" && node.children != null && node.children.indexOf(dockNode) > -1, node => {
          const childIndex = node.children.indexOf(dockNode);
          const newChildren = [...node.children];
          newChildren.splice(childIndex, 1);
          const ratioToAdd = dockNode.ratio / newChildren.length;
          newChildren.forEach(c => c.ratio += ratioToAdd);


          return {
            ...node,
            children: newChildren
          }
          //@TODO: Should be recursive ?

        });
      }else{
        const findAndReplaceDock = startNode =>
          findAndReplaceNode(startNode, dockNode, found => {

            return {
              ...found,
              activeTab: tabKey,
              dummyHeaderTab: {
                key: tabKey,
                title: getChildTabWithKey(tabKey)?.props?.title,
                x: newX - handleOffset.x,
                moved: false
              }
            };
          });

        newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);
      }

      return newLayoutDraft;
    });
  }, [/*layout*/]);

  const onMovingTabMovingOnDockHeader = React.useCallback(
    (dockNode, newX) => {
      debugLog(`${movingTab} moving on header `, dockNode, newX);

      
      setMovingTabData({
        ...movingTabData,
        position: {
          ...movingTabData.position,
          x: newX
        }
      });
      setLayout(layout => {
        const newLayoutDraft = { ...layout };

        const findAndReplaceDock = startNode =>
          findAndReplaceNode(startNode, dockNode, found => {
            return {
              ...found,
              dummyHeaderTab: {
                key: movingTabData.key,
                title: movingTabData.title,
                x: newX - movingTabData.handleOffset.x,
                moved: true
              }
            };
          });

        newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

        // console.log("Moving", layout, newLayoutDraft);

        return newLayoutDraft
      });
    },
    [movingTab, movingTabData/*, layout*/]
  );

  const onMovingTabEnteringDockHeader = React.useCallback(
    (dockNode, newX = 0) => {
      debugLog(`${movingTab} entering header of `, dockNode);

      setMovingTabData({
        ...movingTabData,
        status: "on-header",
        position: {
          ...movingTabData.position,
          x: newX
        }
      });
      setLayout(layout => {
        const newLayoutDraft = { ...layout };

        const findAndReplaceDock = startNode =>
          findAndReplaceNode(startNode, dockNode, found => {
            console.log("Entering dock => found")
            return {
              ...found,
              tabs: [...new Set([...found.tabs, movingTab])],
              activeTab: movingTab,
              _lastActiveTab: found.activeTab,
              dummyHeaderTab: {
                key: movingTab,
                title: getChildTabWithKey(movingTab)?.props?.title,
                x: newX - movingTabData.handleOffset.x
              }
            };
          });

        newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

        // console.log("Entering", layout, newLayoutDraft);

        return newLayoutDraft;
      });
    },
    [movingTab, movingTabData/*, layout*/]
  );

  const onMovingTabLeavingDockHeader = React.useCallback(
    dockNode => {
      debugLog(`${movingTab} leaving header of `, dockNode);

      
      setMovingTabData({
        ...movingTabData,
        status: "floating"
      });
      setLayout(layout => {
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

        return newLayoutDraft;
      });
    },
    [movingTab, movingTabData/*, layout*/]
  );

  const onMovingTabEnteringDockContent = React.useCallback(
    dockNode => {
      debugLog(`${movingTab} entering content of `, dockNode, movingTabData);

      setMovingTabData({
        ...movingTabData,
        status: "on-content",
        positionOnContent: "center"
      });
      setLayout(layout => {
        const newLayoutDraft = { ...layout };

        const findAndReplaceDock = startNode =>
          findAndReplaceNode(startNode, dockNode, found => {
            return {
              ...found,
              dummyContentSplit: {
                key: movingTabData.key,
                position: "center"
              }
            };
          });

        newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);
        
        return newLayoutDraft
      });
    },
    [movingTab, movingTabData/*, layout*/]
  );

  const onMovingTabMovingOnDockContent = React.useCallback(
    (dockNode, positionOnContent) => {
      debugLog(`${movingTab} moving over content of `, dockNode, movingTabData);
      
      setMovingTabData({
        ...movingTabData,
        status: "on-content",
        positionOnContent
      });
      setLayout(layout => {
        const newLayoutDraft = { ...layout };

        const findAndReplaceDock = startNode =>
          findAndReplaceNode(startNode, dockNode, found => {
            return {
              ...found,
              dummyContentSplit: {
                ...found.dummyContentSplit,
                key: movingTabData.key,
                position: positionOnContent
              }
            };
          });

        newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

        return newLayoutDraft
      });
    },
    [movingTab, movingTabData]
  );

  const onMovingTabLeavingDockContent = React.useCallback(
    dockNode => {
      debugLog(`${movingTab} leaving content of `, dockNode);

      
      
      setMovingTabData({
        ...movingTabData,
        status: "floating",
        positionOnContent: undefined
      });
      setLayout(layout => {
        const newLayoutDraft = { ...layout };

        const findAndReplaceDock = startNode =>
          findAndReplaceNode(startNode, dockNode, found => {
            return {
              ...found,
              dummyContentSplit: undefined
            };
          });

        newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

        return newLayoutDraft;
      });
    },
    [movingTab, movingTabData/*, layout*/]
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

          onTabMoveStart={(tabKey, newX, handleOffset) => onTabMoveStart(layoutNode, tabKey, newX, handleOffset)} 

          onMovingTabEnteringHeader={(newX) =>
            onMovingTabEnteringDockHeader(layoutNode, newX)
          }
          onMovingTabLeavingHeader={() =>
            onMovingTabLeavingDockHeader(layoutNode)
          }
          onMovingTabMovingOnHeader={(newX) =>
            onMovingTabMovingOnDockHeader(layoutNode, newX)
          }

          onMovingTabEnteringContent={() =>
            onMovingTabEnteringDockContent(layoutNode)
          }
          onMovingTabMovingOnContent={(positionOnContent) =>
            onMovingTabMovingOnDockContent(layoutNode, positionOnContent)
          }
          onMovingTabLeavingContent={() =>
            onMovingTabLeavingDockContent(layoutNode)
          }

          movingTab={movingTab}
          dummyHeaderTab={layoutNode.dummyHeaderTab}
          dummyContentSplit={layoutNode.dummyContentSplit}
        />
      );
    } else {
      return null;
    }
  };

  return (
    <div className="dock-tabs" ref={dockTabsRef} onMouseUp={onMouseUp} onMouseMove={onMouseMove}>
      { drawLayoutNode(layout.mainArea) }
      { movingTabData && movingTabData.status !== "on-header" && (
        <div
          className="tab-btn active dummy floating-handle"
          style={({position: "absolute", top: 0, left: 0, transform: `translate(${movingTabData.position.x}px, ${movingTabData.position.y}px)` }) }
        >
          <span className="tab-btn-title">{movingTabData.title || movingTabData.key}</span>
          <button className="tab-btn-close">
            x
          </button>
        </div>
      )}
    </div>
  );
};
