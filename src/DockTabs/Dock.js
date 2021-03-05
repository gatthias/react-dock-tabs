import React from "react";
import { Tab } from "./Tab";
import "./Dock.css";

export const Dock = ({
  activeTabKey,
  tabs,
  children,
  setTabActive,
  closeTab,

  onTabMoveStart,
  movingTab,

  dispatch,
  dockNode,

  dummyHeaderTab,
  dummyContentSplit,

  tabBtnWidth = 90
}) => {
  let _tabs = [];
  if (tabs) {
    _tabs = tabs;
  } else if (children instanceof Array) {
    _tabs = children.filter(c => c.type === Tab);
  } else if (children instanceof Object) {
    _tabs = [children].filter(c => c.type === Tab);
  }

  const activeTab = _tabs.filter(tab => tab.key === activeTabKey)[0];
  let displayTabs = _tabs;
  if(dummyHeaderTab){
    const filteredTabs = _tabs.filter(tab => tab.key !== dummyHeaderTab.key);
    const dummyX = dummyHeaderTab.x || 0;
    const dummyTabIdx = Math.floor(dummyX / tabBtnWidth);
    filteredTabs.splice(dummyTabIdx, 0, { type: "placeholder" });
    displayTabs = filteredTabs;
  }

  const headerRef = React.useRef();
  const contentRef = React.useRef();

  const mouseDown = React.useCallback((e, tabKey) => {
    const newX = e.currentTarget.offsetLeft;
    const handleOffset = {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY
    }
    onTabMoveStart(tabKey, newX + handleOffset.x, handleOffset);
  });

  const mouseEnterHeader = React.useCallback((e) => {
    if (movingTab != null && headerRef.current != null) {
      const newX =  e.nativeEvent.offsetX;
      dispatch(["tabEnteringDockHeader", { dockNode, newX, tabTitle: movingTab.title }]);
    }
  }, [movingTab, dockNode]);

  const mouseMoveHeader = React.useCallback((e) => {
    if (movingTab != null && headerRef.current != null && dummyHeaderTab) {
      const newX = e.nativeEvent.offsetX;
      dispatch(["tabMovingOnHeader", { dockNode, newX }]);
    }
  }, [movingTab, dockNode]);

  const mouseLeaveHeader = React.useCallback(() => {
    if (movingTab != null) {
      dispatch(["tabLeavingDockHeader", { dockNode }]);
    }
  }, [movingTab, dockNode]);

  const mouseEnterContent = React.useCallback(() => {
    if (movingTab != null) {
      dispatch(["tabEnteringDockContent", { dockNode }]);
    }
  }, [movingTab, dockNode]);

  const mouseMoveContent = React.useCallback((e) => {
    if(movingTab != null && contentRef.current != null){
      let contentPosition = "center";
      const tabX = e.nativeEvent.offsetX;
      const tabY = e.nativeEvent.offsetY;

      const dockWidth = contentRef.current.offsetWidth;
      const dockHeight = contentRef.current.offsetHeight;

      const marginRatio = 0.33;
      const marginX = dockWidth * marginRatio;
      const marginY = dockHeight * marginRatio;
      
      if(tabY < marginY){
        contentPosition = "top";
      }else if(tabY > dockHeight - marginY){
        contentPosition = "bottom";
      }else if(tabX < marginX){
        contentPosition = "left";
      }else if(tabX > dockWidth - marginX){
        contentPosition = "right";
      }

      dispatch(["tabMovingOnDockContent", { dockNode, positionOnContent: contentPosition }]);
    }
  }, [movingTab, dockNode])

  const mouseLeaveContent = React.useCallback(() => {
    if (movingTab != null) {
      dispatch(["tabLeavingDockContent", { dockNode }]);
    }
  }, [movingTab, dockNode]);

  const getDummyContentSplitClassName = (dummy) => dummy?.position || "center";

  return (
    <div className={ `dock ${ movingTab ? 'moving-tab' : ''}`}>
      <div
        className="dock-header"
        onMouseEnter={mouseEnterHeader}
        onMouseMove={mouseMoveHeader}
        onMouseLeave={mouseLeaveHeader}
        ref={headerRef}
      >
        {displayTabs.map(tab => (
          tab.type === "placeholder" ? 
          (<div className="tab-btn placeholder"></div>)
          :
          (<div
            className={`tab-btn${activeTabKey === tab.key ? " active" : ""}`}
            onClick={() => setTabActive(tab)}
            onMouseDown={(e) => mouseDown(e, tab.key)}
          >
            <span className="tab-btn-title">{tab.props.title || tab.key}</span>
            <button
              className="tab-btn-close"
              onMouseDown={ e => e.stopPropagation() }
              onClick={e => (e.stopPropagation(), closeTab(tab))}
            >
              x
            </button>
          </div>)
        ))}
        {
          dummyHeaderTab && (
            <div
              className="tab-btn active dummy"
              style={({position: "absolute", transform: `translateX(${dummyHeaderTab.x}px)` }) }
            >
              <span className="tab-btn-title">{dummyHeaderTab.title || dummyHeaderTab.key}</span>
              <button className="tab-btn-close">
                x
              </button>
            </div>
          )
        }
      </div>
      <div
        className="dock-content"
        onMouseEnter={mouseEnterContent}
        onMouseMove={mouseMoveContent}
        onMouseLeave={mouseLeaveContent}
        ref={contentRef}
      >
        {activeTab}
      </div>
      { dummyContentSplit && (
        <div className={`dummy-content-split ${getDummyContentSplitClassName(dummyContentSplit)}`} />
      )}
    </div>
  );
};
