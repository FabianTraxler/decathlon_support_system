"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Overview from "./overview";
import Header from "./header";
import Athletes from "./athletes/athletes";
import Field from "./field";
import Timetable from "./timetable";
import Title from "./title";
import Disciplines from "./discipline/discipline";
import { Navigation, NavigationContext, NavigationItem } from "./navigation";



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
    tab_navigation_function: (tab) => setTabHistory([...TabHistory, tab])
  } as Navigation

  let all_tabs = [
    "Aktuelle Disziplin",
    "Athletenübersicht",
    "Platzübersicht",
    "Zeitplan",
    "Disziplinen & Regelwerk",
  ]


  var currentTab = home_nav_item.name
  if (TabHistory.length > 0) {
    currentTab = TabHistory[TabHistory.length - 1].name
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
      <div className="absolute inset-0 flex flex-col items-center p-0 sm:p-42 xl:p-10 w-screen sm:w-full">
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
        {currentTab == "Disziplinen & Regelwerk" &&
          <Rules></Rules>
        }
        {currentTab == "Aktuelle Disziplin" &&
          <Disciplines group_name={groupName}></Disciplines>
        }
      </div>
    </NavigationContext.Provider>
  );
}



function Rules() {
  return (
    <div><Title title="Regelwerk"></Title></div>
  )
}
