import React from "react";
import "./style.css";

import { Tab, DockTabs } from "./DockTabs";

export default function App() {
  const [layout, setLayout] = React.useState({
    name: "BaseLayout",
    mainArea: {
      type: "split",
      orientation: "h",
      children: [
        {
          type: "split",
          orientation: "v",
          ratio: 0.2,
          children: [
            {
              ratio: 0.5,
              type: "dock",
              tabs: ["menu-1"]
            },
            {
              ratio: 0.5,
              type: "dock",
              tabs: ["menu-2", "menu-3"]
            }
          ]
        },
        {
          ratio: 0.8,
          type: "dock",
          tabs: ["panel-1", "panel-2"],
          activeTab: "panel-2"
        }
      ]
    }
  });

  const [tabs, setTabs] = React.useState({
    "menu-1": {
      key: "menu-1",
      title: "Menu 1",
      content: <>Menu 1</>
    },
    "menu-2": {
      key: "menu-2",
      title: "Menu 2",
      content: <>Menu 2</>
    },
    "menu-3": {
      key: "menu-3",
      title: "Menu 3",
      content: <>Menu 3</>
    },
    "panel-1": {
      key: "panel-1",
      title: "Panel 1",
      content: <>Panel 1</>
    },
    "panel-2": {
      key: "panel-2",
      title: "Panel 2",
      content: <>Panel 2</>
    }
  });

  const closeTab = React.useCallback(tab => {
    const tabDef = tabs[tab.key];
    if (tabDef) {
      setTabs({
        ...tabs,
        [tab.key]: {
          ...tab,
          closed: true
        }
      });
    }
  });

  const layoutChange = React.useCallback(newLayout => setLayout(newLayout));

  return (
    <DockTabs
      layout={layout}
      onCloseTab={closeTab}
      onLayoutChange={layoutChange}
    >
      {Object.values(tabs).map(
        tab =>
          !tab.closed && (
            <Tab key={tab.key} title={tab.title}>
              {tab.content}
            </Tab>
          )
      )}
      {/*<Tab key="menu-1">Menu 1</Tab>
      <Tab key="menu-2">Menu 2</Tab>
      <Tab key="panel-1">Panel 1</Tab>
      <Tab key="panel-2">Panel 2</Tab> */}
    </DockTabs>
  );
}

// export default function App() {
//   return (
//     <HorizontalSplitter>
//       <HSplit ratio={0.2}>
//         <VerticalSplitter>
//           <VSplit ratio={0.5}>Menu 1</VSplit>
//           <VSplit ratio={0.5}>Menu 2</VSplit>
//         </VerticalSplitter>
//       </HSplit>

//       <HSplit ratio={0.8}>Pane2</HSplit>
//     </HorizontalSplitter>
//   );
// }
