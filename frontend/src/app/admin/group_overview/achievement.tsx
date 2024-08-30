import { AchievementValue } from "@/app/lib/athlete_fetching";
import { useEffect, useState } from "react";

import EditPopup, { convert_achievement_to_string } from "@/app/lib/achievement_edit/popup";
import { InlineEdit } from "@/app/lib/achievement_edit/inline";
import { long_distance_disciplines } from "@/app/lib/config";

export default function Achievement({ index, name, achievement, achievement_type, athleteName, editMode }:
    { index: number, name: string, achievement?: AchievementValue, achievement_type: string, athleteName: string, editMode: boolean }) {

    const [isPopupOpen, setPopupOpen] = useState(false);
    const [current_achievement, setAchievement] = useState(achievement)

    useEffect(() => {
        setAchievement(achievement)
    }, [achievement])
    console.log(long_distance_disciplines)

    let achievement_string = "";
    let achievement_unit = "";
    let default_achievement: AchievementValue = {
        Distance: {
            name: name,
            unit: "m"
        },
        Time: {
            name: name,
            unit: (long_distance_disciplines.includes(name)) ? "min" : "s"
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
            <InlineEdit index={index.toString()} name={name}
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
