import { useEffect, useState } from "react";
import { AchievementValue } from "../athlete_fetching";
import { convert_achievement_to_string } from "./popup";
import { convert_to_integral_fractional } from "../parsing";
import { long_distance_disciplines, unit_mapping } from "../config";
import { useAsyncError } from "../asyncError";

export function InlineEdit({ index, name, achievement, achievement_type, athleteName, onSubmit }:
    { index: string, name: string, achievement: AchievementValue, achievement_type: string, athleteName: string, onSubmit: (form_submit: AchievementValue) => void }) {
    const throwError = useAsyncError();

    let [achievement_string, achievement_unit] = convert_achievement_to_string(achievement, achievement_type);

    if (achievement_string == "-" || achievement_string == "/") {
        achievement_string = ""
    }

    const [currentState, set_currentState] = useState({ achievement_string: achievement_string, isUploaded: (achievement_string != "" && achievement_string != "-") })

    useEffect(() => {
        if (currentState.achievement_string != achievement_string && !currentState.isUploaded) {
            let timer = setTimeout(() => {
                if (!/^[0-9,.:]*$/.test(currentState.achievement_string)) {
                    alert(`Invalid format: Number (${currentState.achievement_string}) contains non-digits -> not uploaded`)
                    return
                }
                let new_achievement: AchievementValue = {
                    Time: {
                        name: name,
                        unit: achievement_unit,
                        final_result: {
                            fractional: 0,
                            integral: -1
                        }
                    }
                }

                if (currentState.achievement_string == "") {
                    fetch(`/api/achievement?athlete_name=${athleteName}&name=${name}`, {
                        method: "Delete"
                    }).then(res => {
                        if (res.ok) {
                            onSubmit(new_achievement)
                        } else {
                            throwError(new Error("Achievement not deleted"))
                        }
                    }).catch(e => {
                        throwError(new Error(`Not deleted: ${e}`))
                    })
                } else {
                    let final_result = convert_to_integral_fractional(currentState.achievement_string)

                    if (!final_result) {
                        alert(`Invalid format: Number (${currentState.achievement_string}): Not able to convert to number -> not uploaded`)
                        return
                    } else if (final_result?.fractional >= 100) {
                        alert(`Invalid format: Number (${currentState.achievement_string}): Only 2 decimal numbers allowed -> not uploaded`)
                        return
                    }

                    let changed_value;
                    if (achievement_type == "Time") {
                        if (long_distance_disciplines.includes(name) && currentState.achievement_string.includes(":")) {
                            let final_result_string = currentState.achievement_string.replace(".", ",")
                            let min = parseInt(final_result_string.split(":")[0])
                            let sec = parseInt(final_result_string.split(":")[1].split(",")[0])
                            let full_sec = min * 60 + sec;
                            final_result_string = full_sec.toString() + "," + final_result_string.split(",")[1]
                            final_result = convert_to_integral_fractional(final_result_string)
                        }

                        new_achievement = {
                            Time: {
                                name: name,
                                unit: achievement_unit,
                                final_result: final_result
                            }
                        }
                        changed_value = {
                            final_result: final_result
                        }
                    } else if (achievement_type == "Distance") {
                        new_achievement = {
                            Distance: {
                                name: name,
                                unit: achievement_unit,
                                final_result: final_result,
                                first_try: { integral: -1, fractional: 0 },
                                second_try: { integral: -1, fractional: 0 },
                                third_try: { integral: -1, fractional: 0 },
                            }
                        }
                        changed_value = {
                            final_result: final_result
                        }
                    } else if (achievement_type == "Height") {
                        new_achievement = {
                            Height: {
                                name: name,
                                unit: achievement_unit,
                                final_result: parseFloat(currentState.achievement_string),
                                start_height: -1,
                                height_increase: -1,
                                tries: "",
                            }
                        }
                        changed_value = {
                            final_result: parseFloat(currentState.achievement_string)
                        }
                    } else {
                        return;
                    }

                    fetch(`/api/achievement?athlete_name=${athleteName}&name=${name}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(changed_value)
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
                                    throwError(new Error(`Network response was not ok: ${res.status} - ${res.statusText}`))
                                }
                            })
                        }
                    }).catch(e => {
                        throwError(new Error(`Not updated: ${e}`))
                    })
                }

                set_currentState(prevState => ({
                    ...prevState,
                    isUploaded: true
                }))
            }, 1000)
            return () => {
                clearTimeout(timer);
            };
        }
    })

    let handleOnChange = function (e: any) {
        let value = e.target.value;
        set_currentState({
            achievement_string: value,
            isUploaded: false
        })
    }

    let display_unit = unit_mapping.get(achievement_unit) || achievement_unit

    return (
        <td className={'group items-center jusitfy-center border border-slate-800 text-right group-active:bg-slate-400 ' + (currentState.isUploaded ? "bg-green-200" : "bg-yellow-200")}>
            <div className="flex justify-center items-center">
                <input onChange={handleOnChange}
                    id={index.toString()}
                    className='p-1 min-w-12 max-w-24  h-full text-right rounded-md shadow-xl group'
                    defaultValue={achievement_string}>
                </input>
                {display_unit}
            </div>
        </td>
    )
}

