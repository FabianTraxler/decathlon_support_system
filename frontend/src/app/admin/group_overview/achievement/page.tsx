import { AchievementValue } from "../athltetes";
import { useEffect, useState } from "react";

import { TimeResult } from "./time";
import { HeightResult } from "./height";
import { DistanceResult } from "./distance";
import { convert_to_integral_fractional } from "@/app/lib/parsing";

export default function Achievement({ index, name, achievement, achievement_type, athleteName, editMode }:
    { index: number, name: string, achievement: AchievementValue, achievement_type: string, athleteName: string, editMode: boolean }) {

    const [isPopupOpen, setPopupOpen] = useState(false);
    const [current_achievement, setAchievement] = useState(achievement)

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
        if (achievement_type == "Time") {
            let achievement_value = current_achievement.Time;
            if (achievement_value) {
                achievement_string = achievement_value.final_result?.integral + "," + achievement_value.final_result?.fractional
                achievement_unit = achievement_value.unit
            }

        } else if (achievement_type == "Distance") {
            let achievement_value = current_achievement.Distance
            if (achievement_value) {
                achievement_string = achievement_value.final_result?.integral + "," + achievement_value.final_result?.fractional
                achievement_unit = achievement_value.unit
            }
        } else if (achievement_type == "Height") {
            let achievement_value = current_achievement.Height;
            if (achievement_value) {
                achievement_string = achievement_value.final_result ? achievement_value.final_result.toString() : ""
                achievement_unit = achievement_value.unit
            }
        }
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
                    {achievement_string} {achievement_unit}
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
    let achievement_string = "";
    let achievement_unit = "";
    if (achievement_type == "Time") {
        let achievement_value = achievement.Time;
        if (achievement_value?.final_result) {
            achievement_string = achievement_value.final_result?.integral + "," + achievement_value.final_result?.fractional || ""
        }
        achievement_unit = achievement_value?.unit || ""

    } else if (achievement_type == "Distance") {
        let achievement_value = achievement.Distance
        if (achievement_value?.final_result) {
            achievement_string = achievement_value.final_result?.integral + "," + achievement_value.final_result?.fractional || ""
        }
        achievement_unit = achievement_value?.unit || ""
    } else if (achievement_type == "Height") {
        let achievement_value = achievement.Height;
        if (achievement_value?.final_result) {
            achievement_string = achievement_value.final_result ? achievement_value.final_result.toString() : ""
        }
        achievement_unit = achievement_value?.unit || ""
    }
    const [currentState, set_currentState] = useState({ achievement_string: achievement_string, isUploaded: achievement_string != "" })

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
            }, 1000)
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
                className='p-1 w-12 h-full text-right rounded-md shadow-xl group'
                defaultValue={achievement_string}>
            </input>{achievement_unit}
        </td>
    )
}

function EditPopup({ achievement, achievementType, athleteName, onClose }:
    { achievement: AchievementValue, achievementType: string, athleteName: string, onClose: (achievement?: AchievementValue) => void }) {

    const saveChanges = function (achievement: AchievementValue) {
        onClose(achievement)
    }

    let achievement_name = "";
    if (achievement) {
        if (achievementType == "Time") {
            achievement_name = achievement.Time?.name || ""

        } else if (achievementType == "Distance") {
            achievement_name = achievement.Distance?.name || ""

        } else if (achievementType == "Height") {
            achievement_name = achievement.Height?.name || ""
        }
        else {
            return (<div></div>)
        }
    }

    return (
        <div
            className="fixed left-0 top-0 z-[1055] h-full w-full overflow-y-auto overflow-x-hidden outline-none bg-slate-500 bg-opacity-45">
            <div
                className="pointer-events-none relative w-auto transition-all duration-300 ease-in-out min-[576px]:mx-auto min-[576px]:mt-7 min-[576px]:max-w-[300px]">
                <div
                    className="min-[576px]:shadow-[0_0.5rem_1rem_rgba(#000, 0.15)] pointer-events-auto relative flex w-full flex-col rounded-md border-none bg-white bg-clip-padding text-current shadow-lg outline-none dark:bg-neutral-600">
                    <div
                        className="flex flex-shrink-0 items-center justify-between rounded-t-md border-b-2 border-neutral-100 border-opacity-100 p-4 dark:border-opacity-50">
                        <h5
                            className="text-xl font-medium leading-normal">
                            {achievement_name}
                        </h5>
                        <button
                            type="button"
                            className="box-content rounded-none border-none hover:no-underline hover:opacity-75 focus:opacity-100 focus:shadow-none focus:outline-none"
                            onClick={(_) => onClose()}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="h-6 w-6">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="relative flex-auto p-4" data-te-modal-body-ref>
                        {(achievementType == "Time") &&
                            <TimeResult achievement={achievement.Time} athleteName={athleteName} onSubmit={saveChanges}></TimeResult>
                        }
                        {(achievementType == "Distance") &&
                            <DistanceResult achievement={achievement.Distance} athleteName={athleteName} onSubmit={saveChanges}></DistanceResult>
                        }
                        {(achievementType == "Height") &&
                            <HeightResult achievement={achievement.Height} athleteName={athleteName} onSubmit={saveChanges}></HeightResult>
                        }
                    </div>

                </div>
            </div>
        </div>
    )
}


