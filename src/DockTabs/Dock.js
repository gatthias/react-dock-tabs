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

  onMovingTabEnteringHeader,
  onMovingTabMovingOnHeader,
  onMovingTabEnteringContent,
  onMovingTabLeavingHeader,
  onMovingTabLeavingContent,

  dummyHeaderTab,

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

  // const tabBtnWidth = 90;
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

  const mouseDown = React.useCallback((e, tabKey) => {
    const newX = e.pageX - headerRef.current.offsetLeft;
    const handleOffset = {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY
    }
    onTabMoveStart(tabKey, newX, handleOffset);
  });

  const mouseEnterHeader = React.useCallback((e) => {
    if (movingTab != null && headerRef.current != null) {
      const newX = e.pageX - headerRef.current.offsetLeft;
      onMovingTabEnteringHeader && onMovingTabEnteringHeader(newX);
    }
  }, [movingTab, tabs]);

  const mouseMoveHeader = React.useCallback((e) => {
    if (movingTab != null && headerRef.current != null && dummyHeaderTab) {
      const newX = e.pageX - headerRef.current.offsetLeft;
      onMovingTabMovingOnHeader && onMovingTabMovingOnHeader(newX);
    }
  }, [movingTab, tabs, dummyHeaderTab]);

  const mouseLeaveHeader = React.useCallback(() => {
    if (movingTab != null) {
      onMovingTabLeavingHeader && onMovingTabLeavingHeader();
    }
  }, [movingTab, tabs]);

  const mouseEnterContent = React.useCallback(() => {
    if (movingTab != null) {
      onMovingTabEnteringContent && onMovingTabEnteringContent();
    }
  }, [movingTab, tabs]);

  const mouseLeaveContent = React.useCallback(() => {
    if (movingTab != null) {
      onMovingTabLeavingContent && onMovingTabLeavingContent();
    }
  }, [movingTab, tabs]);

  return (
    <div className="dock" data-dt-dock>
      <div
        className="dock-header"
        data-dt-dock-header
        onMouseEnter={mouseEnterHeader}
        onMouseLeave={mouseLeaveHeader}
        onMouseMove={mouseMoveHeader}
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
        data-dt-dock-content
        onMouseEnter={mouseEnterContent}
        onMouseLeave={mouseLeaveContent}
      >
        {activeTab}
      </div>
    </div>
  );
};
