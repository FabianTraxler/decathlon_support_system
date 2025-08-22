import { AthleteID, AthleteTimeResult, Discipline, IAthleteID, StartingOrder } from "@/app/lib/interfaces";
import { useEffect, useState } from "react";
import { AthleteResultsPopUp, BeforeStartInfoBox, start_discipline } from "./discipline";
import { get_group_achievements, saveStartingOrder } from "@/app/lib/achievement_edit/api_calls";
import { AchievementValue, Athlete, TimeAchievement } from "@/app/lib/athlete_fetching";
import { LoadingAnimation, LoadingButton } from "@/app/lib/loading";
import { finish_discipline } from "@/app/lib/discipline_edit";
import { useAsyncError } from "@/app/lib/asyncError";

export default function TimeDiscipline({ group_name, discipline }: { group_name: string, discipline: Discipline }) {
    const [current_discipline, setDiscipline] = useState<Discipline>({ ...discipline, starting_order: { Track: [] } })
    const [resultsPopUp, setResultsPopUp] = useState<{show: boolean, athletes: IAthleteID[]}>({show: false, athletes: []});

    const throwError = useAsyncError();

    useEffect(() => {
        const get_athlete_starting_numbers = function (athletes: Athlete[]) {
            let athlete_starting_numbers: Map<string, number> = new Map()

            athletes.forEach(athlete => {
                athlete_starting_numbers.set(athlete.name + "_" + athlete.surname, athlete.starting_number)
            })

            if (typeof discipline.starting_order != "string" && discipline.starting_order.Track) {
                let new_starting_order: { name: string, athletes: (AthleteTimeResult | null)[] }[] = []
                new_starting_order = discipline.starting_order.Track.map(run => {
                    let athletes = run.athletes.map(athlete => {
                        if (athlete == null) {
                            return null
                        } else {
                            return {
                                ...athlete,
                                starting_number: athlete_starting_numbers.get(athlete.name + "_" + athlete.surname),
                                full_name: () => athlete.name + "_" + athlete.surname
                            }
                        }
                    })
                    return {
                        name: run.name,
                        athletes: athletes
                    }
                })


                setDiscipline({
                    ...current_discipline,
                    starting_order: {
                        Track: new_starting_order
                    }
                })
            } else {
                // No order --> only one mass start
                let new_starting_order: AthleteTimeResult[] = athletes.map(athlete => {
                    return {
                        ...athlete,
                        age_group: "",
                        starting_number: athlete_starting_numbers.get(athlete.name + "_" + athlete.surname),
                        full_name: () => athlete.name + "_" + athlete.surname
                    }
                })


                setDiscipline({
                    ...current_discipline,
                    starting_order: {
                        Default: new_starting_order
                    }
                })
            }


        }
        get_group_achievements(group_name, get_athlete_starting_numbers)
        .catch((e) => {
            throwError(e);
        })
    }, [group_name])

    const saveNewStartingOrder = function (new_order: StartingOrder) {
        let is_hurdles = discipline.name.includes("Hürden");
        saveStartingOrder(new_order, group_name, () => { }, is_hurdles)
        .catch((e) => {
            throwError(e);
        })
    }

    const showResults = function (stop_load: () => void) {
    // fetch results
    get_group_achievements(group_name, (fetched_athletes: Athlete[]) => {
        
        let athletes: IAthleteID[] = []; 
        fetched_athletes.forEach((athlete: Athlete) => {
            Object.values(athlete.achievements).forEach((achievement: AchievementValue) => {
                let discipline_name = achievement.Time?.name || ""; 
                if (discipline_name == current_discipline.name) {
                    athletes.push({
                        name: athlete.name,
                        surname: athlete.surname,
                        starting_number: athlete.starting_number,
                        age_group: "",
                        achievement: {
                            Time: achievement.Time,
                            athlete_name: athlete.name + " " + athlete.surname,
                        },
                    } as IAthleteID);
                }
            })
        })
        stop_load();
        setResultsPopUp({show: true, athletes: athletes});
    })
    }

    return (
        <div className="h-full">
            {
                current_discipline.state == "BeforeStart" &&
                <BeforeStartInfoBox
                    ready={true}
                    discipline={current_discipline}
                    start_discipline={() => {
                        try{
                            start_discipline(group_name, current_discipline, setDiscipline)
                            .catch((e) => {
                                throwError(e);
                            })
                        }catch(e){
                            throwError(new Error("Error starting discipline"));
                        }
                    }
                    }
                    athletes={[]}>
                </BeforeStartInfoBox>
            }
            {
                current_discipline.state == "Active" &&
                <div className="h-full">
                    {
                        (typeof current_discipline.starting_order != "string" && current_discipline.starting_order.Track && current_discipline.starting_order.Track?.length > 0) ?
                            <StartingOrderSummary
                                starting_order={current_discipline.starting_order.Track}
                                saveStartingOrder={saveNewStartingOrder}
                                finishDiscipline={() => finish_discipline(group_name, current_discipline, setDiscipline)}
                            ></StartingOrderSummary>
                            :
                            ((typeof current_discipline.starting_order != "string" && current_discipline.starting_order.Default) ?
                                <MassStartStartingOrderSummary
                                    athletes={current_discipline.starting_order.Default}
                                    finishDiscipline={() => finish_discipline(group_name, current_discipline, setDiscipline)}
                                ></MassStartStartingOrderSummary>
                                :
                                <div className="flex justify-center items-center h-full w-full">
                                    <LoadingAnimation></LoadingAnimation>
                                </div>
                            )
                    }
                </div>
            }
            {
                current_discipline.state == "Finished" &&
                <div className="flex flex-col h-full text-2xl font-bold items-center justify-center">
                    <div>Abgeschlossen</div>
                        <div className="text-2xl mt-8 sm:mt-14 justify-center flex ">
                        <LoadingButton size={"10"} onclick={(stop_load) => showResults(stop_load)}>
                        <div
                            className={"border rounded-md  w-fit p-4 sm:p-4 hover:cursor-pointer text-center bg-stw_green shadow-lg shadow-black active:shadow-none" }
                        >
                            Ergebnisse anzeigen
                        </div>

                        </LoadingButton>
                    </div>
                </div>
            }
            {
                resultsPopUp.show &&
                <AthleteResultsPopUp 
                    athletes={resultsPopUp.athletes} 
                    type="Time" 
                    setShowResultsPopUp={(setShow: boolean) => setResultsPopUp({...resultsPopUp, show: setShow})}
                    unit="s"
                ></AthleteResultsPopUp>
            }
        </div>
    )
}


