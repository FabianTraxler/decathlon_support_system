import { useState, useEffect } from "react";
import { AthleteID, AthleteTimeResult, Discipline, StartingOrder } from "../lib/interfaces";
import { convert_date, convert_from_integral_fractional, convert_to_integral_fractional } from "../lib/parsing";
import { german_discipline_states, long_distance_disciplines } from "../lib/config";
import { LoadingAnimation } from "../lib/loading";
import { AchievementValue, Athlete, fetch_group_athletes } from "../lib/athlete_fetching";
import { InlineEdit } from "../lib/achievement_edit/inline";

export interface Run {
    name: string,
    athletes: (AthleteTimeResult | null)[]
}

interface TimeDisciplineResults extends Discipline {
    runs: Run[]
}

function convert_order_to_order_with_results(discipline_name: string, start_order: StartingOrder | string, athlete_results: Map<string, Athlete>): Run[] {
    let runs: Run[] = []

    if (typeof start_order == "string") {
        let single_run: Run = {
            name: "Massenstart",
            athletes: []
        }
        Array.from(athlete_results.entries()).forEach(([_, athlete]) => {
            let athlete_result: AthleteTimeResult = new AthleteTimeResult(athlete.name, athlete.surname, "", athlete.starting_number)
            let discipline_achievement = athlete.achievements.get(discipline_name)
            if (discipline_achievement && discipline_achievement.Time?.final_result) {
                athlete_result.final_result = convert_from_integral_fractional(discipline_achievement.Time.final_result)
            }
            single_run.athletes.push(athlete_result)
            single_run.athletes.sort((a, b) => (a?.starting_number || Infinity) - (b?.starting_number || Infinity))
        })
        runs.push(single_run)
    } else if (start_order.Track) {
        start_order.Track.forEach(run => {
            let timing_run: Run = {
                name: run.name,
                athletes: []
            }
            run.athletes.forEach(athlete_id => {
                if (athlete_id == null) {
                    timing_run.athletes.push(null)
                } else {
                    let athlete_result = athlete_results.get(athlete_id.name + "_" + athlete_id.surname)
                    let athlete_time_result: AthleteTimeResult;
                    if (athlete_result) {
                        athlete_time_result = new AthleteTimeResult(athlete_id.name, athlete_id.surname, athlete_id.age_group, athlete_result.starting_number)
                        let discipline_achievement = athlete_result.achievements.get(discipline_name)
                        if (discipline_achievement && discipline_achievement.Time?.final_result) {
                            athlete_time_result.final_result = convert_from_integral_fractional(discipline_achievement.Time.final_result)
                        }
                    } else {
                        athlete_time_result = new AthleteTimeResult(athlete_id.name, athlete_id.surname, athlete_id.age_group, NaN)
                    }
                    timing_run.athletes.push(athlete_time_result)
                }

            })
            runs.push(timing_run)
        })
    }


    return runs
}

