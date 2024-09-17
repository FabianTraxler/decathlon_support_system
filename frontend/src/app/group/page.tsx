"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Overview from "./overview";
import Header from "./header";
import Athletes from "./athletes/athletes";
import Field from "./field";
import Timetable from "./timetable";
import Disciplines from "./discipline/discipline";
import { Navigation, NavigationContext, NavigationItem } from "./navigation";
import Rules from "./rules";



export default function Group() {
  const [TabHistory, setTabHistory] = useState<NavigationItem[]>([])
  const searchParams = useSearchParams();
  const groupName = searchParams.get("group") ?? "";

  let home_nav_item = {
    name: "overview",
    reset_function: () => setTabHistory([])
  } as NavigationItem

  const navigation = {
    history: [home_nav_item],
    max_history: 5,
    tab_navigation_function: (tab) => setTabHistory([...TabHistory, tab]),
  } as Navigation

  let all_tabs = [
    "Athletenübersicht",
    "Platzübersicht",
    "Zeitplan",
    "Regelwerk",
    "Aktuelle Disziplin"
  ]

  var currentTab = home_nav_item.name

  if (TabHistory.length > 0) {
    currentTab = TabHistory[TabHistory.length - 1].name
  }
  var selected_discipline = undefined
  if (currentTab.includes("--")){
    selected_discipline = currentTab.split("--")[1]
    currentTab = currentTab.split("--")[0]
  }

  var homescreen = (currentTab == "" || currentTab == "overview")

  const setCurrentTab = function (name: string) {
    let reset_function = function() {
      setTabHistory([...TabHistory, {name:name, reset_function: reset_function}])
    }
    TabHistory.push({name:name, reset_function: reset_function})
    setTabHistory([...TabHistory])
  }


  return (
    <NavigationContext.Provider value={navigation}>
      <div className="absolute inset-0 flex flex-col items-center p-0 sm:p-42 xl:p-10 w-screen sm:w-full smallPhone:overflow-scroll">
        <Header homescreen={homescreen}></Header>
        {homescreen && (
          <Overview groupname={groupName} changeTab={setCurrentTab} allTabs={all_tabs}></Overview>
        )}
        {currentTab == "Athletenübersicht" &&
          <Athletes group_name={groupName}></Athletes>
        }
        {currentTab == "Platzübersicht" &&
          <Field></Field>
        }
        {currentTab == "Zeitplan" &&
          <Timetable group_name={groupName}></Timetable>
        }
        {currentTab == "Regelwerk" &&
          <Rules group_name={groupName}></Rules>
        }
        {currentTab == "Aktuelle Disziplin" &&
          <Disciplines group_name={groupName} discipline_name={selected_discipline}></Disciplines>
        }
      </div>
    </NavigationContext.Provider>
  );
}
