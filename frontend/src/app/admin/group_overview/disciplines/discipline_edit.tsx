import { saveStartingOrder } from "@/app/lib/achievement_edit/api_calls";
import { PopUp } from "@/app/lib/achievement_edit/popup";
import { useAsyncError } from "@/app/lib/asyncError";
import { finish_discipline, reset_discipline } from "@/app/lib/discipline_edit";
import { StartingOrder, Discipline, AthleteID } from "@/app/lib/interfaces";
import { useEffect, useState } from 'react';


export function DisciplineEditButton(
  { discipline, group_name, group_view, update_discipline, start_discipline, children }: 
  { discipline: Discipline, group_name: string, group_view: boolean, 
    update_discipline: (order: Discipline) => void,
    start_discipline: undefined | ((name: string) => void),
    children: React.ReactNode,
  }) {
  const [state, setState] = useState({
    showPopup: false,
    showStartingOrderPopup: false,
    discipline: discipline
  })

  useEffect(() => {
    setState({
      showPopup: false,
      showStartingOrderPopup: false,
      discipline: discipline
    })
  }, [discipline])

  const closePopup = function (order: StartingOrder) {
    discipline.starting_order = order
    update_discipline(discipline)
    setState({ ...state, showStartingOrderPopup: false })
  }

  const startDiscipline = function(){
    if (start_discipline){
      start_discipline(state.discipline.name)
    }
  }

  const finish = function() {
    finish_discipline(group_name, state.discipline, (discipline) => {
      setState({ ...state, showPopup: false, discipline: discipline })
      update_discipline(discipline)
    })
  }

  const reset = function() {
    reset_discipline(group_name, state.discipline, (discipline) => {
      setState({ ...state, showPopup: false, discipline: discipline })
      update_discipline(discipline)
    })
  }


  return (
    <td className='border border-slate-800 p-1 sm:pl-4 sm:pr-4 w-10 h-10 sm:w-fit sm:h-fit' >
      <div className='flex justify-center items-center w-full h-full rounded-md shadow-md shadow-slate-600 active:shadow-none hover:bg-slate-600 hover:text-slate-50 hover:cursor-pointer  group'
        onClick={() => setState({ ...state, showPopup: true })}>
        {children}
      </div>
      {state.showPopup &&
        <PopUp title={state.discipline.name +  " bearbeiten"} onClose={() => setState({ ...state, showPopup: false })}>
          <div className="text-lg sm:text-xl text-center">
            {(state.discipline.state != "Finished" && typeof state.discipline.starting_order != "string") &&
              <div
                onClick={() => setState({ ...state, showPopup: false, showStartingOrderPopup: true })}
                className="border rounded-md shadow-black shadow-md p-2 m-4 bg-green-300 active:shadow-none"
              >Startreihenfolge bearbeiten</div>
            }
            {state.discipline.state != "Finished" && group_view &&
              <div
                onClick={startDiscipline}
                className="border rounded-md shadow-black shadow-md p-2 m-4 bg-slate-400 active:shadow-none"
              >
                Diszipline jetzt starten!
              </div>
            }
            {state.discipline.state != "Finished" &&
              <div
                onClick={finish}
                className="border rounded-md shadow-black shadow-md p-2 m-4 bg-red-400 active:shadow-none"
              >
                Disziplin abschließen!
              </div>
            }
            {state.discipline.state == "Finished" &&
              <div
                onClick={reset}
                className="border rounded-md shadow-black shadow-md p-2 m-4 bg-red-400 active:shadow-none"
              >
                Status zurücksetzen!
              </div>
            }
          </div>
        </PopUp>
      }

      {(state.showStartingOrderPopup && (typeof state.discipline.starting_order != "string")) &&

        <StartingOrderEditPopup group_name={group_name} disciplineName={discipline.name} startingOrder={state.discipline.starting_order}
          onClose={closePopup}>
        </StartingOrderEditPopup>

      }

    </td>
  )

}

function StartingOrderEditPopup({ group_name, disciplineName, startingOrder, onClose }: { group_name: string, disciplineName: string, startingOrder: StartingOrder, onClose: (order: StartingOrder) => void }) {
  const throwError = useAsyncError();

  const saveNewStartingOrder = function (new_order: StartingOrder) {
    saveStartingOrder(new_order, group_name, onClose)
    .catch((e) => {
      throwError(e);
  })
  }

  return (
    <PopUp title={disciplineName} onClose={() => onClose(startingOrder)}>
      <div className="relative flex-auto p-0 sm:p-2 max-w-[90vw] max-h-[80vh] sm:max-h-[90vh] overflow-scroll select-none" data-te-modal-body-ref>
        {startingOrder.Default && <DefaultStartingOrder StartingOrder={startingOrder.Default} saveStartingOrder={saveNewStartingOrder}></DefaultStartingOrder>}
        {startingOrder.Track && <TrackStartingOrder StartingOrder={startingOrder.Track} saveStartingOrder={saveNewStartingOrder}></TrackStartingOrder>}
      </div>
    </PopUp>
  )
}

