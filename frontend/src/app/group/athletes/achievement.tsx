import EditPopup, { convert_achievement_to_string } from "@/app/lib/achievement_edit/popup";
import { AchievementValue } from "@/app/lib/athlete_fetching";
import { useContext, useState } from "react";
import { AchievementContext } from "./athletes";
import { long_distance_disciplines } from "@/app/lib/config";


export default function AchievementDisplay({ athlete_number, name, type, achievement, athlete_name }: { athlete_number: number, name: string, type: string, achievement?: AchievementValue, athlete_name: string }) {
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
    const [current_achievement, setAchievement] = useState<{ showEdit: boolean, value?: AchievementValue }>({ 
        showEdit: false, 
        value: achievement })
    let { updateAchievement } = useContext(AchievementContext);


    if (current_achievement.value) {
        [achievement_string, achievement_unit] = convert_achievement_to_string(current_achievement.value, type);
    }

    var saveChanges = function (new_achievement?: AchievementValue) {
        if (new_achievement) {
            updateAchievement(athlete_number, name, new_achievement)
            setAchievement({ showEdit: false, value: new_achievement })
        } else {
            setAchievement({ ...current_achievement, showEdit: false })
        }
    }

    return (
        <div key={athlete_name} className="h-fit odd:bg-slate-200 even:bg-slate-300 border border-slate-100 border-collapse">
            <div className="grid grid-cols-12 grid-col text-lg pt-1 p-1 "
                onClick={() => setAchievement({ showEdit: true, value: current_achievement.value })}>
                <div className="col-span-6">{name}</div>
                <div className="grid col-span-5 grid-cols-2">
                    <div className="text-right">{achievement_string}</div>
                    <div className="text-left pl-1">{achievement_unit}</div>
                </div>
                <div className="text-center">&#x270E;</div>
            </div>


            {
                current_achievement.showEdit &&
                <EditPopup key={name} achievement={current_achievement.value || default_achievement} achievementType={type}
                    athleteName={athlete_name} onClose={saveChanges}></EditPopup>
            }
        </div>
    )
}