function StartingOrderSummary({ starting_order, saveStartingOrder, finishDiscipline }:
    { starting_order: { name: string, athletes: (AthleteTimeResult | null)[] }[], saveStartingOrder: (order: StartingOrder) => void, finishDiscipline: () => void }) {

    const [editActive, setEditActive] = useState(false)
    const [openRuns, setOpenRuns] = useState<Set<string>>(new Set([]));
    const [currentRuns, setcurrentRuns] = useState(starting_order)
    const [lastDraggedOver, setLastDraggedOver] = useState({ run_index: NaN, row_index: NaN })
    const [submitted, setSubmitted] = useState("")

    const handleOpenRun = function (run_name: string, remove: boolean) {
        if (openRuns.has(run_name) && remove) {
            openRuns.delete(run_name)
            setOpenRuns(new Set(openRuns))
        } else {
            openRuns.add(run_name)
            setOpenRuns(new Set(openRuns))
        }
    }

    const handleDragOver = function (e: React.DragEvent, runIndex: number, rowIndex: number) {
        e.preventDefault();
        setLastDraggedOver({ run_index: runIndex, row_index: rowIndex });
    }

    const handleDragDrop = function (e: React.DragEvent, runIndex: number, rowIndex: number, dragStopRowEmpty: boolean) {
        e.preventDefault();
        setLastDraggedOver({ run_index: NaN, row_index: NaN });
        const dragRowIndex = e.dataTransfer.getData('rowIndex');
        const dragRunIndex = e.dataTransfer.getData('runIndex');
        const startCellEmpty = e.dataTransfer.getData('cell_empty');

        if (dragRowIndex !== rowIndex.toString() || dragRunIndex !== runIndex.toString()) {
            let newRun = currentRuns[runIndex]
            const [draggedColumn] = currentRuns[parseInt(dragRunIndex)].athletes.splice(parseInt(dragRowIndex), 1);

            let newRuns = [...currentRuns]

            if (dragStopRowEmpty && runIndex != parseInt(dragRunIndex) && startCellEmpty == "false") {
                // Move empty row to dragged row and run index 
                const [empty_col] = newRun.athletes.splice(rowIndex, 1, draggedColumn);

                let oldRun = currentRuns[parseInt(dragRunIndex)]
                oldRun.athletes.splice(parseInt(dragRowIndex), 0, empty_col);
                newRuns[parseInt(dragRunIndex)] = oldRun

            } else {
                newRun.athletes.splice(rowIndex, 0, draggedColumn);
            }

            newRuns[runIndex] = newRun
            setcurrentRuns(newRuns);
            setSubmitted("")
        }
    }

    const handleDragStart = function (e: React.DragEvent, runIndex: number, rowIndex: number, cell_empty: boolean) {
        e.dataTransfer.setData('rowIndex', rowIndex.toString());
        e.dataTransfer.setData('runIndex', runIndex.toString());
        e.dataTransfer.setData('cell_empty', cell_empty.toString());
    }
    const addRun = function () {
        let newRuns = [...currentRuns]
        newRuns.push({ name: "Lauf " + (newRuns.length + 1).toString(), athletes: [null, null, null, null, null, null] })
        setcurrentRuns(newRuns);
    }

    const handleSave = function () {
        setSubmitted("check")

        let runs_correct = true;

        let used_runs: { name: string, athletes: (AthleteID | null)[] }[] = []

        currentRuns.forEach(run => {
            if (run.athletes.length > 6) {
                runs_correct = false;
                setSubmitted("wrong")
                alert("Maximal 6 Athlet:innen pro Lauf erlaubt")
            } else if (run.athletes.length > 0) {
                used_runs.push(run)
            }
        })

        if (runs_correct) {
            let starting_order = {
                Track: used_runs
            } as StartingOrder
            saveStartingOrder(starting_order)
            setSubmitted("ok")
            setTimeout(() => {
                setEditActive(false)
            }, 500)
        }

    }

    const deleteRun = function(run_name: string, run_id: number){
        if (confirm(`${run_name} wirklich löschen?`)){
            let newRuns = [...currentRuns]
            newRuns.splice(run_id, 1);
            setcurrentRuns(newRuns);
        }
    }


    return (
        <div className="p-1 h-full overflow-scroll ">
            <div className={"text-center border rounded-md mb-4 p-3  shadow-slate-900 select-none " + (editActive ? "bg-stw_orange " : "bg-stw_blue shadow-md")}
                onClick={() => setEditActive(!editActive)}
            >
                {editActive ?
                    <span>In Bearbeitung</span>
                    :
                    <span>Startreihenfolge bearbeiten</span>
                }
            </div>

            {currentRuns.map((run, run_id) => {
                if (run.athletes.length == 0) {
                    return (
                        <div key={run_id} className="border rounded-md mt-2 p-4 sm:p-6 ">
                            <div className="flex flex-row justify-between font-bold text-xl sm:text-4xl"
                                onClick={() => handleOpenRun(run.name, true)}
                                onDragOver={() => handleOpenRun(run.name, false)}>
                                <span>{run.name}</span>
                                <div>&gt;</div>
                            </div>
                            <table className="w-full table-auto border-collapse text-[1rem] sm:text-[1.2rem] 2xl:text-sm mt-2" >
                                <thead >
                                    <tr className={' ' +
                                        ((run_id == lastDraggedOver.run_index) && "  bg-slate-400")}
                                        onDrop={(e) => handleDragDrop(e, run_id, 0, false)}
                                        onDragStart={(e) => handleDragStart(e, run_id, 0, false)}
                                        onDragOver={(e) => handleDragOver(e, run_id, 0)} >
                                        <th className="border border-slate-600 p-1 pl-2 pr-2">Bahn</th>
                                        <th className="border border-slate-600 p-1 pl-2 pr-2">#</th>
                                        <th className="border border-slate-600 p-1 pl-2 pr-2">AK</th>
                                        <th className="border border-slate-600 p-1 pl-2 pr-2">Vorname</th>
                                        <th className="border border-slate-600 p-1 pl-2 pr-2">Nachname</th>
                                        <th className="border border-slate-600 p-1 pl-2 pr-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                </tbody>
                            </table>
                        </div>
                    )
                } else {
                    return (
                        <div key={run_id} className="border rounded-md mt-1 p-4 sm:p-6 ">
                            <div className="flex flex-row justify-between font-bold text-xl sm:text-4xl"
                                onClick={() => handleOpenRun(run.name, true)}
                                onDragOver={() => handleOpenRun(run.name, false)}>
                                <span>{run.name}</span>
                                {
                                    (editActive && run.athletes.every(e => e === null)) &&
                                    <div
                                        className="pl-1 pr-1 text-red-500 border border-red-500 shadow-lg rounded-md"
                                        onClick={() => deleteRun(run.name, run_id)}
                                    >Delete</div>
                                }
                                <div>&gt;</div>
                            </div>

                            {
                                openRuns.has(run.name) &&
                                <table className="w-full table-auto border-collapse text-[1rem] sm:text-[1.2rem] 2xl:text-sm mt-2" >
                                    <thead >
                                        <tr>
                                            <th className="border border-slate-600 p-1 pl-2 pr-2"></th>
                                            <th className="border border-slate-600 p-1 pl-2 pr-2">#</th>
                                            <th className="border border-slate-600 p-1 pl-2 pr-2">AK</th>
                                            <th className="border border-slate-600 p-1 pl-2 pr-2">Vorname</th>
                                            <th className="border border-slate-600 p-1 pl-2 pr-2">Nachname</th>
                                            {editActive && <th className="border border-slate-600 p-1 pl-2 pr-2"></th>}
                                        </tr>
                                    </thead>
                                    {!editActive &&
                                        <tbody>
                                            {run.athletes.map((athlete, athlete_id) => {
                                                if (athlete == null) {
                                                    return (
                                                        <tr
                                                            key={athlete_id + "undraggable"}>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete_id + 1}.</td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2 text-center"></td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2"></td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2"> </td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2"></td>
                                                        </tr>
                                                    )
                                                } else {
                                                    return (
                                                        <tr
                                                            key={athlete_id + "undraggable"}>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete_id + 1}.</td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete.starting_number}</td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.age_group}</td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.name} </td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.surname}</td>
                                                        </tr>
                                                    )
                                                }
                                            })}
                                        </tbody>
                                    }

                                    {editActive &&
                                        <tbody>
                                            {run.athletes.map((athlete, athlete_id) => {
                                                if (athlete == null) {
                                                    return (
                                                        <tr className={'cursor-move select-none bg-slate-300 active:bg-slate-600 active:text-slate-50 ' +
                                                            ((athlete_id == lastDraggedOver.row_index && run_id == lastDraggedOver.run_index) && " bg-white")
                                                        }
                                                            draggable="true"
                                                            onDrop={(e) => handleDragDrop(e, run_id, athlete_id, true)}
                                                            onDragStart={(e) => handleDragStart(e, run_id, athlete_id, true)}
                                                            onDragOver={(e) => handleDragOver(e, run_id, athlete_id)}
                                                            key={athlete_id + "draggable"}>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete_id + 1}.</td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2 text-center"></td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2"></td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2"></td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2"></td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">
                                                                &#9776;
                                                            </td>
                                                        </tr>
                                                    )
                                                } else {
                                                    return (
                                                        <tr className={'cursor-move select-none bg-slate-300 active:bg-slate-600 active:text-slate-50 ' +
                                                            ((athlete_id == lastDraggedOver.row_index && run_id == lastDraggedOver.run_index) && " bg-white")
                                                        }
                                                            draggable
                                                            onDrop={(e) => handleDragDrop(e, run_id, athlete_id, false)}
                                                            onDragStart={(e) => handleDragStart(e, run_id, athlete_id, false)}
                                                            onDragOver={(e) => handleDragOver(e, run_id, athlete_id)}
                                                            key={athlete_id + "draggable"}>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete_id + 1}.</td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete.starting_number}</td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.age_group}</td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.name.substring(0, 6)}{athlete.name.length > 6 && "..."}</td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.surname.substring(0, 7)}{athlete.surname.length > 7 && "..."}</td>
                                                            <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">
                                                                &#9776;
                                                            </td>
                                                        </tr>
                                                    )
                                                }
                                            })}
                                        </tbody>
                                    }
                                </table>
                            }
                        </div>
                    )
                }
            })}

            {editActive &&
                <div>
                    <div className='flex items-center text-3xl justify-center rounded-md shadow-lg font-bold p-2 mt-5 bg-slate-400 hover:bg-slate-600 hover:text-white hover:cursor-pointer'
                        onClick={addRun}>
                        <span>&#x2B;</span>
                    </div>
                    <div className={"text-center border rounded-md shadow-md p-3 mt-5 " +
                        (submitted == "check" && " bg-stw_yellow") +
                        (submitted == "wrong" && " bg-red-600") +
                        (submitted == "ok" && " bg-stw_green") +
                        (submitted == "" && " bg-stw_blue")
                    }
                        onClick={handleSave}
                    >
                        Startreihenfolge speichern
                    </div>
                </div>}
            {!editActive &&
                <div className="text-center border rounded-md shadow-md p-3 mt-3 bg-stw_green shadow-slate-900"
                    onClick={finishDiscipline}
                >
                    <span>Disziplin abschließen</span>
                </div>
            }
        </div >
    )
}


