import React from "react";
import { Tab } from "./Tab";
import "./Dock.css";

export const Dock = ({
  activeTabKey,
  tabs,
  children,
  setTabActive,
  closeTab,
  onTabMoving,
  onTabMoved,
  onTabMoveStart,
  movingTab,

  onMovingTabEnteringHeader,
  onMovingTabEnteringContent,
  onMovingTabLeavingHeader,
  onMovingTabLeavingContent
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

  const mouseDown = React.useCallback(tabKey => {
    onTabMoveStart(tabKey);
  });

  const mouseEnterHeader = React.useCallback(() => {
    if (movingTab != null) {
      onMovingTabEnteringHeader && onMovingTabEnteringHeader();
    }
  }, [movingTab]);

  const mouseLeaveHeader = React.useCallback(() => {
    if (movingTab != null) {
      onMovingTabLeavingHeader && onMovingTabLeavingHeader();
    }
  }, [movingTab]);

  const mouseEnterContent = React.useCallback(() => {
    if (movingTab != null) {
      onMovingTabEnteringContent && onMovingTabEnteringContent();
    }
  }, [movingTab]);

  const mouseLeaveContent = React.useCallback(() => {
    if (movingTab != null) {
      onMovingTabLeavingContent && onMovingTabLeavingContent();
    }
  }, [movingTab]);

  return (
    <div className="dock" data-dt-dock>
      <div
        className="dock-header"
        data-dt-dock-header
        onMouseEnter={mouseEnterHeader}
        onMouseLeave={mouseLeaveHeader}
      >
        {_tabs.map(tab => (
          <div
            className={`tab-btn${activeTabKey === tab.key ? " active" : ""}`}
            onClick={() => setTabActive(tab)}
            onMouseDown={() => mouseDown(tab.key)}
          >
            <span className="tab-btn-title">{tab.props.title || tab.key}</span>
            <button
              className="tab-btn-close"
              onClick={e => (e.stopPropagation(), closeTab(tab))}
            >
              x
            </button>
          </div>
        ))}
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
