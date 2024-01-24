"use client";
import React, { useState } from "react";
import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { decathlon_age_groups, groups, youth_groups } from "../lib/config";

export default function Sidebar() {
    const [showNav, setshowNav] = useState(false);

    return (
        <div className={(showNav ? "h-screen" : "sm:max-w-[3rem]") + " flex sm:h-screen sm:w-[14rem] bg-gray-900 flex-col overflow-scroll"}>
            <button onClick={(_) => setshowNav(!showNav)} data-drawer-target="default-sidebar" data-drawer-toggle="default-sidebar" aria-controls="default-sidebar" type="button" 
            className="text-gray-500 mt-2 p-1 hover:text-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                {showNav ? 
                    <svg className="w-6 h-6 sm:w-10 sm:h-10" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <line x1="1" y1="11"
                            x2="11" y2="1"
                            stroke="currentColor"
                            stroke-width="2" />
                        <line x1="1" y1="1"
                            x2="11" y2="11"
                            stroke="currentColor"
                            stroke-width="2" />
                    </svg>
                    :
                    <svg className="w-6 h-6 sm:w-10 sm:h-10" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
                    </svg>

                }
            </button>

            <div className={(showNav ? "flex" : "hidden") + " flex-col justify-start items-center border-b border-gray-600 w-full font-bold bg-gray-600"}>
                <SuperItem name="Altersklassen"><AgeGroup></AgeGroup></SuperItem>
                <hr />
                <SuperItem name="Gruppen"><Groups></Groups></SuperItem>
                <hr />
                <SuperItem name="Jugend"><Youth></Youth></SuperItem>

            </div>
        </div>
    )
}

function SuperItem({ name, children }: { name: string, children: ReactNode }) {
    const [showContent, setshowContent] = useState(false);

    return (
        <div className="w-full">
            <div className="flex text-center w-full">
                <button onClick={(_) => setshowContent(!showContent)} className="focus:outline-none text-left  text-white flex justify-between items-center w-full py-5 space-x-14 ">
                    <p>{name}</p>
                    <svg id="icon1" className={"rotate-180" + (showContent ? "rotate-180" : "")} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

            </div>
            {showContent &&
                children
            }
        </div>
    )
}

function AgeGroup() {
    return (
        <div className="flex-col  w-full justify-start font-bold bg-gray-400">
            {decathlon_age_groups.map(name => <GroupSelection key={name} name={name}></GroupSelection>)}
        </div>
    )
}
function Groups() {
    return (
        <div className="flex-col w-full justify-start font-bold bg-gray-400" >
            {groups.map(name => <GroupSelection key={name} name={"Gruppe " + name}></GroupSelection>)}
        </div>
    )
}
function Youth() {
    return (
        <div className="flex-col w-full justify-start font-bold bg-gray-400" >
            {youth_groups.map(name => <GroupSelection key={name} name={"U" + name}></GroupSelection>)}
        </div>
    )
}

type GroupProps = {
    name: string
}

function GroupSelection(props: GroupProps) {
    const pathname = usePathname();
    const { replace } = useRouter();

    const handle_click = function (group_name: string) {
        replace(`${pathname}?group=${group_name}`);
    }

    return (
        <div className="flex w-full pt-1 pb-1 text-center hover:bg-white">
            <button onClick={(e) => handle_click((e.target as HTMLTextAreaElement).value)} value={props.name}>{props.name} </button>
        </div>
    )
}