function DefaultStartingOrder({ StartingOrder, saveStartingOrder }:
  { StartingOrder: AthleteID[], saveStartingOrder: (order: StartingOrder) => void }) {
  const [currentRows, setCurrentRows] = useState(StartingOrder)
  const [lastDraggedOver, setLastDraggedOver] = useState(NaN)
  const [submitted, setSubmitted] = useState(false)

  const handleDragOver = function (e: React.DragEvent, rowIndex: number) {
    e.preventDefault();
    setLastDraggedOver(rowIndex);
  }

  const handleDragDrop = function (e: React.DragEvent, rowIndex: number) {
    e.preventDefault();
    setLastDraggedOver(NaN);
    const dragIndex = e.dataTransfer.getData('rowIndex');
    if (dragIndex !== rowIndex.toString()) {
      const newRows = [...currentRows];
      const [draggedColumn] = newRows.splice(parseInt(dragIndex), 1);
      newRows.splice(rowIndex, 0, draggedColumn);
      setCurrentRows(newRows);
    }
  }

  const handleDragStart = function (e: React.DragEvent, rowIndex: number) {
    e.dataTransfer.setData('rowIndex', rowIndex.toString());
  }

  const handleOnClick = function () {
    setSubmitted(true)
    let starting_order = {
      Default: currentRows
    } as StartingOrder

    saveStartingOrder(starting_order)
  }

  return (
    <div className="relative flex-auto p-4 items-center" data-te-modal-body-ref>
      <div className="max-h-[70vh] overflow-scroll">
        <table className=" table-auto border-collapse w-full text-[1rem] sm:text-[0.8rem] 2xl:text-sm">
          <thead>
            <tr>
              <th className="border border-slate-600 p-1 pl-2 pr-2"></th>
              <th className="border border-slate-600 p-1 pl-2 pr-2">Vorname</th>
              <th className="border border-slate-600 p-1 pl-2 pr-2">Nachname</th>
              <th className="border border-slate-600 p-1 pl-2 pr-2"></th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((athlete, i) => {
              return (
                <tr className={'cursor-move bg-slate-400 active:bg-slate-600 active:text-slate-50 ' + (i == lastDraggedOver && " bg-white")}
                  draggable
                  onDrop={(e) => handleDragDrop(e, i)}
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  key={i}>
                  <td className="bg-white border border-slate-600 p-1 pl-2 pr-2 text-center">{i + 1}.</td>
                  <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.name}</td>
                  <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.surname}</td>
                  <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">
                    &#9776;
                  </td>
                </tr>
              )
            })}
          </tbody>

        </table>
      </div>

      <div
        className="flex flex-shrink-0 flex-wrap items-center justify-end rounded-b-md border-t-2 border-neutral-100 border-opacity-100 p-4 dark:border-opacity-50">
        <button id="submit_button"
          onClick={handleOnClick}
          className={"border rounded-md shadow-md inline-block hover:bg-green-300 bg-primary-100 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-primary-700 transition duration-150 ease-in-out hover:bg-primary-accent-100 focus:bg-primary-accent-100 focus:outline-none focus:ring-0 active:bg-primary-accent-200" + (submitted && " bg-yellow")}>
          Save
        </button>
      </div>
    </div>

  )
}

