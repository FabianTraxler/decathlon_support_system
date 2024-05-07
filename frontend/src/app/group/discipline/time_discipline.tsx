import { AthleteID, AthleteTimeResult, Discipline, StartingOrder } from "@/app/lib/interfaces";
import { useEffect, useState } from "react";
import { BeforeStartInfoBox, finish_discipline, start_discipline } from "./discipline";
import { get_group_achievements, saveStartingOrder } from "@/app/lib/achievement_edit/api_calls";
import { Athlete } from "@/app/lib/athlete_fetching";

export default function TimeDiscipline({ group_name, discipline }: { group_name: string, discipline: Discipline }) {
    const [current_discipline, setDiscipline] = useState<Discipline>({...discipline, starting_order: {Track: []}})

    useEffect(() => {
        get_group_achievements(group_name, get_athlete_starting_numbers)
    }, [group_name])

    const get_athlete_starting_numbers = function (athletes: Athlete[]) {
        let athlete_starting_numbers: Map<string, number> = new Map()

        athletes.forEach(athlete => {
            athlete_starting_numbers.set(athlete.name + "_" + athlete.surname, athlete.starting_number)
        })
    
        let new_starting_order: {name: string, athletes: AthleteTimeResult[]}[] = []
        if (typeof discipline.starting_order != "string" && discipline.starting_order.Track){
            new_starting_order = discipline.starting_order.Track.map(run => {
                let athletes = run.athletes.map(athlete => {
                    return {
                        ...athlete,
                        starting_number: athlete_starting_numbers.get(athlete.name + "_" + athlete.surname),
                        full_name: () => athlete.name + "_" + athlete.surname
                    }
            })
                return {
                    name: run.name,
                    athletes: athletes
                }
            })
        }


        setDiscipline({
            ...current_discipline,
            starting_order: {
                Track: new_starting_order
            }
            })

    }


const saveNewStartingOrder = function (new_order: StartingOrder) {
    saveStartingOrder(new_order, group_name, () => { })
}

return (
    <div className="h-full">
        {
            current_discipline.state == "BeforeStart" &&
            <BeforeStartInfoBox
                ready={true}
                discipline={current_discipline}
                start_discipline={() => start_discipline(group_name, current_discipline, setDiscipline)}></BeforeStartInfoBox>
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
                        <div>
                            Loading ...
                        </div>
                }
            </div>
        }
        {
            current_discipline.state == "Finished" &&
            <div className="flex h-full text-2xl font-bold items-center justify-center">
                <span>Abgeschlossen</span>
            </div>
        }
    </div>
)
}


function StartingOrderSummary({ starting_order, saveStartingOrder, finishDiscipline }:
    { starting_order: { name: string, athletes: AthleteTimeResult[] }[], saveStartingOrder: (order: StartingOrder) => void, finishDiscipline: () => void }) {

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

    const handleDragDrop = function (e: React.DragEvent, runIndex: number, rowIndex: number) {
        e.preventDefault();
        setLastDraggedOver({ run_index: NaN, row_index: NaN });
        const dragRowIndex = e.dataTransfer.getData('rowIndex');
        const dragRunIndex = e.dataTransfer.getData('runIndex');

        if (dragRowIndex !== rowIndex.toString() || dragRunIndex !== runIndex.toString()) {
            let newRun = currentRuns[runIndex]
            const [draggedColumn] = currentRuns[parseInt(dragRunIndex)].athletes.splice(parseInt(dragRowIndex), 1);
            newRun.athletes.splice(rowIndex, 0, draggedColumn);

            let newRuns = [...currentRuns]
            newRuns[runIndex] = newRun
            setcurrentRuns(newRuns);
            setSubmitted("")
        }
    }

    const handleDragStart = function (e: React.DragEvent, runIndex: number, rowIndex: number) {
        e.dataTransfer.setData('rowIndex', rowIndex.toString());
        e.dataTransfer.setData('runIndex', runIndex.toString());
    }
    const addRun = function () {
        let newRuns = [...currentRuns]
        newRuns.push({ name: "Lauf " + (newRuns.length + 1).toString(), athletes: [] })
        setcurrentRuns(newRuns);
    }

    const handleSave = function () {
        setSubmitted("check")

        let runs_correct = true;

        let used_runs: { name: string, athletes: AthleteID[] }[] = []

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
    return (
        <div className="p-1 h-full overflow-scroll ">
            <div className={"text-center border rounded-md mb-4 p-3  shadow-slate-900 " + (editActive ? "bg-stw_orange " : "bg-stw_blue shadow-md")}
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
                                        onDrop={(e) => handleDragDrop(e, run_id, 0)}
                                        onDragStart={(e) => handleDragStart(e, run_id, 0)}
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
                                                return (
                                                    <tr
                                                        key={athlete_id + "undraggable"}>
                                                        <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete_id + 1}.</td>
                                                        <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete.starting_number}</td>
                                                        <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.age_group.substring(0, 3)}</td>
                                                        <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.name.substring(0, 6)}{athlete.name.length > 6 && "..."}</td>
                                                        <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.surname.substring(0, 7)}{athlete.surname.length > 7 && "..."}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    }

                                    {editActive &&
                                        <tbody>
                                            {run.athletes.map((athlete, athlete_id) => {
                                                return (
                                                    <tr className={'cursor-move select-none bg-slate-300 active:bg-slate-600 active:text-slate-50 ' +
                                                        ((athlete_id == lastDraggedOver.row_index && run_id == lastDraggedOver.run_index) && " bg-white")
                                                    }
                                                        draggable
                                                        onDrop={(e) => handleDragDrop(e, run_id, athlete_id)}
                                                        onDragStart={(e) => handleDragStart(e, run_id, athlete_id)}
                                                        onDragOver={(e) => handleDragOver(e, run_id, athlete_id)}
                                                        key={athlete_id + "draggable"}>
                                                        <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete_id + 1}.</td>
                                                        <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete.starting_number}</td>
                                                        <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.age_group.substring(0, 3)}</td>
                                                        <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.name.substring(0, 6)}{athlete.name.length > 6 && "..."}</td>
                                                        <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.surname.substring(0, 7)}{athlete.surname.length > 7 && "..."}</td>
                                                        <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">
                                                            &#9776;
                                                        </td>
                                                    </tr>
                                                )
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
