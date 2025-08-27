import { FormEvent } from "react";
import { AchievementValue, TimeAchievement } from "@/app/lib/athlete_fetching";
import { convert_to_integral_fractional } from "@/app/lib/parsing";
import { long_distance_disciplines, MAX_DISCIPLINE_PERFORMANCE } from "../config";
import { useAsyncError } from "../asyncError";


export function TimeResult({ achievement, athleteName, onSubmit }: { achievement?: TimeAchievement, athleteName: string, onSubmit: (form_submit: AchievementValue) => void }) {
    const throwError = useAsyncError();

    const form_submit = function (form_event: FormEvent<HTMLFormElement>, unit_format: string) {
        form_event.preventDefault();
        let formData = new FormData(form_event.target as HTMLFormElement);
        let final_result_string = formData.get("final_result")?.toString() || ""

        if (!/^[0-9,.:]*$/.test(final_result_string)) {
            alert("Invalid format: Non digits detected -> not uploaded")
            return
        }

        if (unit_format == "mm:ss,ss" && final_result_string.includes(":")){
            final_result_string = final_result_string.replace(".", ",")
            let min = parseInt(final_result_string.split(":")[0])
            let sec = parseInt(final_result_string.split(":")[1].split(",")[0])
            let full_sec = min * 60 + sec;
            final_result_string = full_sec.toString() + "," + final_result_string.split(",")[1]
        }

        let new_value = parseFloat(final_result_string);
        let min_value = MAX_DISCIPLINE_PERFORMANCE.get(achievement?.name || "") || 9999;

        if( new_value < min_value) {
            if(!confirm(`Neuer Weltrekord! Ganz sicher?`)) {
                return achievement
            }
        }

        let final_result = convert_to_integral_fractional(final_result_string)
        let new_achievement = {
            Time: {
                name: achievement?.name || "",
                unit: achievement?.unit || "",
                final_result: final_result
            }
        } as AchievementValue

        if (final_result){ // value available
            if(final_result.fractional >= 100){
                alert("Invalid format: Only 2 decimal values allowed -> not uploaded")
                return
            }
            let changable_values = {
                final_result: new_achievement.Time?.final_result
            }
    
            fetch(`/api/achievement?athlete_name=${athleteName}&name=${new_achievement.Time?.name}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(changable_values)
            }).then(res => {
                if (res.ok) {
                    onSubmit(new_achievement)
                } else {
                    let name = athleteName.split("_")[0];
                    let surname = athleteName.split("_")[1]
                    fetch(`/api/achievement?name=${name}&surname=${surname}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(new_achievement)
                    }).then(res => {
                        if (res.ok) {
                            onSubmit(new_achievement)
                        } else {
                            throwError(new Error(`Network response was not ok: ${res.status} - ${res.statusText}`));
                        }
                    })
                }
            }).catch(e => {
                throwError(new Error(`Not updated: ${e}`))
            }
            )
        }else{ // final result deleted
            fetch(`/api/achievement?athlete_name=${athleteName}&name=${new_achievement.Time?.name}`, {
                method: "Delete",
            }).then(res => {
                if(res.ok){
                    onSubmit(new_achievement)
                }else{
                    throwError(new Error(res.statusText))
                }
            }).catch(e => {
                throwError(new Error(`Not deleted: ${e}`))
            }
            )
        }


    }

    let final_result = "";
    let unit = ""
    if (achievement) {
        if (achievement.final_result) {
            final_result = achievement.final_result?.integral.toString() || ""
            final_result += ","
            final_result += achievement.final_result?.fractional.toString() || ""
        }
        if (long_distance_disciplines.includes(achievement.name)){
            unit = "mm:ss,ss"
        } else{
            unit = "ss,ss"
        }
    }

    return (
        <div>
            <form id="time_form" onSubmit={(e) => form_submit(e, unit)}>
                <label>Endergebnis [{unit}]: </label>
                <input name="final_result" className="shadow-md rounded-md bg-slate-200 w-16 text-center" defaultValue={final_result}></input>
                <div
                    className="flex flex-shrink-0 flex-wrap items-center justify-end rounded-b-md border-t-2 border-neutral-100 border-opacity-100 p-4 dark:border-opacity-50">
                    <button
                        type="submit" form="time_form"
                        value="Submit"
                        className="border rounded-md shadow-md inline-block hover:bg-green-300 bg-primary-100 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-primary-700 transition duration-150 ease-in-out hover:bg-primary-accent-100 focus:bg-primary-accent-100 focus:outline-none focus:ring-0 active:bg-primary-accent-200">
                        Save
                    </button>
                </div>
            </form>
        </div>
    )
}
