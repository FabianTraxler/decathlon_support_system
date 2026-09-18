import { useEffect, useState } from "react";
import { IAthleteID } from "@/app/lib/interfaces";
import { AchievementValue } from "@/app/lib/athlete_fetching";
import EditPopup from "@/app/lib/achievement_edit/popup";

interface AchievementDisplayProps {
    athlete_name: string, type: string, achievement: AchievementValue, 
}

export function AthleteResultsPopUp({ athletes, type, setShowResultsPopUp, unit, sort_ascending = false }: { athletes: IAthleteID[], type: string, setShowResultsPopUp: (show: boolean) => void, unit: string, sort_ascending?: boolean }) {
    const [editPopup, setEditPopup] = useState<{show: boolean, athlete?: AchievementDisplayProps}>({show: false});
    const [sorted, setSorted] = useState<{ sort_by: string, sort_ascending: boolean }>({ sort_by: "achievement", sort_ascending: sort_ascending });

    var sorted_athletes = sort_athletes(athletes, sorted.sort_by, sorted.sort_ascending);
    const [athletesState, setAthletesState] = useState<IAthleteID[]>(sorted_athletes);

    useEffect(() => {
        setAthletesState(sort_athletes(athletesState, sorted.sort_by, sorted.sort_ascending));
    }, [athletesState, sorted.sort_by, sorted.sort_ascending]);

    const handleSort = (sort_by: string) => {
        if (sorted.sort_by === sort_by) {
            setSorted({ sort_by, sort_ascending: !sorted.sort_ascending });
        } else {
            setSorted({ sort_by, sort_ascending: true });
        }
    };

    const getSortIndicator = (column: string) => {
        if (sorted.sort_by === column) {
            return sorted.sort_ascending ? "▲" : "▼";
        }
        return "";
    };


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
                            <th className="border border-slate-600 p-1 pl-2 pr-2" onClick={() => handleSort("starting_number")}># {getSortIndicator("starting_number")}</th>
                            <th className="border border-slate-600 p-1 pl-2 pr-2" onClick={() => handleSort("name")}>Name {getSortIndicator("name")}</th>
                            <th className="border border-slate-600 p-1 pl-2 pr-2" onClick={() => handleSort("achievement")}>Leistung {getSortIndicator("achievement")}</th>

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
                                    result = final_result.integral + "," + (final_result.fractional.toString().padStart(2, "0")  || "00");
                                }
                            }
                            if(result == "-1.0" || result == "-1,00" || result == "" || result == "0,00" ||result == "0.0") {
                                result = "X";
                                unit = "";
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


function sort_athletes(athletes: IAthleteID[], sort_by: string, sort_ascending: boolean): IAthleteID[] {
    var sorted_athletes = [...athletes];
    if (sort_by == "name") {
        sorted_athletes.sort((a, b) => {
            if (a.surname < b.surname) return sort_ascending ? -1 : 1;
            if (a.surname > b.surname) return sort_ascending ? 1 : -1;
            return 0;
        });
    } else if (sort_by == "achievement") {
        sorted_athletes.sort((a, b) => {
            var resultA = a.achievement.Time?.final_result || a.achievement.Distance?.final_result || a.achievement.Height?.final_result || 0;
            var resultB = b.achievement.Time?.final_result || b.achievement.Distance?.final_result || b.achievement.Height?.final_result || 0;
            if (typeof resultA === "object" && typeof resultB === "object") {
                resultA = resultA.integral + resultA.fractional / 100;
                resultB = resultB.integral + resultB.fractional / 100;
            }
            if (resultA < resultB) return sort_ascending ? -1 : 1;
            if (resultA > resultB) return sort_ascending ? 1 : -1;
            return 0;
        });
    } else if (sort_by == "starting_number") {
        sorted_athletes.sort((a, b) => {
            const numA = a.starting_number || 0;
            const numB = b.starting_number || 0;

            if (numA < numB) return sort_ascending ? -1 : 1;
            if (numA > numB) return sort_ascending ? 1 : -1;
            return 0;
        });
    }
    return sorted_athletes;
}