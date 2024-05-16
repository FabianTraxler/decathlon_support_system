import { AchievementValue } from "@/app/lib/athlete_fetching";
import { useEffect, useState } from "react";

import { convert_to_integral_fractional } from "@/app/lib/parsing";
import EditPopup, { convert_achievement_to_string } from "@/app/lib/achievement_edit/popup";

export default function Achievement({ index, name, achievement, achievement_type, athleteName, editMode }:
    { index: number, name: string, achievement?: AchievementValue, achievement_type: string, athleteName: string, editMode: boolean }) {

    const [isPopupOpen, setPopupOpen] = useState(false);
    const [current_achievement, setAchievement] = useState(achievement)

    useEffect(() => {
        setAchievement(achievement)
    }, [achievement])

    let achievement_string = "";
    let achievement_unit = "";
    let default_achievement: AchievementValue = {
        Distance: {
            name: name,
            unit: "m"
        },
        Time: {
            name: name,
            unit: (name == "1500 Meter Lauf") ? "min" : "s"
        },
        Height: {
            name: name,

            unit: "cm"
        },
    }

    if (current_achievement) {
        [achievement_string, achievement_unit] = convert_achievement_to_string(current_achievement, achievement_type);
    }

    const handleOpenPopup = () => {
        setPopupOpen(true);
    };

    const handleClosePopup = (achievement?: AchievementValue) => {
        if (achievement) {
            setAchievement(achievement)
        }
        setPopupOpen(false);
    };

    if (editMode) {
        return (
            <InlineEdit index={index} name={name}
                achievement={current_achievement || default_achievement} achievement_type={achievement_type}
                athleteName={athleteName} onSubmit={setAchievement}></InlineEdit>
        )
    } else {
        return (
            <td className='group flex-col border border-slate-800 text-right hover:bg-slate-400 hover:cursor-pointer'>
                <div onClick={handleOpenPopup} className='p-1 w-full h-full text-right'>
                    {achievement_string != "" &&
                        <div>{ achievement_string } {achievement_unit}</div>
                    }
                    {(achievement_string == "") &&
                        <button onClick={handleOpenPopup} className='pl-3 hidden group-hover:block text-center'>&#9998;</button>
                    }
                </div>
                {isPopupOpen &&
                    <EditPopup achievement={current_achievement || default_achievement} achievementType={achievement_type}
                        athleteName={athleteName} onClose={handleClosePopup}></EditPopup>
                }
            </td>
        )
    }
}

function InlineEdit({ index, name, achievement, achievement_type, athleteName, onSubmit }:
    { index: number, name: string, achievement: AchievementValue, achievement_type: string, athleteName: string, onSubmit: (form_submit: AchievementValue) => void }) {
    let [achievement_string, achievement_unit] = convert_achievement_to_string(achievement, achievement_type);

    if (achievement_string == "-") {
        achievement_string = ""
    }

    const [currentState, set_currentState] = useState({ achievement_string: achievement_string, isUploaded: (achievement_string != "" && achievement_string != "-") })

    useEffect(() => {
        if (currentState.achievement_string != achievement_string && !currentState.isUploaded) {
            let timer = setTimeout(() => {
                let final_result = convert_to_integral_fractional(currentState.achievement_string)

                let new_achievement: AchievementValue;
                let changed_value;
                if (achievement_type == "Time") {
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
                                throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
                            }
                        })
                    }
                }).catch(e => {
                    alert(`Not updated: ${e}`)
                }
                )

                set_currentState(prevState => ({
                    ...prevState,
                    isUploaded: true
                }))
            }, 500)
            return () => {
                clearTimeout(timer);
            };
        }
    })

    let handleOnChange = function (e: any) {
        let id: string = e.target.id;
        let value = e.target.value;
        set_currentState({
            achievement_string: value,
            isUploaded: false
        })
    }

    return (
        <td className={'group flex-col border border-slate-800 text-right group-active:bg-slate-400 ' + (currentState.isUploaded ? "bg-green-200" : "bg-yellow-200")}>
            <input onChange={handleOnChange}
                id={index.toString()}
                className='p-1 w-12 2xl:w-14 h-full text-right rounded-md shadow-xl group'
                defaultValue={achievement_string}>
            </input>{achievement_unit}
        </td>
    )
}

