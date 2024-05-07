import { useEffect, useState } from "react";
import { AchievementValue, Athlete, fetch_group_athletes } from "@/app/lib/athlete_fetching";
import AchievementDisplay from "./achievement";
import { createContext } from 'react';
import { decathlon_disciplines } from "@/app/lib/config";
import Title_Footer_Layout from "../subpage_layout";

interface OverviewAthlete extends Athlete {
    searched: boolean
}

export const AchievementContext = createContext({ updateAchievement: (athlete_id: number, achievement_name: string, achievement: AchievementValue) => { } });

export default function Athletes({ group_name }: { group_name: string }) {
    const [athletes, setAthletes] = useState<OverviewAthlete[]>([])

    const setOverviewAthletes = function (athletes: Athlete[]) {
        let overview_athletes = athletes
            .filter(athlete => athlete.starting_number)
            .map(athlete => {
                let overview_athlete = athlete as OverviewAthlete;
                overview_athlete.achievements = new Map(Object.entries(overview_athlete.achievements))
                overview_athlete.searched = true;
                return overview_athlete
            })
        setAthletes(overview_athletes)
    }

    useEffect(() => {
        fetch_group_athletes(group_name, setOverviewAthletes)
    }, [group_name])

    const updateAchievement = function (athlete_id: number, achievement_name: string, achievement: AchievementValue) {
        athletes[athlete_id].achievements.set(achievement_name, achievement)
    }

    const onSearch = function (search_term: string) {
        let new_highlighted_athletes: OverviewAthlete[] = athletes.map(athlete => {
            if (athlete.name.toLocaleLowerCase().includes(search_term.toLocaleLowerCase()) ||
                athlete.surname.toLocaleLowerCase().includes(search_term.toLocaleLowerCase())
            ) {
                athlete.searched = true;
            } else {
                athlete.searched = false
            }
            return athlete
        })

        setAthletes(new_highlighted_athletes)
    }

    return (
        <Title_Footer_Layout title="Athleten:innen">
            <div className="row-span-1 flex items-center justify-center">
                <input
                    id="groupAthletesearchForm"
                    placeholder="Suche ..."
                    className="p-2 text-xl border rounded shadow-sm active:border-slate-600"
                    onChange={(e) => onSearch(e.target.value)}
                ></input>
                <div className="border border-slate-900 rounded-lg p-2"
                    onClick={(_) => {
                        let input_elm = document.getElementById('groupAthletesearchForm')
                        if (input_elm instanceof HTMLInputElement) {
                            input_elm.value = "";
                        }
                        onSearch("")
                    }}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="h-6 w-6">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
            </div>

            <AchievementContext.Provider value={{ updateAchievement }}>

                <div className="grid row-span-6 items-top overflow-scroll overscroll-contain m-1 mt-3 border rounded-md">
                    <div>
                        {
                            athletes.map((athlete, index) => {
                                return athlete.searched
                                    ? (
                                        <AthleteOverview key={athlete.starting_number} athlete={athlete} athlete_number={index}></AthleteOverview>
                                    )
                                    : null
                            })
                        }
                    </div>

                </div>

            </AchievementContext.Provider>
        </Title_Footer_Layout>
    )
}

function AthleteOverview({ athlete, athlete_number }: { athlete: Athlete, athlete_number: number }) {
    const [showAchievements, setShowAchievements] = useState(false);

    const disciplines = decathlon_disciplines.map(([name, type, shortname]) => {
        return name
    })

    const full_name = athlete.name + "_" + athlete.surname;

    return (
        <div className="odd:bg-slate-300 odd:bg-opacity-30">
            <div className="grid grid-cols-4 auto-cols-fr text-lg border-b-2 pb-2 pt-2" onClick={() => setShowAchievements(!showAchievements)}>
                <div className="text-center font-bold">{athlete.starting_number}</div>
                <div className="text-left pr-2">{athlete.name}</div>
                <div className="text-left pl-2 pr-2">{athlete.surname}</div>
                {!showAchievements &&

                    <div className="text-center">&gt;</div>

                }
                {
                    showAchievements &&
                    <div className="flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="h-6 w-6">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                }
            </div>
            <div className={(showAchievements ? "p-2 bg-slate-100" : "")}>
                {showAchievements &&

                    decathlon_disciplines.map(([name, type, shortname]) => {
                        return (
                            <AchievementDisplay key={full_name + "_" + name} name={name} type={type} achievement={athlete.achievements.get(name)} athlete_name={full_name} athlete_number={athlete_number}></AchievementDisplay>
                        )
                    })
                }
            </div>


        </div>
    )
}
