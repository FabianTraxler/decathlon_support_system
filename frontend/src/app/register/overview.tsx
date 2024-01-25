"use client";

import { useSearchParams } from 'next/navigation';
import Title from '../lib/title';
import GroupAthletes from './group_athletes';

export default function Overview() {
    let searchParams = useSearchParams();
    let groupName = searchParams.get('group') ?? "Übersicht";
    let title = ""
    if (groupName == "Nachmeldungen") {
        title = groupName
    } else {
        title = "Anmeldung " + groupName
    }


    return (
        <div className="min-h-screen max-h-screen overflow-scroll flex flex-col items-center p-4 2xl:p-10 w-full">
            <Title title={title}></Title>
            <GroupAthletes groupName={groupName}></GroupAthletes>
        </div>
    )


}
