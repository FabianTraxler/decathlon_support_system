import { FormEvent } from "react";
import { HeightAchievement, AchievementValue } from "../athltetes";

export function HeightResult({ achievement, athleteName, onSubmit }: { achievement?: HeightAchievement, athleteName: string, onSubmit: (form_submit: AchievementValue) => void }) {

    const form_submit = function (form_event: FormEvent<HTMLFormElement>) {
        form_event.preventDefault();
        let formData = new FormData(form_event.target as HTMLFormElement);

        let new_achievement = {
            Height: {
                name: achievement?.name || "",
                unit: achievement?.unit || "",
                final_result: parseInt(formData.get("final_result")?.toString() || "-1"),
                height_increase: parseInt(formData.get("height_increase")?.toString() || "-1"),
                start_height: parseInt(formData.get("start_height")?.toString() || "-1"),
                tries: formData.get("tries")?.toString() || ""
            }
        } as AchievementValue

        let changable_values = {
            final_result: new_achievement.Height?.final_result,
            height_increase: new_achievement.Height?.height_increase,
            start_height: new_achievement.Height?.start_height,
            tries: new_achievement.Height?.tries
        }

        fetch(`/api/achievement?athlete_name=${athleteName}&name=${new_achievement.Height?.name}`, {
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
    let height_increase = ""
    let start_height = ""
    let tries = ""
    if (achievement) {
        if (achievement.final_result) {
            final_result = achievement.final_result?.toString() || ""
        }
        if (achievement.height_increase) {
            height_increase = achievement.height_increase?.toString() || ""
        }
        if (achievement.start_height) {
            start_height = achievement.start_height?.toString() || ""
        }
        if (achievement.final_result) {
            tries = achievement.tries?.toString() || ""
        }
        unit = achievement.unit;
    }

    return (
        <div>
            <form id="time_form" onSubmit={form_submit}>
                <div className="mb-2">
                    <label>Endergebnis [{unit}]: </label>
                    <input type="number" name="final_result" className="shadow-md rounded-md bg-slate-200 w-16 text-center" defaultValue={final_result}></input>
                </div>
                <div className="mb-2">
                    <label>Starthöhe [{unit}]: </label>
                    <input type="number" name="start_height" className="shadow-md rounded-md bg-slate-200 w-16 text-center" defaultValue={start_height}></input>
                </div>

                <div className="mb-2">
                    <label>Höhenänderung [{unit}]: </label>
                    <input type="number" name="height_increase" className="shadow-md rounded-md bg-slate-200 w-16 text-center" defaultValue={height_increase}></input>
                </div>

                <div className="mb-2">
                    <label>Versuche [{unit}]: </label>
                    <textarea name="tries" className="shadow-md rounded-md bg-slate-200 w-32 text-center" defaultValue={tries}></textarea>
                </div>

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