import { AchievementValue } from "../athlete_fetching";
import { long_distance_disciplines } from "../config";
import { DistanceResult } from "./distance";
import { HeightResult } from "./height";
import { TimeResult } from "./time";

export function convert_achievement_to_string(achievement: AchievementValue, achievement_type: string): [string, string] {
    let achievement_string = "";
    let achievement_unit = "";
    if (achievement_type == "Time") {
        let achievement_value = achievement.Time;
        if (achievement_value) {
            let full_seconds = achievement_value.final_result?.integral || -1;
            if (full_seconds == -1) {
                achievement_string = "/"
            } else if (long_distance_disciplines.includes(achievement_value.name)) {
                let full_seconds = achievement_value.final_result?.integral || -1;

                let minutes = Math.floor(full_seconds / 60)
                let seconds = (full_seconds % 60).toString()
                if (seconds && seconds?.length < 2) {
                    seconds = "0" + seconds.toString()
                }
                let fractional_seconds = achievement_value.final_result?.fractional.toString();
                if (fractional_seconds && fractional_seconds?.length < 2) {
                    fractional_seconds = "0" + fractional_seconds.toString()
                }
                achievement_string = minutes + ":" + seconds + "," + fractional_seconds
                achievement_unit = "min"
            } else {
                let fractional_seconds = achievement_value.final_result?.fractional.toString();
                if (fractional_seconds && fractional_seconds?.length < 2) {
                    fractional_seconds = "0" + fractional_seconds.toString()
                }
                achievement_string = achievement_value.final_result?.integral + "," + fractional_seconds
                achievement_unit = "s"
            }
        }

    } else if (achievement_type == "Distance") {
        let achievement_value = achievement.Distance
        if (achievement_value) {
            achievement_string = achievement_value.final_result?.integral + "," + achievement_value.final_result?.fractional.toString().padStart(2,"0")
            achievement_unit = achievement_value.unit || "m"
        }
    } else if (achievement_type == "Height") {
        let achievement_value = achievement.Height;
        if (achievement_value) {
            achievement_string = achievement_value.final_result ? achievement_value.final_result.toString() : ""
            achievement_unit = achievement_value.unit || "cm"
        }
    }
    if (!achievement || achievement_string == "undefined,undefined" || achievement_string == "-1" || achievement_string == "-1,0" || achievement_string == "-1,00") {
        achievement_string = ""
        achievement_unit = ""
    }

    return [achievement_string, achievement_unit]
}


export default function EditPopup({ achievement, achievementType, athleteName, onClose }:
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
        <PopUp onClose={onClose} title={achievement_name}>
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
        </PopUp>
    )
}


export function PopUp({ children, onClose, title }: { children?: React.ReactNode, onClose: () => void, title: string }) {

    return (
        <div
            className="text-black fixed left-0 top-0 z-[1055] h-full w-full overflow-y-auto overflow-x-hidden outline-none bg-slate-500 bg-opacity-45">
            <div className="flex w-full h-full items-center justify-center">

                <div
                    className="pointer-events-none relative w-auto transition-all duration-300 ease-in-out min-[576px]:mx-auto min-[576px]:mt-7 min-[576px]:max-w-[500px]">
                    <div
                        className="min-[576px]:shadow-[0_0.5rem_1rem_rgba(#000, 0.15)] pointer-events-auto relative flex w-full flex-col rounded-md border-none bg-white bg-clip-padding text-current shadow-lg outline-none dark:bg-neutral-600">
                        <div
                            className="flex flex-shrink-0 items-center justify-between rounded-t-md border-b-2 border-neutral-100 border-opacity-100 p-4 dark:border-opacity-50">
                            <h5
                                className="text-xl font-medium leading-normal">
                                {title}
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
                                    className="h-8 sm:h-6 w-8 sm:w-6">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {children}

                    </div>
                </div>
            </div>
        </div>
    )
}