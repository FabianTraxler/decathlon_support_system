import { useEffect, useState } from "react";
import { AchievementValue, Athlete, fetch_group_athletes } from "../lib/athlete_fetching";
import { InlineEdit } from "../lib/achievement_edit/inline";
import { Run } from "./group";
import { convert_to_integral_fractional } from "../lib/parsing";
import { AthleteTimeResult } from "../lib/interfaces";

export default function TrackOverview({ runs, discipline_name, updateAthleteResults }:
    { runs: Run[], discipline_name: string, updateAthleteResults: (results: Map<string, Athlete>) => void }) {
    const [selectedRun, setSelectedRun] = useState("")

    const handleRunClick = function (run_name: string) {
        if (selectedRun == run_name) {
            setSelectedRun("")
        } else {
            setSelectedRun(run_name)
        }
    }

    const update_local_result = function (achievement: AchievementValue, athlete: AthleteTimeResult) {

    }


    return (
        <div className="w-full">
            <div className="w-full">
                {runs.map(run => {
                    return (
                        <div key={run.name} className="w-full p-4 border  mt-2 shadow-md rounded-lg ">
                            <div className={"text-lg font-bold " +
                                (selectedRun == run.name ? "mb-2" : "")}>
                                <div className='flex justify-between hover:cursor-pointer'
                                    onClick={() => handleRunClick(run.name)}
                                >
                                    <span>{run.name}</span>
                                    <button
                                        className="focus:outline-none text-right  text-black flex justify-between items-center">
                                        <svg id="icon1" className={"rotate-180" + (selectedRun == run.name ? "rotate-180" : "")} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            {
                                selectedRun == run.name &&
                                <table className="w-full table-auto border-collapse" >
                                    <thead >
                                        <tr>
                                            {run.name != "Massenstart" && <th className="border border-slate-600 p-1 pl-2 pr-2">Bahn</th>}
                                            <th className="border border-slate-600 p-1 pl-2 pr-2">#</th>
                                            {run.name != "Massenstart" && <th className="border border-slate-600 p-1 pl-2 pr-2">AK</th>}
                                            <th className="border border-slate-600 p-1 pl-2 pr-2">Vorname</th>
                                            <th className="border border-slate-600 p-1 pl-2 pr-2">Nachname</th>
                                            <th className="border border-slate-600 p-1 pl-2 pr-2">Zeit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {run.athletes.map((athlete, track_number) => {
                                            let achievement: AchievementValue = {
                                                Time: {
                                                    name: discipline_name,
                                                    unit: (discipline_name == "1500 Meter Lauf") ? "min" : "s"
                                                },
                                            }
                                            if (athlete.final_result) {
                                                achievement = {
                                                    Time: {
                                                        name: discipline_name,
                                                        unit: (discipline_name == "1500 Meter Lauf") ? "min" : "s",
                                                        final_result: convert_to_integral_fractional(athlete.final_result.toString())                                                    },
                                                }
                                            }

                                            return (
                                                <tr className={'' + (athlete.starting_number ? "bg-slate-400" : "bg-slate-50 opacity-45")}
                                                    key={athlete.full_name() + "_" + { discipline_name }}>
                                                    {run.name != "Massenstart" && <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{track_number + 1}.</td>}
                                                    <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete.starting_number}</td>
                                                    {run.name != "Massenstart" && <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.age_group}</td>}
                                                    <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.name}</td>
                                                    <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.surname}</td>
                                                    <InlineEdit index={athlete.full_name() + "_" + { discipline_name }} name={discipline_name} athleteName={athlete.full_name()}
                                                        achievement_type="Time" achievement={achievement}
                                                        onSubmit={(achievement) => update_local_result(achievement, athlete)}
                                                    ></InlineEdit>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            }

                        </div>
                    )
                })}
            </div>
        </div >
    )
}

export function TimeOverview({ group_name }: { group_name: string }) {
    const [groupAthletes, setGroupAthletes] = useState<Athlete[]>([])

    useEffect(() => {
        fetch_group_athletes(group_name, setGroupAthletes)
    }, [group_name])

    return (
        <div>

        </div>
    )
}