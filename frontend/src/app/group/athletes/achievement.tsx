import EditPopup, { convert_achievement_to_string } from "@/app/lib/achievement_edit/popup";
import { AchievementValue } from "@/app/lib/athlete_fetching";
import { useState } from "react";


export default function AchievementDisplay({ name, achievement, athlete_name }: { name: string, achievement: AchievementValue, athlete_name: string }) {
    const [showEditOverlay, setShowEditoverlay] = useState(false)
    const [current_achievement, setAchievement] = useState(achievement)

    let achievement_type = ""

    if (achievement.Distance) {
        achievement_type = "Distance"
    } else if (achievement.Height) {
        achievement_type = "Height"
    } else if (achievement.Time) {
        achievement_type = "Time"
    }

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
        [achievement_string, achievement_unit] = convert_achievement_to_string(achievement, achievement_type);
    }

    const saveChanges = function (new_achievement?: AchievementValue) {
        if (new_achievement) {
            setAchievement(new_achievement)
        }
        setShowEditoverlay(false);
    }

    return (
        <div key={athlete_name} className="grid grid-cols-8 grid-col border text-lg pt-1 p-1 odd:bg-slate-200 even:bg-slate-300"
            onClick={() => setShowEditoverlay(true)}>
            <div className="col-span-4">{name}</div>
            <div className="grid col-span-3 grid-cols-2">
                <div className="text-right">{achievement_string}</div>
                <div className="text-left pl-1">{achievement_unit}</div>
            </div>
            <div className="text-center">&#x270E;</div>

            {
                showEditOverlay &&
                <EditPopup key={name} achievement={current_achievement || default_achievement} achievementType={achievement_type}
                    athleteName={athlete_name} onClose={saveChanges}></EditPopup>
            }
        </div>
    )
}