function TrackStartingOrder({ StartingOrder, saveStartingOrder }:
  { StartingOrder: { name: string, athletes: (AthleteID | null)[] }[], saveStartingOrder: (order: StartingOrder) => void }) {
  const [currentRuns, setcurrentRuns] = useState(StartingOrder)
  const [lastDraggedOver, setLastDraggedOver] = useState({ run_index: NaN, row_index: NaN })
  const [submitted, setSubmitted] = useState("")

  const handleDragOver = function (e: React.DragEvent, runIndex: number, rowIndex: number) {
    e.preventDefault();
    setLastDraggedOver({ run_index: runIndex, row_index: rowIndex });
  }

  const handleTableHeadDragDrop = function (e: React.DragEvent, runIndex: number) {
    e.preventDefault();
    setLastDraggedOver({ run_index: NaN, row_index: NaN });
    const dragRowIndex = e.dataTransfer.getData('rowIndex');
    const dragRunIndex = e.dataTransfer.getData('runIndex');

    if (dragRunIndex !== runIndex.toString()) {
      let newRun = currentRuns[runIndex]
      const [draggedColumn] = currentRuns[parseInt(dragRunIndex)].athletes.splice(parseInt(dragRowIndex), 1);
      newRun.athletes.splice(0, 0, draggedColumn);

      let newRuns = [...currentRuns]
      newRuns[runIndex] = newRun
      setcurrentRuns(newRuns);
      setSubmitted("")
    }
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

  const handleOnClick = function () {
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
    }

  }

  const deleteRun = function (run_name: string, run_id: number) {
    if (confirm(`${run_name} wirklich löschen?`)) {
      let newRuns = [...currentRuns]
      newRuns.splice(run_id, 1);
      setcurrentRuns(newRuns);
    }
  }

  return (
    <div className="flex flex-row flex-wrap p-4 justify-between " data-te-modal-body-ref>
      {currentRuns.map((run, run_id) => {

        if (run.athletes.length == 0) {
          return (<div key={run_id} className='w-fit m-2 max-w-[30%]'>
            <div className='text-center font-bold'>{run.name}</div>

            <table className="table-auto border-collapse text-[1rem] sm:text-[0.8rem] 2xl:text-sm " >
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
          </div>)
        } else {
          return (<div key={run_id} className='w-fit m-2 max-w-[100%] sm:max-w-[30%]'>
            <div className="flex justify-center">
              <div className='text-center font-bold'>{run.name}</div>
              {
                (run.athletes.every(e => e === null)) &&
                <div
                  className="ml-3 pl-1 pr-1 text-red-500 border border-red-500 shadow-lg rounded-md"
                  onClick={() => deleteRun(run.name, run_id)}
                >Delete</div>
              }
            </div>

            <table className="table-auto border-collapse text-[0.8rem] sm:text-[0.9rem] 2xl:text-sm " >
              <thead >
                <tr onDrop={(e) => handleTableHeadDragDrop(e, run_id)}>
                  <th className="border border-slate-600 p-1 pl-2 pr-2">Bahn</th>
                  <th className="border border-slate-600 p-1 pl-2 pr-2">AK</th>
                  <th className="border border-slate-600 p-1 pl-2 pr-2">Vorname</th>
                  <th className="border border-slate-600 p-1 pl-2 pr-2">Nachname</th>
                  <th className="border border-slate-600 p-1 pl-2 pr-2"></th>
                </tr>
              </thead>
              <tbody>
                {run.athletes.map((athlete, track_number) => {
                  if (athlete == null) {
                    return (<tr className={'cursor-move bg-slate-400 active:bg-slate-600 active:text-slate-50 ' +
                      ((track_number == lastDraggedOver.row_index && run_id == lastDraggedOver.run_index) && " bg-white")}
                      draggable
                      onDrop={(e) => handleDragDrop(e, run_id, track_number, true)}
                      onDragStart={(e) => handleDragStart(e, run_id, track_number, true)}
                      onDragOver={(e) => handleDragOver(e, run_id, track_number)}
                      key={track_number}>
                      <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{track_number + 1}.</td>
                      <td className="border border-slate-600 p-1 pl-2 pr-2"></td>
                      <td className="border border-slate-600 p-1 pl-2 pr-2"></td>
                      <td className="border border-slate-600 p-1 pl-2 pr-2"></td>
                      <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">
                        &#9776;
                      </td>
                    </tr>
                    )
                  }
                  else {
                    return (
                      <tr className={'cursor-move bg-slate-400 active:bg-slate-600 active:text-slate-50 ' +
                        ((track_number == lastDraggedOver.row_index && run_id == lastDraggedOver.run_index) && " bg-white")}
                        draggable
                        onDrop={(e) => handleDragDrop(e, run_id, track_number, false)}
                        onDragStart={(e) => handleDragStart(e, run_id, track_number, false)}
                        onDragOver={(e) => handleDragOver(e, run_id, track_number)}
                        key={track_number}>
                        <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{track_number + 1}.</td>
                        <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.age_group || ""}</td>
                        <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.name.substring(0, 8)}{athlete.name.length > 8 && "..."}</td>
                        <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.surname.substring(0, 8)}{athlete.surname.length > 8 && "..."}</td>
                        <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">
                          &#9776;
                        </td>
                      </tr>
                    )
                  }
                })}
              </tbody>
            </table>

          </div>)
        }
      })}
      <div className='flex items-center text-3xl rounded-md shadow-lg font-bold p-4 bg-slate-400 hover:bg-slate-600 hover:text-white hover:cursor-pointer'
        onClick={addRun}>
        <span>&#x2B;</span>
      </div>
      <div
        className="w-full flex flex-shrink-0 flex-wrap items-center justify-end rounded-b-md border-t-2 border-neutral-100 border-opacity-100 p-4 dark:border-opacity-50">
        <button id="submit_button"
          onClick={handleOnClick}
          className={"border rounded-md shadow-md inline-block hover:bg-green-300 bg-primary-100 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-primary-700 transition duration-150 ease-in-out hover:bg-primary-accent-100 focus:bg-primary-accent-100 focus:outline-none focus:ring-0 active:bg-primary-accent-200" +
            (submitted == "check" && " bg-yellow-600") +
            (submitted == "wrong" && " bg-red-600")}
        >
          Save
        </button>
      </div>
    </div>

  )
}