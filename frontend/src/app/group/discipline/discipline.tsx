import { useEffect, useState } from "react";
import { AthleteID, Discipline, IAthleteID } from "@/app/lib/interfaces";
import Title_Footer_Layout from "../subpage_layout";
import { german_discipline_states } from "@/app/lib/config";
import TimeDiscipline from "./time_discipline";
import { convert_date } from "@/app/lib/parsing";
import DistanceDiscipline from "./distance_discipline";
import HeightDiscipline from "./height/height_discipline";
import { LoadingAnimation } from "@/app/lib/loading";
import { useAsyncError } from "@/app/lib/asyncError";
import { AchievementValue } from "@/app/lib/athlete_fetching";
import EditPopup from "@/app/lib/achievement_edit/popup";

export default function Disciplines({ group_name, discipline_name }: { group_name: string, discipline_name: string | undefined }) {
    const [discipline, setDiscipline] = useState<Discipline>();
    const throwError = useAsyncError();

    useEffect(() => {
        if (discipline_name){ // Use given discipline 
            let api_url = `/api/discipline?group_name=${group_name}&discipline_name=${discipline_name}`

            fetch(api_url)
                .then(res => {
                    if (res.ok) {
                        return res.json()
                    } else {
                        throwError(new Error(`Network response was not ok: ${res.status} - ${res.statusText}`));
                    }
                })
                .then(res => {
                    setDiscipline(res)
                })
                .catch((e) => {
                    throwError(e)
                })
        }else{ // get current discipline
            let api_url = `/api/current_discipline?name=${group_name}`

            fetch(api_url)
                .then(res => {
                    if (res.ok) {
                        return res.json()
                    } else {
                        throwError(new Error(`Network response was not ok: ${res.status} - ${res.statusText}`));
                    }
                })
                .then(res => {
                    setDiscipline(res)
                })
                .catch((e) => {
                    throwError(e)
                })
        }
    }, [group_name])


    if (!discipline) {
        return (
            <Title_Footer_Layout title="Aktuelle Disciplin">
                <div className="flex justify-center items-center h-full w-full"><LoadingAnimation></LoadingAnimation></div>
            </Title_Footer_Layout>
        )
    } else if (discipline.state == "Finished") {
        return (
            <Title_Footer_Layout title={"Wettkampf Ende"}>
                <div className="flex items-center justify-center">
                    <div>Alle Disziplinen abgeschlossen. </div>
                </div>
            </Title_Footer_Layout>
        )
    } else {
        return (
            <Title_Footer_Layout title={discipline.name}>
                {
                    (discipline.discipline_type == "Time" || discipline.discipline_type == "Track") &&
                    <TimeDiscipline discipline={discipline} group_name={group_name}></TimeDiscipline>
                }
                {
                    discipline.discipline_type == "Distance" &&
                    <DistanceDiscipline discipline={discipline} group_name={group_name}></DistanceDiscipline>
                }
                {
                    discipline.discipline_type == "Height" &&
                    <HeightDiscipline discipline={discipline} group_name={group_name}></HeightDiscipline>
                }
            </Title_Footer_Layout>
        )
    }
}


export function BeforeStartInfoBox({ discipline, start_discipline, athletes, ready, children }: { discipline: Discipline, start_discipline: () => void, athletes: AthleteID[], ready: boolean, children?: React.ReactNode }) {
    const [showAthletes, setShowAthletes] = useState<boolean>(false);

    
    return (
        <div className="w-full border rounded-md p-4 sm:p-8">
            <div className="font-bold text-center text-2xl sm:text-4xl">Info</div>
            <div className="grid grid-cols-2 text-lg sm:text-xl mt-4 sm:mt-12">
                <div className="w-fit mr-4">
                    <u>Ort:</u>
                </div>
                <div className="w-fit">
                    {discipline.location}
                </div>
            </div>
            <div className="grid grid-cols-2 text-lg sm:text-xl mt-4 sm:mt-12">
                <div className="w-fit mr-4">
                    <u>Geplante Startzeit:</u>
                </div>
                <div className="w-fit">
                    {convert_date(discipline.start_time)}
                </div>
            </div>
            <div className="grid grid-cols-2 text-lg sm:text-xl mt-4 sm:mt-12">
                <div className="w-fit mr-4">
                    <u>Status:</u>
                </div>
                <div className="w-fit">
                    {german_discipline_states.get(discipline.state)}
                </div>
            </div>

            <div className="text-2xl mt-8 sm:mt-14 justify-center flex ">
                <div
                    className={"border rounded-md  w-fit p-2 sm:p-4 hover:cursor-pointer active:bg-slate-500 active:shadow-none" +
                                (ready ? " bg-stw_green shadow-lg shadow-gray-800": " bg-slate-100 shadow-none")}
                    onClick={() => start_discipline()}
                >
                    Disiplin starten
                </div>
            </div>
            
            {(athletes && athletes.length > 0) &&
            <div className="text-2xl mt-8 sm:mt-14 justify-center flex ">
                <div
                    className={"border rounded-md  w-fit p-2 sm:p-4 hover:cursor-pointer active:bg-slate-500 active:shadow-none" +
                                (ready ? " bg-slate-400 shadow-lg shadow-gray-800": " bg-slate-100 shadow-none")}
                    onClick={() => setShowAthletes(true)}
                >
                    Startreihenfolge anzeigen
                </div>
                
            </div>
            }

            {children && children}

            {showAthletes && 
                <div className="fixed flex inset-0 z-50 h-screen items-center justify-center bg-black bg-opacity-40">
                    <div className="relative min-h-12 max-h-[75%] overflow-scroll bg-white rounded-lg shadow-lg p-6 m-2 w-full max-w-md">
                        <button
                            className="absolute w-10 h-10 top-5 right-5 text-red-500 hover:text-red-800 text-4xl font-bold border border-red-300 border-solid rounded-md"
                            onClick={() => setShowAthletes(false)}
                            aria-label="Close"
                        >
                            <div className="flex items-center justify-center h-full">
                                <div>
                                &times;

                                </div>
                            </div>
                        </button>
                        <div className="text-2xl font-semibold mb-4 text-center">Startreihenfolge</div>
                        { (athletes && athletes.length > 0) ?
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="border border-slate-600 p-1 pl-2 pr-2">#</th>
                                    <th className="border border-slate-600 p-1 pl-2 pr-2">Nummer</th>
                                    <th className="border border-slate-600 p-1 pl-2 pr-2">Vorname</th>
                                    <th className="border border-slate-600 p-1 pl-2 pr-2">Nachname</th>
                                </tr>
                            </thead>
                            <tbody>
                                {athletes.map((athlete, idx) => (
                                    <tr key={athlete.starting_number} className="cursor-move even:bg-slate-200 odd:bg-slate-400">
                                        <td className="border border-slate-600 p-1 pl-2 pr-2">{idx + 1}.</td>
                                        <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete.starting_number}</td>
                                        <td className="border border-slate-600 p-1 pl-2 pr-2 ">{athlete.name}</td>
                                        <td className="border border-slate-600 p-1 pl-2 pr-2 ">{athlete.surname}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        :
                        <div>Keine Athleten gefunden</div>
                        }

                    </div>
                </div>
            }
        </div>
    )
}


export async function start_discipline(group_name: string, discipline: Discipline, callback_fn: (discipline: Discipline) => void) {
    let api_url = `/api/discipline_state?name=${group_name}`

    await fetch(api_url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "name": discipline.name,
            "state": "Active"
        })
    })
        .then(res => {
            if (res.ok) {
                callback_fn({
                    ...discipline,
                    state: "Active"
                })
            } else {
                return Promise.reject(`Network response was not ok: ${res.status} - ${res.statusText}`);
            }
        })
        .catch((e) => {
            return Promise.reject(e)
        })
}

