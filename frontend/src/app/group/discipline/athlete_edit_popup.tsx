import { PopUp } from "@/app/lib/achievement_edit/popup";
import { AthleteID } from "@/app/lib/interfaces";

export default function AthleteEditPopup({ athlete, onclose, skipTry, skipDiscipline }: 
    { athlete: AthleteID, onclose: () => void, skipTry: () => void, skipDiscipline: () => void }) {
    const handleClick = function (action: string) {
        if(confirm(`Sicher '${action}' für ${athlete.full_name() }?`)){
            if(action == "Versuch überspringen"){
                // Set latest try to / and force next athlete
                skipTry()
            }else if (action == "Disziplin überspringen"){
                // Set all tries to / and force next athlete
                skipDiscipline()
            }
        }
    }

    return (
        <PopUp onClose={onclose} title={athlete.name + " " + athlete.surname}>
            <div className="flex flex-col  items-center justify-center p-4 w-full text-black">
                <div
                    className="w-fit p-2 m-4 rounded-md shadow-md shadow-slate-800 bg-stw_green"
                    onClick={() => handleClick("Versuch überspringen")}
                >Versuch überspringen</div>

                <div
                    className="w-fit p-2 m-4 rounded-md shadow-md shadow-slate-800 bg-stw_orange "
                    onClick={() => handleClick("Disziplin überspringen")}
                >Disziplin überspringen</div>
            </div>
        </PopUp>
    )
}