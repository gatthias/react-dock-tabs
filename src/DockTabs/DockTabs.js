import React, { useReducer } from "react";
import { Tab } from "./Tab";
import {
  HorizontalSplitter,
  VerticalSplitter,
  HSplit,
  VSplit
} from "./Splitter";
import { Dock } from "./Dock";
import { dockTabsReducer } from "./model/reducer";

const tabBtnWidth = 90;




const initialState = {
  layout: null,
  movingTab: null
}


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
  const childTabs = (childrenArr || []).filter(c => c.type === Tab);
  const getChildTabWithKey = key => {
    for (let tab of childTabs) {
      if (tab.key === key) {
        return tab;
      }
    }

    return null;
  };

  const dockTabsRef = React.useRef();

  const [state, dispatch] = useReducer(dockTabsReducer, initialState);

  React.useEffect(() => {
    dispatch(["setLayout", { layout: initialLayout }])
  }, [initialLayout]);

  const setTabActive = React.useCallback(
    (dock, tab) => {
      dispatch(["setTabActive", { dock, tab }, 
        (newState) => onLayoutChange(newState.layout)]);
    },
    [onLayoutChange]
  );

  const closeTab = React.useCallback(
    (dock, tab) => {
      onCloseTab(tab);
    },
    [onCloseTab]
  );

  const splitResized = React.useCallback(
    (splitNode, newSplits) => {
      dispatch(["splitResized", { splitNode, newSplits }, 
        (newState) => onLayoutChange(newState.layout) ]);
    },
    [onLayoutChange]
  );
  

  const onMouseUp = React.useCallback(() => {
    if(state.movingTab){
      dispatch(["tabMoveEnd", { }, 
        (newState) => onLayoutChange(newState.layout) ]);
    }
  }, [state]);

  const onMouseMove = React.useCallback((e) => {
    if(dockTabsRef.current){
      const newPos = {
        x: e.pageX - dockTabsRef.current.offsetLeft,
        y: e.pageY - dockTabsRef.current.offsetTop
      };
      dispatch(["tabMoveOnDock", { newPos }]);
    }
  }, [])

  const onTabMoveStart = React.useCallback((dockNode, tabKey, newX = 0, handleOffset = {x: 0, y: 0}) => {
    const tabTitle = getChildTabWithKey(tabKey)?.props?.title;
    dispatch(["tabMoveStart", { dockNode, tabKey, tabTitle, newX,  handleOffset }]);
    
  }, []);


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

          dispatch={dispatch}
          dockNode={layoutNode}

          movingTab={state.movingTab}
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
      { state.layout && drawLayoutNode(state.layout.mainArea) }
      { state.movingTab && state.movingTab.status !== "on-header" && (
        <div
          className="tab-btn active dummy floating-handle"
          style={({position: "absolute", top: 0, left: 0, transform: `translate(${state.movingTab.position.x}px, ${state.movingTab.position.y}px)` }) }
        >
          <span className="tab-btn-title">{state.movingTab.title || state.movingTab.key}</span>
          <button className="tab-btn-close">
            x
          </button>
        </div>
      )}
    </div>
  );
};