interface AchievementDisplayProps {
    athlete_name: string, type: string, achievement: AchievementValue, 
}

export function AthleteResultsPopUp({ athletes, type, setShowResultsPopUp, unit }: { athletes: IAthleteID[], type: string, setShowResultsPopUp: (show: boolean) => void, unit: string }) {
    const [editPopup, setEditPopup] = useState<{show: boolean, athlete?: AchievementDisplayProps}>({show: false});
    const [athletesState, setAthletesState] = useState<IAthleteID[]>(athletes);

    const changeResult = function(athlete: IAthleteID) {
        let athlete_achievement = {
            athlete_name: athlete.name + "_" + athlete.surname,
            type: type,
            achievement: athlete.achievement as AchievementValue
        } as AchievementDisplayProps;
        setEditPopup({ show: true, athlete: athlete_achievement});
    }

    const saveChanges = function (new_achievement?: AchievementValue) {
        let newState = athletesState.map((athlete) => {
            if ((athlete.name + "_" + athlete.surname) === editPopup.athlete?.athlete_name) {
                return {
                    ...athlete,
                    achievement: new_achievement || athlete.achievement
                }
            }
            return athlete;
        });
        setAthletesState(newState);
        setEditPopup({ show: false, athlete: undefined });
    }

    return (
        <div className="fixed flex inset-0 z-50 h-screen items-center justify-center bg-black bg-opacity-40">
            <div className="relative min-h-12 max-h-[75%] overflow-scroll bg-white rounded-lg shadow-lg p-6 m-2 w-full max-w-md">
                <button
                    className="absolute w-10 h-10 top-5 right-5 text-red-500 hover:text-red-800 text-4xl font-bold border border-red-300 border-solid rounded-md"
                    onClick={() => setShowResultsPopUp(false)}
                    aria-label="Close"
                >
                    <div className="flex items-center justify-center h-full">
                        <div>
                        &times;

                        </div>
                    </div>
                </button>
                <div className="text-2xl font-semibold mb-4 text-center">Ergebnisse</div>
                { (athletesState && athletesState.length > 0) ?
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th className="border border-slate-600 p-1 pl-2 pr-2">#</th>
                            <th className="border border-slate-600 p-1 pl-2 pr-2">Name</th>
                            <th className="border border-slate-600 p-1 pl-2 pr-2">Leistung</th>

                        </tr>
                    </thead>
                    <tbody>
                        {athletesState.map((athlete, idx) => {
                            var result = "";

                            var final_result = athlete.achievement.Time?.final_result || athlete.achievement.Distance?.final_result || athlete.achievement.Height?.final_result;

                            if(final_result){
                                if (typeof final_result === "number") {
                                    result = final_result.toString();
                                }else{
                                    result = final_result.integral + "," + (final_result.fractional || "00");
                                }
                            }
                            return <tr onClick={() => changeResult(athlete)} key={athlete.starting_number} className="even:bg-slate-200 odd:bg-slate-400">
                                <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete.starting_number}</td>
                                <td className="border border-slate-600 p-1 pl-2 pr-2 ">{athlete.name + " " + athlete.surname}</td>
                                <td className="border border-slate-600 p-1 pl-2 pr-2 text-right ">{result} {unit}</td>
                            </tr>
                        })}
                    </tbody>
                </table>
                :
                <div>Keine Athleten gefunden</div>
                }

            </div>

            {(editPopup.show && editPopup.athlete) &&
                <EditPopup achievement={editPopup.athlete.achievement} achievementType={editPopup.athlete.type}
                    athleteName={editPopup.athlete.athlete_name} onClose={saveChanges}></EditPopup>
            }
        </div>
    )
}