export default function GroupDisciplines({ group_name }: { group_name: string }) {
    const [groupState, setGroupState] = useState<
        { selected_discipline: TimeDisciplineResults | undefined, all_disciplines: Map<string, TimeDisciplineResults>, selected_run: string, reload_run_order: boolean }
    >({ selected_discipline: undefined, all_disciplines: new Map(), selected_run: "", reload_run_order: false });

    const handleRunClick = function (run_name: string) {
        if (groupState.selected_run == run_name) {
            setGroupState({ ...groupState, selected_run: "" })
        } else {
            setGroupState({ ...groupState, selected_run: run_name })
        }
    }

    const get_data = function (group_name: string, selected_discipline: Discipline | undefined) {
        setGroupState({ ...groupState, reload_run_order: true })
        fetch_group_athletes(group_name, (athletes: Athlete[]) => {
            let athlete_map = new Map();
            athletes.forEach(athelte => {
                athelte.achievements = new Map(Object.entries(athelte.achievements)) as Map<string, AchievementValue>
                athlete_map.set(athelte.name + "_" + athelte.surname, athelte)
            })
            get_run_order(selected_discipline, athlete_map)
        })
    }

    const get_run_order = function (selected_discipline: Discipline | undefined, athlete_results: Map<string, Athlete>) {
        let api_url = `/api/disciplines?name=${group_name}`

        fetch(api_url)
            .then(res => {
                if (res.ok) {
                    return res.json()
                } else {
                    throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
                }
            })
            .then(res => {
                let disciplines = res as Discipline[]
                let all_disciplines: Map<string, TimeDisciplineResults> = new Map();
                let active_discipline: TimeDisciplineResults | undefined = undefined

                disciplines.forEach(discipline => {
                    let time_discipline_results = discipline as TimeDisciplineResults;
                    time_discipline_results.runs = convert_order_to_order_with_results(discipline.name, discipline.starting_order, athlete_results)

                    if (selected_discipline?.name == discipline.name) {
                        active_discipline = time_discipline_results
                    } else if (discipline.state == "Active" && (discipline.discipline_type == "Track" || discipline.discipline_type == "Time")) {
                        active_discipline = time_discipline_results
                    }
                    all_disciplines.set(discipline.name, time_discipline_results)
                });
                setGroupState({ selected_discipline: active_discipline, all_disciplines: all_disciplines, selected_run: "", reload_run_order: false })
            })
            .catch((e) => {
                console.error(e)
                setGroupState({ selected_discipline: undefined, all_disciplines: new Map(), selected_run: "", reload_run_order: false })
            })
    }

    useEffect(() => {
        get_data(group_name, undefined)
    }, [group_name])

    const update_local_athlete_results = function (achievement: AchievementValue, athlete: AthleteTimeResult, run_id: number, track_number: number) {
        if (achievement.Time?.final_result) {
            athlete.final_result = convert_from_integral_fractional(achievement.Time?.final_result)
        }
        let new_state = { ...groupState }
        let selected_discipline = new_state.selected_discipline
        let all_disciplines = new_state.all_disciplines
        if (selected_discipline) {
            selected_discipline.runs[run_id].athletes[track_number] = athlete;
            all_disciplines.set(selected_discipline.name, selected_discipline)
            setGroupState({ ...groupState, selected_discipline: selected_discipline, all_disciplines: all_disciplines })
        }

    }


    if (groupState.all_disciplines.size == 0) {
        return (
            <div className="h-full w-[40%] flex items-center justify-center">
                <LoadingAnimation></LoadingAnimation>
            </div>
        )
    }

    return (
        <div className="w-[90%] sm:w-[80%]">
            <div className='flex justify-between text-xl sm:text-4xl p-4  mt-5'>
                <div>
                    <span>Ausgewählte Disziplin: </span>
                    <span className="block sm:inline font-bold">{groupState.selected_discipline?.name}</span>
                </div>

                <div className="float-right h-8 w-8 sm:h-10 sm:w-10 hover:cursor-pointer hover:fill-slate-500"
                    onClick={() => get_data(group_name, groupState.selected_discipline)}
                >
                    {
                        groupState.reload_run_order ?
                            <div className="h-full w-full">
                                <LoadingAnimation></LoadingAnimation>
                            </div>
                            :
                            <svg className="h-full fill-inherit" height="10px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 489.645 489.645">
                                <g id="SVGRepo_iconCarrier">
                                    <g>
                                        <path d="M460.656,132.911c-58.7-122.1-212.2-166.5-331.8-104.1c-9.4,5.2-13.5,16.6-8.3,27c5.2,9.4,16.6,13.5,27,8.3 c99.9-52,227.4-14.9,276.7,86.3c65.4,134.3-19,236.7-87.4,274.6c-93.1,51.7-211.2,17.4-267.6-70.7l69.3,14.5 c10.4,2.1,21.8-4.2,23.9-15.6c2.1-10.4-4.2-21.8-15.6-23.9l-122.8-25c-20.6-2-25,16.6-23.9,22.9l15.6,123.8 c1,10.4,9.4,17.7,19.8,17.7c12.8,0,20.8-12.5,19.8-23.9l-6-50.5c57.4,70.8,170.3,131.2,307.4,68.2 C414.856,432.511,548.256,314.811,460.656,132.911z"></path>
                                    </g>
                                </g></svg>
                    }

                </div>
            </div>
            {groupState.selected_discipline &&

                <div className="w-full">
                    <div className="w-full">
                        {groupState.selected_discipline.runs.map((run, run_id) => {
                            return (
                                <div key={run.name} className="w-full p-4 border  mt-2 shadow-md rounded-lg ">
                                    <div className={"text-lg font-bold " +
                                        (groupState.selected_run == run.name ? "mb-2" : "")}>
                                        <div className='flex justify-between hover:cursor-pointer'
                                            onClick={() => handleRunClick(run.name)}
                                        >
                                            <span>{run.name}</span>
                                            <button
                                                className="focus:outline-none text-right  text-black flex justify-between items-center">
                                                <svg id="icon1" className={"rotate-180" + (groupState.selected_run == run.name ? "rotate-180" : "")} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    {
                                        groupState.selected_run == run.name &&
                                        <table className="w-full table-auto border-collapse" >
                                            <thead >
                                                <tr>
                                                    {run.name != "Massenstart" && <th className="border border-slate-600 p-1 pl-2 pr-2">Bahn</th>}
                                                    <th className="border border-slate-600 p-1 pl-2 pr-2">#</th>
                                                    {run.name != "Massenstart" && <th className="hidden sm:table-cell border border-slate-600 p-1 pl-2 pr-2">AK</th>}
                                                    <th className="hidden sm:table-cell border border-slate-600 p-1 pl-2 pr-2">Vorname</th>
                                                    <th className="border border-slate-600 p-1 pl-2 pr-2">Nachname</th>
                                                    <th className="border border-slate-600 p-1 pl-2 pr-2">Zeit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {run.athletes.map((athlete, track_number) => {
                                                    if (athlete == null) {
                                                        return (
                                                            <tr className="bg-slate-50 opacity-45"
                                                                key={track_number || ""}>
                                                                {run.name != "Massenstart" && <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{track_number + 1}.</td>}
                                                                <td className="border border-slate-600 p-1 pl-2 pr-2 text-center"></td>
                                                                {run.name != "Massenstart" && <td className="hidden sm:table-cell border border-slate-600 p-1 pl-2 pr-2"></td>}
                                                                <td className="hidden sm:table-cell border border-slate-600 p-1 pl-2 pr-2"></td>
                                                                <td className="border border-slate-600 p-1 pl-2 pr-2"></td>
                                                                <td className='group items-center jusitfy-center border border-slate-800 text-right group-active:bg-slate-400 '></td>
                                                            </tr>
                                                        )
                                                    }
                                                    let achievement: AchievementValue = {
                                                        Time: {
                                                            name: groupState.selected_discipline?.name || "",
                                                            unit: (long_distance_disciplines.includes(groupState.selected_discipline?.name || "")) ? "min" : "s"
                                                        },
                                                    }
                                                    if (athlete.final_result) {
                                                        achievement = {
                                                            Time: {
                                                                name: groupState.selected_discipline?.name || "",
                                                                unit: (long_distance_disciplines.includes(groupState.selected_discipline?.name || "")) ? "min" : "s",
                                                                final_result: convert_to_integral_fractional(athlete.final_result.toString())
                                                            },
                                                        }
                                                    }

                                                    return (
                                                        <tr className={'' + (athlete.starting_number ? "bg-slate-400" : "bg-slate-50 opacity-45")}
                                                            key={athlete.full_name() + "_" + groupState.selected_discipline?.name || ""}>
                                                            {run.name != "Massenstart" && <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{track_number + 1}.</td>}
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete.starting_number}</td>
                                                            {run.name != "Massenstart" && <td className="hidden sm:table-cell border border-slate-600 p-1 pl-2 pr-2">{athlete.age_group}</td>}
                                                            <td className="hidden sm:table-cell border border-slate-600 p-1 pl-2 pr-2">{athlete.name}</td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.surname}</td>
                                                            <InlineEdit index={athlete.full_name() + "_" + groupState.selected_discipline?.name || ""} name={groupState.selected_discipline?.name || ""} athleteName={athlete.full_name()}
                                                                achievement_type="Time" achievement={achievement}
                                                                onSubmit={(achievement) => update_local_athlete_results(achievement, athlete, run_id, track_number)}
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
            }

            <div>
                <div className='text-xl sm:text-4xl p-4  mt-5 '>Alle Laufdisziplinen:</div>

                <table className="table-auto border-collapse w-full text-[0.8rem] 2xl:text-sm rounded-lg">
                    <thead>
                        <tr>
                            <th className="border border-slate-600 p-1 pl-2 pr-2">Name</th>
                            <th className="hidden sm:table-cell border border-slate-600 p-1 pl-2 pr-2">Status</th>
                            <th className="border border-slate-600 p-1 pl-2 pr-2">Ort</th>
                            <th className="border border-slate-600 p-1 pl-2 pr-2">Startzeit</th>
                            <th className="border border-slate-600 p-1 pl-2 pr-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from(groupState.all_disciplines.entries()).map(([_, discipline], i) => {
                            if (discipline.discipline_type == "Track" || discipline.discipline_type == "Time") {

                                return <tr key={discipline.name}>
                                    <td className='border border-slate-800 p-1 pl-2 pr-2 text-center font-bold'>{discipline.name}</td>
                                    <td className='hidden sm:table-cell border border-slate-800 p-1 pl-2 pr-2 text-center'>{german_discipline_states.get(discipline.state)}</td>
                                    <td className='border border-slate-800 p-1 pl-2 pr-2 text-center'>{discipline.location}</td>
                                    <td className='border border-slate-800 p-1 pl-2 pr-2 text-center'>{convert_date(discipline.start_time)}</td>
                                    <td className='border border-slate-800 p-1 pl-2 pr-2 text-center'>
                                        <div className={"border rounded-md shadow-md shadow-slate-700 active:shadow-none p-2 bg-opacity-30 " +
                                            (groupState.selected_discipline == discipline ? "bg-stw_green" : "bg-stw_blue")
                                        }
                                            onClick={() => (setGroupState({ ...groupState, selected_discipline: discipline, selected_run: "" }))}
                                        >
                                            {groupState.selected_discipline == discipline && <span>Ausgewählt</span>}
                                            {groupState.selected_discipline != discipline && <span>Auswählen</span>}
                                        </div>
                                    </td>
                                </tr>
                            }
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}