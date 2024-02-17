"use client";

import { useSearchParams } from "next/navigation";
import Overview from "./overview";
import Header from "./header";
import { useState } from "react";
import Athletes from "./athletes/athletes";
import Field from "./field";

export default function Group() {
  const [TabHistory, setTabHistory] = useState(["overview"])
  const searchParams = useSearchParams();
  const groupName = searchParams.get("group") ?? "";

  let all_tabs = [
    "Athletenübersicht",
    "Platzübersicht",
    "Zeitplan",
    "Disziplinen & Regelwerk",
    "Aktuelle Disziplin"
  ]


  var currentTab = TabHistory[TabHistory.length - 1]
  var homescreen = (currentTab == "" || currentTab == "overview")

  const setCurrentTab = function (name: string) {
    TabHistory.push(name)
    setTabHistory([...TabHistory])
  }


  return (
    <div className="h-screen flex flex-col items-center p-0 sm:p-42 xl:p-10 w-screen sm:w-full">
      <Header homescreen={homescreen} TabHistory={TabHistory} setTab={setTabHistory}></Header>
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
        <Timetable></Timetable>
      }
      {currentTab == "Disziplinen & Regelwerk" &&
        <Rules></Rules>
      }
      {currentTab == "Aktuelle Disziplin" &&
        <Disciplines></Disciplines>
      }
    </div>
  );
}



function Timetable() {
  return (
    <div>feld</div>
  )
}
function Rules() {
  return (
    <div>regeln</div>
  )
}
function Disciplines() {
  return (
    <div>disciplinen</div>
  )
}