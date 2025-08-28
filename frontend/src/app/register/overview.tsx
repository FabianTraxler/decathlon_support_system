"use client";

import { useSearchParams } from 'next/navigation';
import Title from '../lib/title';
import GroupAthletes from './group_athletes';
import { TeamsTable } from '../lib/teams';

export default function Overview() {
    let searchParams = useSearchParams();
    let groupName = searchParams.get('group') ?? "Übersicht";
    let title = ""
    if (groupName == "Nachmeldungen") {
        title = groupName
    }  else if (groupName == "teams") {
        title = "Teams"
    } 
    else {
        title = "Anmeldung " + groupName
    }


    return (
        <div className="h-[95vh] sm:h-screen max-h-screen overflow-scroll flex flex-col items-center p-0 sm:p-42 xl:p-0 w-screen sm:w-full">
            <Title title={title}></Title>
            {groupName == "teams" ?
                <TeamsTable show_points={false}></TeamsTable>
                :
                <GroupAthletes groupName={groupName}></GroupAthletes>
            }
        </div>
    )


}
