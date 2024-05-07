import { useContext } from "react";
import { AthleteResults } from "./height_discipline";
import { AthleteHeightResults } from "@/app/lib/interfaces";
import { save_height_achievement } from "@/app/lib/achievement_edit/api_calls";
import { PopUp } from "@/app/lib/achievement_edit/popup";

export function StartHeightInput({ close, min_height, max_height, step_size}: { close: () => void, min_height: number, max_height: number, step_size: number }) {
    const { state, update_state } = useContext(AthleteResults)

    const start_height_values = Array.from({ length: (max_height - min_height) / step_size }, (x, i) => min_height + i * step_size);

    const update_starting_height = function (e: React.ChangeEvent<HTMLSelectElement>, athlete_result: AthleteHeightResults | undefined) {
        e.preventDefault()
        let new_value = e.target.value;
        if (athlete_result) {
            athlete_result.start_height = parseFloat(new_value)
            athlete_result.current_height = parseFloat(new_value)
            athlete_result.current_try = 1
            athlete_result.still_active = true;
            athlete_result.start_height_set = true;
            athlete_result.tries = "";

            save_height_achievement(athlete_result, () => {
                state.results.set(athlete_result.full_name(), athlete_result)
                let all_athletes_set = true;
                state.results.forEach(athlete => {
                    if(athlete.starting_number != undefined && !athlete.start_height_set){
                        all_athletes_set = false
                    }
                })
                update_state({
                    ...state,
                    results: state.results,
                    all_athletes_start_height_set: all_athletes_set
                })
            })
        } else {
            console.error("Error updating starting height")
        }
    }

    const save_starting_height = function(athlete_result: AthleteHeightResults | undefined) {
        if (athlete_result) {
            athlete_result.start_height_set = true;
            athlete_result.tries = "";

            save_height_achievement(athlete_result, () => {
                state.results.set(athlete_result.full_name(), athlete_result)
                let all_athletes_set = true;
                state.results.forEach(athlete => {
                    if(athlete.starting_number != undefined && !athlete.start_height_set){
                        all_athletes_set = false
                    }
                })
                update_state({
                    ...state,
                    results: state.results,
                    all_athletes_start_height_set: all_athletes_set
                })
            })
        } else {
            console.error("Error updating starting height")
        }
    }

    return (
        <PopUp onClose={close} title="Einstiegshöhe">
            <div className=" w-screen m-[0rem] p-4 max-w-[90vw]">
                <div className="overflow-scroll max-h-[50vh]">
                    <table className="text-center border-collapse w-full h-full">
                        <thead>
                            <tr className="border bg-slate-400">
                                <th>#</th>
                                <th>Name</th>
                                <th>Höhe (cm)</th>
                            </tr>
                        </thead>
                        <tbody className="">
                            {state.default_order.map(athlete => {
                                let athlete_result = state.results.get(athlete.full_name())
                                if (athlete_result && athlete.starting_number) {
                                    return (
                                        <tr className="border" key={athlete.starting_number}>
                                            <td className="border pt-1 pb-1">{athlete_result.starting_number}</td>
                                            <td className="border pt-1 pb-1">{athlete_result.name} {athlete_result.surname}</td>
                                            <td className={"flex pl-2 pr-2 border pt-1 pb-1 text-xl " + (athlete_result.start_height_set ? "bg-green-100 justify-center" : "bg-yellow-100 justify-between ")}>
                                                <select defaultValue={athlete_result?.start_height} onChange={(e) => update_starting_height(e, athlete_result)}>
                                                    {start_height_values.map(val => {
                                                        return (<option key={val}>{val}</option>)
                                                    })}
                                                </select>
                                                {!athlete_result.start_height_set &&
                                                 <div  className="text-3xl"onClick={() => save_starting_height(athlete_result)}>&#9989;</div>
                                                 }
                                            </td>
                                        </tr>
                                    )
                                }
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end p-2">
                    <div className={"rounded border p-2 w-fit " + (state.all_athletes_start_height_set ? "bg-green-300" : "bg-red-300")}
                        onClick={close}
                    >
                        Save
                    </div>
                </div>
            </div>
        </PopUp>
    )
}
