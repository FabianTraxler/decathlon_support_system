import { FormEvent, useState } from "react";
import { DistanceAchievement, AchievementValue } from "@/app/lib/athlete_fetching";
import { convert_from_integral_fractional, convert_to_integral_fractional } from "@/app/lib/parsing";
import { useAsyncError } from "../asyncError";
import { MAX_DISCIPLINE_PERFORMANCE } from "../config";

type AchievementState = {
    [key: string]: number | string,
    final_result: number | string,
    first_try: number | string,
    second_try: number | string,
    third_try: number | string
}


export function DistanceResult({ achievement, athleteName, onSubmit }: { achievement?: DistanceAchievement, athleteName: string, onSubmit: (form_submit: AchievementValue) => void }) {
    const throwError = useAsyncError();

    let final_result: number | string = "";
    let unit = ""
    let first_try: number | string = ""
    let second_try: number | string = ""
    let third_try: number | string = ""
    if (achievement) {
        if (achievement.final_result) {
            if (typeof achievement.final_result === "number") {
                final_result = achievement.final_result;
            }else{
                final_result = convert_from_integral_fractional(achievement.final_result)
            }
        }
        if (achievement.first_try) {
            if (typeof achievement.first_try === "number") {
                first_try = achievement.first_try == -1 ? "X" : achievement.first_try;
            }else{
                first_try = convert_from_integral_fractional(achievement.first_try)
            }
        }
        if (achievement.second_try) {
            if (typeof achievement.second_try === "number") {
                second_try = achievement.second_try == -1 ? "X" : achievement.second_try;
            }else{
                second_try = convert_from_integral_fractional(achievement.second_try)
            }
        }
        if (achievement.third_try) {
            if (typeof achievement.third_try === "number") {
                third_try = achievement.third_try == -1 ? "X" : achievement.third_try;
            }else{
                third_try = convert_from_integral_fractional(achievement.third_try)
            }
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
        
        let new_value = parseFloat(formData.get("final_result")?.toString() || "0");
        let max_value = MAX_DISCIPLINE_PERFORMANCE.get(achievement?.name || "") || 9999;

        if( new_value > max_value) {
            if(!confirm(`Neuer Weltrekord! Ganz sicher?`)) {
                return achievement
            }
        }
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
            final_result: convert_X_to_number(formData.get("final_result")),
            first_try: convert_X_to_number(formData.get("first_try")),
            second_try: convert_X_to_number(formData.get("second_try")),
            third_try: convert_X_to_number(formData.get("third_try"))
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
                        throwError(new Error(`Network response was not ok: ${res.status} - ${res.statusText}`));
                    }
                })
            }
        }).catch(e => {
            throwError(new Error(`Not updated: ${e}`))
        }
        )

    }


    const handle_onChange = function (e: React.ChangeEvent<HTMLInputElement>) {
        let new_state = { ...achievementState }
        let try_name = e.target.name
        let new_value = e.target.value.replace(/[^\d.,]/g,'');

        if(new_value.includes(",") && new_value.split(",")[1].length > 2){
            alert(`Invalid format: Number (${new_value}): Only 2 decimal numbers allowed -> not uploaded`)
            return
        } else if(new_value.includes(".") && new_value.split(".")[1].length > 2){
            alert(`Invalid format: Number (${new_value}): Only 2 decimal numbers allowed -> not uploaded`)
            return
        }


        new_state[try_name] = new_value || "";

        let first_try = 0;
        if (typeof new_state.first_try == "number"){
            first_try = new_state.first_try || 0
        } else {
            first_try = parseFloat(new_state.first_try.replace(",", ".")) || 0
        }
        let second_try = 0;
        if (typeof new_state.second_try == "number"){
            second_try = new_state.second_try || 0
        } else {
            second_try = parseFloat(new_state.second_try.replace(",", ".")) || 0
        }
        let third_try = 0;
        if (typeof new_state.third_try == "number"){
            third_try = new_state.third_try || 0
        } else {
            third_try = parseFloat(new_state.third_try.replace(",", ".")) || 0
        }
        let max_value = Math.max(first_try, second_try, third_try)

        new_state["final_result"] = max_value

        setAchievementState(new_state)
    }


    return (
        <div>
            <form id="time_form" onSubmit={form_submit}>
                <div className="mb-2">
                    <label>Endergebnis [{unit}]: </label>
                    <input  name="final_result" readOnly
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-slate-400 w-16 text-center"
                        value={achievementState.final_result}></input>
                </div>
                <div className="mb-2">
                    <label>1. Versuch [{unit}]: </label>
                    <input
                        onChange={handle_onChange}
                        name="first_try"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-md rounded-md bg-slate-200 w-16 text-center"
                        value={achievementState.first_try}
                    ></input>
                </div>

                <div className="mb-2">
                    <label>2. Versuch [{unit}]: </label>
                    <input
                        onChange={handle_onChange}
                        name="second_try"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none  shadow-md rounded-md bg-slate-200 w-16 text-center"
                        value={achievementState.second_try}
                    ></input>
                </div>

                <div className="mb-2">
                    <label>3. Versuch [{unit}]: </label>
                    <input
                        onChange={handle_onChange}
                        name="third_try"
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


function convert_X_to_number(value: FormDataEntryValue | null){
    if (value == "X") {
        return "-1.0"
    } else if (value == ""){
        return ""
    }
    else {
        if (value?.toString().includes(".")){
            let value_parts = value?.toString().split(".")
            return value_parts[0] + "." + value_parts[1].padEnd(2, "0")
        }else if (value?.toString().includes(",")) {
            let value_parts = value?.toString().split(",")
            return value_parts[0] + "," + value_parts[1].padEnd(2, "0")
        }else{
            return value + ".00"
        }
        
    } 
}