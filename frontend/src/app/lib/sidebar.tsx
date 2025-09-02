"use client";
import React, { useState, createContext, ReactNode, useContext } from "react";
import { usePathname, useRouter } from 'next/navigation';

import { decathlon_age_groups, groups, youth_groups } from "../lib/config";
import { signOut } from "@/auth";
import { Search, SearchQuery } from "./search";

export const NavContext = createContext((x: boolean) => { });


export default function Sidebar(
    { showGroups, showAgeGroups, showLateRegister, showTeams, updateSearchQuery, searchQuery }: 
    { showGroups: boolean, showAgeGroups: boolean, showLateRegister: boolean, showTeams: boolean, updateSearchQuery?: (query: SearchQuery) => void, searchQuery?: SearchQuery }) {
    const [showNav, setshowNav] = useState(false);
    const pathname = usePathname();
    const { replace } = useRouter();

    const resetSearchQuery = function () {
        updateSearchQuery && updateSearchQuery({ global: false, queries: [] })
    }

    const getHome = function () {
        setshowNav(false)
        resetSearchQuery()
        replace(`${pathname}`);

    }

    const logout = function () {
        signOut()
    }

    return (
        <NavContext.Provider value={setshowNav}>

            <div className={(showNav ? "h-screen" : "h-[5vh] sm:max-w-[3.5rem]") + " flex sm:h-screen sm:w-[14rem] bg-gray-900 flex-col sm:overflow-scroll"}>
                <div className="flex justify-between">
                    <button onClick={(_) => setshowNav(!showNav)} data-drawer-target="default-sidebar" data-drawer-toggle="default-sidebar" aria-controls="default-sidebar" type="button"
                        className="text-gray-500 sm:mt-2 p-2 hover:text-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                        {showNav ?
                            <svg className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true" fill="currentColor" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                                <path d="M 9.15625 6.3125 L 6.3125 9.15625 L 22.15625 25 L 6.21875 40.96875 L 9.03125 43.78125 L 25 27.84375 L 40.9375 43.78125 L 43.78125 40.9375 L 27.84375 25 L 43.6875 9.15625 L 40.84375 6.3125 L 25 22.15625 Z"></path>

                            </svg> :
                            <svg className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
                            </svg>

                        }
                    </button>
                    {showNav &&

                        <button onClick={getHome} data-drawer-target="default-sidebar" data-drawer-toggle="default-sidebar" aria-controls="default-sidebar" type="button"
                            className="text-gray-500 sm:mt-2 p-2 hover:text-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z" />
                            </svg>
                        </button>

                    }
                    {showNav &&

                        <button onClick={logout} data-drawer-target="default-sidebar" data-drawer-toggle="default-sidebar" aria-controls="default-sidebar" type="button"
                            className="text-gray-500 sm:mt-2 p-2 hover:text-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true" fill="currentColor" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                <g id="SVGRepo_iconCarrier">
                                    <g>
                                        <path d="M20.034,2.357v3.824c3.482,1.798,5.869,5.427,5.869,9.619c0,5.98-4.848,10.83-10.828,10.83 c-5.982,0-10.832-4.85-10.832-10.83c0-3.844,2.012-7.215,5.029-9.136V2.689C4.245,4.918,0.731,9.945,0.731,15.801 c0,7.921,6.42,14.342,14.34,14.342c7.924,0,14.342-6.421,14.342-14.342C29.412,9.624,25.501,4.379,20.034,2.357z"></path>
                                        <path d="M14.795,17.652c1.576,0,1.736-0.931,1.736-2.076V2.08c0-1.148-0.16-2.08-1.736-2.08 c-1.57,0-1.732,0.932-1.732,2.08v13.496C13.062,16.722,13.225,17.652,14.795,17.652z"></path>
                                    </g>
                                </g>
                            </svg>
                        </button>
                    }

                </div>


                <div className={(showNav ? "flex" : "hidden") + " flex-col justify-start items-center border-b border-gray-600 w-full font-bold bg-gray-600"}>
                    {showAgeGroups &&
                        <div className="p-1 w-full">
                            <SuperItem name="Altersklassen"><AgeGroup resetSearchQuery={resetSearchQuery}></AgeGroup></SuperItem>
                            <hr />
                        </div>
                    }
                    {showGroups &&
                        <div className="p-1 w-full">
                            <SuperItem name="Gruppen"><Groups resetSearchQuery={resetSearchQuery}></Groups></SuperItem>
                            <hr />
                            <SuperItem name="Jugend"><Youth resetSearchQuery={resetSearchQuery}></Youth></SuperItem>
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
                    {showTeams &&
                        <div className="p-1 w-full">
                            <hr />
                            <Teams resetSearchQuery={resetSearchQuery}></Teams>
                        </div>
                    }

                    {updateSearchQuery &&
                        <div  className="p-2 w-full">
                            <hr />
                            <div className="mt-2 p-2  border-white border rounded-md" >
                                <div className="overflow-hidden text-white"> 
                                    <Search updateQuery={updateSearchQuery} searchQuery={searchQuery} showGlobal={true}></Search>
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
                <button onClick={(_) => setshowContent(!showContent)} className="focus:outline-none text-left  text-white flex justify-between items-center w-full py-5 space-x-14 hover:text-slate-300">
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

function AgeGroup({resetSearchQuery}: {resetSearchQuery?: () => void}) {
    return (
        <div className="flex-col  w-full justify-start font-bold bg-gray-400">
            {decathlon_age_groups.map(name => <GroupSelection key={name} name={name} resetSearchQuery={resetSearchQuery}></GroupSelection>)}
        </div>
    )
}
function Groups({resetSearchQuery}: {resetSearchQuery?: () => void}) {
    return (
        <div className="flex-col w-full justify-start font-bold bg-gray-400" >
            {groups.map(name => <GroupSelection key={name} name={"Gruppe " + name} resetSearchQuery={resetSearchQuery}></GroupSelection>)}
        </div>
    )
}
function Youth({resetSearchQuery}: {resetSearchQuery?: () => void}) {
    return (
        <div className="flex-col w-full justify-start font-bold bg-gray-400" >
            {youth_groups.map(name => <GroupSelection key={name} name={name} resetSearchQuery={resetSearchQuery}></GroupSelection>)}
        </div>
    )
}

function Teams({resetSearchQuery}: {resetSearchQuery?: () => void}){
    const pathname = usePathname();
    const { replace } = useRouter();
    let updateAthlete = useContext(NavContext);


    const handle_click = function (e: React.MouseEvent) {
        updateAthlete(false)
        resetSearchQuery && resetSearchQuery()
        replace(`${pathname}?group=teams`);
    }
    return (
        <div className="flex text-center w-full" >
            <div onClick={handle_click} className="focus:outline-none text-left hover:text-slate-300 text-white flex justify-between items-center w-full py-5 space-x-14 hover:cursor-pointer">
                <p>Teams</p>
            </div>
        </div>
    )
}

type GroupProps = {
    name: string
    resetSearchQuery?: () => void
}

function GroupSelection(props: GroupProps) {
    const pathname = usePathname();
    const { replace } = useRouter();
    let updateAthlete = useContext(NavContext);


    const handle_click = function (group_name: string) {
        updateAthlete(false)
        props.resetSearchQuery && props.resetSearchQuery()
        replace(`${pathname}?group=${group_name}`);
    }

    return (
        <div onClick={(e) => handle_click(props.name)} className="flex w-full text-xl sm:text-lg pl-2 pt-1 pb-1 text-center hover:bg-white hover:cursor-pointer">
            <button  value={props.name}>{props.name} </button>
        </div>
    )
}