import { LayoutHelper } from "./LayoutHelper";

const actions = {};

const createAction = (actionName, reducer) => {
  actions[actionName] = reducer;
}

const actionsMethods = {
  setLayout: LayoutHelper.setLayout,

  setTabActive: LayoutHelper.setTabActive,
  splitResized: LayoutHelper.splitResized,

  tabMoveStart: LayoutHelper.tabMoveStart,
  tabMoveEnd: LayoutHelper.commitTabMove,
  tabMoveOnDock: LayoutHelper.moveTabOnDock,
  tabEnteringDockHeader: LayoutHelper.tabEnteringDockHeader,
  tabMovingOnHeader: LayoutHelper.tabMoveOnHeader,
  tabLeavingDockHeader: LayoutHelper.tabLeavingDockHeader,
  tabEnteringDockContent: LayoutHelper.tabEnteringDockContent,
  tabMovingOnDockContent: LayoutHelper.tabMovingOnDockContent,
  tabLeavingDockContent: LayoutHelper.tabLeavingDockContent
}

Object.entries(actionsMethods).forEach(([action, reducer]) => createAction(action, reducer));

export const dockTabsReducer = (state, [type, payload, callback]) => {
  if(actions[type] != null){
    const newState = actions[type](state, payload);
    if(callback && typeof callback === "function"){
      callback.call(state, newState);
    }
    return newState;
  }
  return state;
}