function MassStartStartingOrderSummary({ athletes, finishDiscipline }:
    { athletes: AthleteTimeResult[], finishDiscipline: () => void }) {


    return (
        <div className="p-1 h-full overflow-scroll ">
            <div className="border rounded-md mt-2 p-4 sm:p-6 ">
                <div className="flex flex-row justify-between font-bold text-xl sm:text-4xl">
                    <span>Massenstart</span>
                </div>
                <table className="w-full table-auto border-collapse text-[1rem] sm:text-[1.2rem] 2xl:text-sm mt-2" >
                    <thead >
                        <tr>
                            <th className="border border-slate-600 p-1 pl-2 pr-2">#</th>
                            <th className="border border-slate-600 p-1 pl-2 pr-2">Vorname</th>
                            <th className="border border-slate-600 p-1 pl-2 pr-2">Nachname</th>
                        </tr>
                    </thead>
                    <tbody>
                        {athletes.map((athlete) => {
                            return (
                                <tr key={athlete.starting_number}>
                                    <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete.starting_number || ""}</td>
                                    <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.name.substring(0, 13)}{athlete.name.length > 13 && "..."}</td>
                                    <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.surname.substring(0, 13)}{athlete.surname.length > 13 && "..."}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="text-center border rounded-md shadow-md p-3 mt-3 bg-stw_green shadow-slate-900"
                onClick={finishDiscipline}
            >
                <span>Disziplin abschließen</span>
            </div>
        </div >
    )
}
