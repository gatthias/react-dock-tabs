import { uid } from "uid";

class NodeBuilder {
    constructor(){
        this.type = "node";
        this.ratio = 1;
    }

    setSizeRatio(newRatio){
        this.ratio = newRatio;
        return this;
    }

    toData(){
        return {
            type: this.type,
            ratio: this.ratio
        }
    }
}

class DockNodeBuilder extends NodeBuilder {
    constructor(){
        super();
        this.type = "dock";
        this.tabs = [];
        this.uid = uid();
        this.activeTab = null;
    }

    addTab(newTab){
        this.tabs.push(newTab);
        return this;
    }

    setActiveTab(tabKey){
        this.activeTab = tabKey;
        return this;
    }

    toData(){
        return {
            ...super.toData(),
            uid: this.uid,
            tabs: this.tabs,
            activeTab: this.activeTab
        }
    }
}

class SplitNodeBuilder extends NodeBuilder {

    constructor(){
        super();
        this.type = "split";
        this.orientation = "h";
        this.children = [];
    }

    setOrientation(splitOrientation){
        this.orientation = splitOrientation;
        return this;
    }

    split(newChild){
        this.children.push(newChild);
        return this;
    }

    toData(){
        return {
            ...super.toData(),
            orientation: this.orientation,
            children: this.children.map(child => child.toData())
        }
    }
}

class LayoutNodeBuilder extends NodeBuilder {
    constructor(layoutName){
        super();
        this.type = "layout";
        this.mainArea = new SplitNodeBuilder();
        this.name = layoutName;
    }

    setOrientation(splitOrientation){
        this.mainArea.orientation = splitOrientation;
        return this;
    }

    split(newChild){
        this.mainArea.children.push(newChild);
        return this;
    }

    toData(){
        return {
            ...super.toData(),
            name: this.name,
            mainArea: this.mainArea.toData()
        }
    }
}

export class LayoutBuilder {

    static newLayout(layoutName){
        return new LayoutNodeBuilder(layoutName);
    }

    static newDock(){
        return new DockNodeBuilder();
    }

    static newSplitter(){
        return new SplitNodeBuilder();
    }

}