import { FormEvent } from "react";
import { AchievementValue, TimeAchievement } from "@/app/lib/athlete_fetching";
import { convert_to_integral_fractional } from "@/app/lib/parsing";


export function TimeResult({ achievement, athleteName, onSubmit }: { achievement?: TimeAchievement, athleteName: string, onSubmit: (form_submit: AchievementValue) => void }) {

    const form_submit = function (form_event: FormEvent<HTMLFormElement>, unit_format: string) {
        form_event.preventDefault();
        let formData = new FormData(form_event.target as HTMLFormElement);
        let final_result_string = formData.get("final_result")?.toString() || ""

        if (unit_format == "mm:ss,sss"){
            final_result_string = final_result_string.replace(".", ",")
            let min = parseInt(final_result_string.split(":")[0])
            let sec = parseInt(final_result_string.split(":")[1].split(",")[0])
            let full_sec = min * 60 + sec;
            final_result_string = full_sec.toString() + "," + final_result_string.split(",")[1]
        }

        let final_result = convert_to_integral_fractional(final_result_string)

        let new_achievement = {
            Time: {
                name: achievement?.name || "",
                unit: achievement?.unit || "",
                final_result: final_result
            }
        } as AchievementValue

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
                        throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
                    }
                })
            }
        }).catch(e => {
            alert(`Not updated: ${e}`)
        }
        )

    }

    let final_result = "";
    let unit = ""
    if (achievement) {
        if (achievement.final_result) {
            final_result = achievement.final_result?.integral.toString() || ""
            final_result += ","
            final_result += achievement.final_result?.fractional.toString() || ""
        }
        if (achievement.name == "1500 Meter Lauf"){
            unit = "mm:ss,sss"
        } else{
            unit = "ss,sss"
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
