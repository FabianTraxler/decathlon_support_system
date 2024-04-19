import { FormEvent, useState } from "react";
import { DistanceAchievement, AchievementValue } from "@/app/lib/athlete_fetching";
import { convert_from_integral_fractional, convert_to_integral_fractional } from "@/app/lib/parsing";

type AchievementState = {
    [key: string]: number | string,
    final_result: number | string,
    first_try: number | string,
    second_try: number | string,
    third_try: number | string
}


export function DistanceResult({ achievement, athleteName, onSubmit }: { achievement?: DistanceAchievement, athleteName: string, onSubmit: (form_submit: AchievementValue) => void }) {
    let final_result: number | string = NaN;
    let unit = ""
    let first_try: number | string = NaN
    let second_try: number | string = NaN
    let third_try: number | string = NaN
    if (achievement) {
        if (achievement.final_result) {
            final_result = convert_from_integral_fractional(achievement.final_result)
        }
        if (achievement.first_try) {
            first_try = convert_from_integral_fractional(achievement.first_try)
        }
        if (achievement.second_try) {
            second_try = convert_from_integral_fractional(achievement.second_try)

        }
        if (achievement.third_try) {
            third_try = convert_from_integral_fractional(achievement.third_try)

        }
        unit = achievement.unit;
    }

    const [achievementState, setAchievementState] = useState<AchievementState>({
        final_result: final_result,
        first_try: first_try,
        second_try: second_try,
        third_try: third_try
    })



    const form_submit = function (form_event: FormEvent<HTMLFormElement>) {
        form_event.preventDefault();
        let formData = new FormData(form_event.target as HTMLFormElement);

        let new_achievement = {
            Distance: {
                name: achievement?.name || "",
                unit: achievement?.unit || "",
                final_result: convert_to_integral_fractional(formData.get("final_result")?.toString()),
                first_try: convert_to_integral_fractional(formData.get("first_try")?.toString()),
                second_try: convert_to_integral_fractional(formData.get("second_try")?.toString()),
                third_try: convert_to_integral_fractional(formData.get("third_try")?.toString())
            }
        } as AchievementValue

        let changable_values = {
            final_result: new_achievement.Distance?.final_result,
            first_try: new_achievement.Distance?.first_try,
            second_try: new_achievement.Distance?.second_try,
            third_try: new_achievement.Distance?.third_try
        }

        fetch(`/api/achievement?athlete_name=${athleteName}&name=${new_achievement.Distance?.name}`, {
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


    const handle_onChange = function (e: React.ChangeEvent<HTMLInputElement>) {
        let new_state = { ...achievementState }
        let try_name = e.target.name
        let new_value = parseFloat(e.target.value)

        new_state[try_name] = new_value;

        let first_try = 0;
        if (typeof achievementState.first_try == "number"){
            first_try = achievementState.first_try
        } else {
            first_try = parseFloat(achievementState.first_try) || 0
        }
        let second_try = 0;
        if (typeof achievementState.second_try == "number"){
            second_try = achievementState.second_try
        } else {
            second_try = parseFloat(achievementState.second_try) || 0
        }
        let third_try = 0;
        if (typeof achievementState.third_try == "number"){
            third_try = achievementState.third_try
        } else {
            third_try = parseFloat(achievementState.third_try) || 0
        }
        let max_value = Math.max(first_try, second_try, first_try)

        new_state["final_result"] = max_value

        setAchievementState(new_state)
    }


    return (
        <div>
            <form id="time_form" onSubmit={form_submit}>
                <div className="mb-2">
                    <label>Endergebnis [{unit}]: </label>
                    <input type="number" step="0.01" name="final_result" readOnly
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-slate-400 w-16 text-center"
                        value={achievementState.final_result}></input>
                </div>
                <div className="mb-2">
                    <label>1. Versuch [{unit}]: </label>
                    <input
                        onChange={handle_onChange}
                        type="number" step="0.01" name="first_try"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-md rounded-md bg-slate-200 w-16 text-center"
                        value={achievementState.first_try}
                    ></input>
                </div>

                <div className="mb-2">
                    <label>2. Versuch [{unit}]: </label>
                    <input
                        onChange={handle_onChange}
                        type="number" step="0.01" name="second_try"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none  shadow-md rounded-md bg-slate-200 w-16 text-center"
                        value={achievementState.second_try}
                    ></input>
                </div>

                <div className="mb-2">
                    <label>3. Versuch [{unit}]: </label>
                    <input
                        onChange={handle_onChange}
                        type="number" step="0.01" name="third_try"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-md rounded-md bg-slate-200 w-16 text-center"
                        value={achievementState.third_try}
                    ></input>
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