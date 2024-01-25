"use client";
import React, { useState, createContext, ReactNode, useContext } from "react";
import { usePathname, useRouter } from 'next/navigation';

import { decathlon_age_groups, groups, youth_groups } from "../lib/config";

export const NavContext = createContext((x: boolean) => { });


export default function Sidebar({ showGroups, showAgeGroups, showLateRegister }: { showGroups: boolean, showAgeGroups: boolean, showLateRegister: boolean }) {
    const [showNav, setshowNav] = useState(false);
    const pathname = usePathname();
    const { replace } = useRouter();

    const getHome = function () {
        setshowNav(false)
        replace(`${pathname}`);

    }

    return (
        <NavContext.Provider value={setshowNav}>

            <div className={(showNav ? "h-screen" : "sm:max-w-[3.5rem]") + " flex sm:h-screen sm:w-[14rem] bg-gray-900 flex-col overflow-scroll"}>
                <div className="flex justify-between">
                    <button onClick={(_) => setshowNav(!showNav)} data-drawer-target="default-sidebar" data-drawer-toggle="default-sidebar" aria-controls="default-sidebar" type="button"
                        className="text-gray-500 sm:mt-2 p-2 hover:text-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                        {showNav ?
                            <span className="w-6 h-6 text-2xl sm:text-4xl">&#x2715;</span>
                            :
                            <svg className="w-6 h-6 sm:w-10 sm:h-10" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
                            </svg>

                        }
                    </button>
                    {showNav &&

                        <button onClick={getHome} data-drawer-target="default-sidebar" data-drawer-toggle="default-sidebar" aria-controls="default-sidebar" type="button"
                            className="flex text-gray-500 mt-2 p-1 hover:text-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z" />
                            </svg>
                        </button>
                    }

                </div>


                <div className={(showNav ? "flex" : "hidden") + " flex-col justify-start items-center border-b border-gray-600 w-full font-bold bg-gray-600"}>
                    {showAgeGroups &&
                        <div className="p-1 w-full">
                            <SuperItem name="Altersklassen"><AgeGroup></AgeGroup></SuperItem>
                            <hr />
                        </div>
                    }
                    {showGroups &&
                        <div className="p-1 w-full">
                            <SuperItem name="Gruppen"><Groups></Groups></SuperItem>
                            <hr />
                            <SuperItem name="Jugend"><Youth></Youth></SuperItem>
                        </div>
                    }

                    {showLateRegister &&
                        <div className="p-1 w-full">
                            <hr />
                            <div className="w-full">
                                <div className="flex text-center w-full">
                                    <button onClick={(_) => replace(`${pathname}?group=Nachmeldungen`)} className="focus:outline-none text-left  text-white flex justify-between items-center w-full py-5 space-x-14 ">
                                        <p>Nachmeldungen</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    }

                </div>
            </div>
        </NavContext.Provider>
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
    let updateAthlete = useContext(NavContext);


    const handle_click = function (group_name: string) {
        updateAthlete(false)
        replace(`${pathname}?group=${group_name}`);
    }

    return (
        <div className="flex w-full pt-1 pb-1 text-center hover:bg-white">
            <button onClick={(e) => handle_click((e.target as HTMLTextAreaElement).value)} value={props.name}>{props.name} </button>
        </div>
    )
}