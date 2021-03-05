import { uid } from "uid";

const tabBtnWidth = 90;

export class LayoutHelper {
  ////////// HELPERS
  static findWithCallbackAndReplaceNode(currentNode, findCallback, replacer) {
    if (findCallback(currentNode)) {
      return replacer(currentNode);
    } else {
      if (currentNode.children) {
        return {
          ...currentNode,
          children: currentNode.children.map(node =>
            LayoutHelper.findWithCallbackAndReplaceNode(node, findCallback, replacer)
          )
        };
      } else {
        return currentNode;
      }
    }
  }

  static findAndReplaceNode(currentNode, nodeToFind, replacer) {
    return LayoutHelper.findWithCallbackAndReplaceNode(currentNode, (node) => node === nodeToFind, replacer);
  }

  static fixupLayout = (layout) => {
    const newLayoutDraft = { ...layout };

    newLayoutDraft.mainArea = LayoutHelper.findWithCallbackAndReplaceNode(newLayoutDraft.mainArea, (node) => node.type === "dock" && node.dummyHeaderTab != null, node => {
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

    newLayoutDraft.mainArea = LayoutHelper.findWithCallbackAndReplaceNode(newLayoutDraft.mainArea, (node) => node.type === "split" && node.children && node.children.filter(children => children.dummyContentSplit != null).length > 0, node => {
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
      
        let dockRatios = 0.5;
        if(bMainAxis){
          dockRatios = splittingDock.ratio / 2;
        }

        const createdDock = {
          type: 'dock',
          uid: `dock-${uid()}`,
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

        if(bMainAxis){
          if(splitData.position === "left" || splitData.position === "top"){
            newChildren.splice(splittingDockIndex, 1, createdDock, updatedDock);
          }else if(splitData.position === "right" || splitData.position === "bottom"){
            newChildren.splice(splittingDockIndex, 1, updatedDock, createdDock);
          }
        }else{
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

          newChildren.splice(splittingDockIndex, 1, createdSplit);
        }

        return {
          ...node,
          children: newChildren
        }
      }
    });

    return newLayoutDraft;
  }

  ////////// ACTIONS
  static setLayout(state, { layout }){
    return {
      ...state,
      layout
    };
  }

  static setTabActive(state, { dock, tab }){
    const newLayoutDraft = { ...state.layout };

    const findAndReplaceDock = startNode =>
      LayoutHelper.findAndReplaceNode(startNode, dock, found => {
        return {
          ...found,
          activeTab: tab.key
        };
      });

    newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

    return {
      ...state,
      layout: newLayoutDraft
    };
  }

  static moveTabOnDock(state, { newPos }){
    if(state.movingTab && state.movingTab.status != "on-header"){
      return {
        ...state,
        movingTab: {
          ...state.movingTab,
          position: newPos
        }
      };
    }
    return state;
  }

  static splitResized(state, { splitNode, newSplits }){
    const newLayoutDraft = { ...state.layout };

    const findAndReplaceSplit = startNode =>
      LayoutHelper.findAndReplaceNode(startNode, splitNode, node => {
        return {
          ...node,
          children: node.children.map((n, i) => ({
            ...n,
            ratio: newSplits[i].ratio
          }))
        };
      });

    newLayoutDraft.mainArea = findAndReplaceSplit(newLayoutDraft.mainArea);

    return {
      ...state,
      layout: newLayoutDraft
    };
  }

  static commitTabMove(state){
    return {
      ...state,
      movingTab: null,
      layout: LayoutHelper.fixupLayout(state.layout)
    }
  }

  static tabMoveStart(state, { dockNode, tabKey, tabTitle, newX = 0, handleOffset = {x: 0, y: 0} }){
    const newMovingTab = {
      key: tabKey,
      title: tabTitle,
      status: "on-header",
      position: {
        x: newX,
        y: 0
      },
      handleOffset
    }
    
    const newLayoutDraft = { ...state.layout };

    if(dockNode.tabs.length === 1){
      newLayoutDraft.mainArea = LayoutHelper.findWithCallbackAndReplaceNode(newLayoutDraft.mainArea, (node) => node.type === "split" && node.children != null && node.children.indexOf(dockNode) > -1, node => {
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
      LayoutHelper.findWithCallbackAndReplaceNode(startNode, node => node.uid === dockNode.uid, found => {

          return {
            ...found,
            activeTab: tabKey,
            dummyHeaderTab: {
              key: tabKey,
              title: tabTitle,
              x: newX - handleOffset.x,
              moved: false
            }
          };
        });

      newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);
    }
    
    return {
      ...state,
      movingTab: newMovingTab,
      layout: newLayoutDraft
    }
  }

  static tabMoveOnHeader(state, { dockNode, newX }){
    const newMovingTab = {
      ...state.movingTab,
      position: {
        ...state.movingTab.position,
        x: newX
      }
    };
    const newLayoutDraft = { ...state.layout };

    const findAndReplaceDock = startNode =>
      LayoutHelper.findWithCallbackAndReplaceNode(startNode, node => node.uid === dockNode.uid, found => {
        return {
          ...found,
          dummyHeaderTab: {
            key: state.movingTab.key,
            title: state.movingTab.title,
            x: newX - state.movingTab.handleOffset.x,
            moved: true
          }
        };
      });

    newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

    return {
      ...state,
      movingTab: newMovingTab,
      layout: newLayoutDraft
    }
  }

  static tabEnteringDockHeader(state, { dockNode, newX, tabTitle }){
    const newMovingTab = {
      ...state.movingTab,
      status: "on-header",
      position: {
        ...state.movingTab.position,
        x: newX
      }
    };
    const newLayoutDraft = { ...state.layout };

    const findAndReplaceDock = startNode =>
      LayoutHelper.findWithCallbackAndReplaceNode(startNode, node => node.uid === dockNode.uid, found => {
        console.log("Entering dock => found")
        return {
          ...found,
          tabs: [...new Set([...found.tabs, state.movingTab.key])],
          activeTab: state.movingTab.key,
          _lastActiveTab: found.activeTab,
          dummyHeaderTab: {
            key: state.movingTab.key,
            title: tabTitle,
            x: newX - state.movingTab.handleOffset.x
          }
        };
      });

    newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

    return {
      ...state,
      movingTab: newMovingTab,
      layout: newLayoutDraft
    };
  }

  static tabLeavingDockHeader(state, { dockNode }){
    const newMovingTab = {
      ...state.movingTab,
      status: "floating"
    };
    const newLayoutDraft = { ...state.layout };

    const findAndReplaceDock = startNode =>
      LayoutHelper.findWithCallbackAndReplaceNode(startNode, node => node.uid === dockNode.uid, found => {
        const newTabs = found.tabs.filter(tabName => tabName != state.movingTab.key);
        return {
          ...found,
          tabs: newTabs,
          activeTab: found._lastActiveTab || newTabs[newTabs.length - 1],
          _lastActiveTab: undefined,
          dummyHeaderTab: undefined
        };
      });

    newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

    return {
      ...state,
      movingTab: newMovingTab,
      layout: newLayoutDraft
    };
  }

  static tabEnteringDockContent(state, { dockNode }){
    const newMovingTab = {
      ...state.movingTab,
      status: "on-content",
      positionOnContent: "center"
    };
    const newLayoutDraft = { ...state.layout };

    const findAndReplaceDock = startNode =>
      LayoutHelper.findWithCallbackAndReplaceNode(startNode, node => node.uid === dockNode.uid, found => {
        return {
          ...found,
          dummyContentSplit: {
            key: state.movingTab.key,
            position: "center"
          }
        };
      });

    newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);
    
    return {
      movingTab: newMovingTab,
      layout: newLayoutDraft
    }
  }

  static tabMovingOnDockContent(state, { dockNode, positionOnContent }){
    const newMovingTab = {
      ...state.movingTab,
      status: "on-content",
      positionOnContent
    };
    
    const newLayoutDraft = { ...state.layout };

    const findAndReplaceDock = startNode =>
      LayoutHelper.findWithCallbackAndReplaceNode(startNode, node => node.uid === dockNode.uid, found => {
        return {
          ...found,
          dummyContentSplit: {
            ...found.dummyContentSplit,
            key: state.movingTab.key,
            position: positionOnContent
          }
        };
      });

    newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

    return {
      ...state, 
      movingTab: newMovingTab,
      layout: newLayoutDraft
    };
  }

  static tabLeavingDockContent(state, { dockNode }){
    const newMovingTab = {
      ...state.movingTab,
      status: "floating",
      positionOnContent: undefined
    };

      const newLayoutDraft = { ...state.layout };

      const findAndReplaceDock = startNode =>
        LayoutHelper.findWithCallbackAndReplaceNode(startNode, node => node.uid === dockNode.uid, found => {
          return {
            ...found,
            dummyContentSplit: undefined
          };
        });

      newLayoutDraft.mainArea = findAndReplaceDock(newLayoutDraft.mainArea);

      return {
        ...state,
        movingTab: newMovingTab,
        layout: newLayoutDraft
      };
  }
}