import { saveStartingOrder } from "@/app/lib/achievement_edit/api_calls";
import { StartingOrder, Discipline, AthleteID } from "@/app/lib/interfaces";
import { useState } from 'react';


export function StartingOrderEditButton({ discipline, group_name, updateStartingOrder, children }: { discipline: Discipline, group_name: string, updateStartingOrder: (order: StartingOrder) => void, children: React.ReactNode }) {
  const [showPopup, setshowPopup] = useState(false)

  const closePopup = function (order: StartingOrder) {
    updateStartingOrder(order)
    setshowPopup(false)
  }

  if (typeof discipline.starting_order == "string" || discipline.state == "Finished") {
    return (
      <td className='border border-slate-800 p-1 pl-4 pr-4  '>
        <div className='flex justify-center w-full'>
          <span className='flex'>

            {typeof discipline.starting_order == "string" && "-" }
            {discipline.state == "Finished" && "-"}

          </span>
        </div>
      </td>
    )
  } else {
    return (
      <td className='border border-slate-800 p-1 pl-4 pr-4 ' >
        <div className='flex justify-center w-full rounded-s-md shadow-md hover:bg-slate-600 hover:text-slate-50 hover:cursor-pointer  group'
          onClick={() => setshowPopup(true)}>
          {children}
        </div>
        {showPopup &&
          <EditPopup group_name={group_name} disciplineName={discipline.name} startingOrder={discipline.starting_order}
            onClose={closePopup}>
          </EditPopup>}
      </td>
    )
  }
}

function EditPopup({ group_name, disciplineName, startingOrder, onClose }: { group_name: string, disciplineName: string, startingOrder: StartingOrder, onClose: (order: StartingOrder) => void }) {
const saveNewStartingOrder = function(new_order: StartingOrder) {
  saveStartingOrder(new_order, group_name, onClose)
}

  return (
    <div
      className="fixed left-0 top-0 z-[1055] h-full w-full overflow-y-auto overflow-x-hidden outline-none bg-slate-500 bg-opacity-45">
      <div
        className="pointer-events-none relative w-auto transition-all duration-300 ease-in-out min-[576px]:mx-auto min-[576px]:mt-7 min-[1000px]:max-w-[80%]">
        <div
          className="min-[576px]:shadow-[0_0.5rem_1rem_rgba(#000, 0.15)] pointer-events-auto relative flex w-full flex-col rounded-md border-none bg-white bg-clip-padding text-current shadow-lg outline-none dark:bg-neutral-600">
          <div
            className="flex flex-shrink-0 items-center justify-between rounded-t-md border-b-2 border-neutral-100 border-opacity-100 p-4 dark:border-opacity-50">
            <h5
              className="text-xl font-medium leading-normal">
              {disciplineName}
            </h5>
            <button
              type="button"
              className="box-content rounded-none border-none hover:no-underline hover:opacity-75 focus:opacity-100 focus:shadow-none focus:outline-none"
              onClick={(_) => onClose(startingOrder)}>
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
          {startingOrder.Default && <DefaultStartingOrder StartingOrder={startingOrder.Default} saveStartingOrder={saveNewStartingOrder}></DefaultStartingOrder>}
          {startingOrder.Track && <TrackStartingOrder StartingOrder={startingOrder.Track} saveStartingOrder={saveNewStartingOrder}></TrackStartingOrder>}
        </div>
      </div>
    </div>
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
      <table className="table-auto border-collapse w-full text-[1rem] sm:text-[0.8rem] 2xl:text-sm">
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
  { StartingOrder: { name: string, athletes: AthleteID[] }[], saveStartingOrder: (order: StartingOrder) => void }) {
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
    newRuns.push({ name: "Lauf " + newRuns.length.toString(), athletes: [] })
    setcurrentRuns(newRuns);
  }

  const handleOnClick = function () {
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
          </div>)
        } else {
          return (<div key={run_id} className='w-fit m-2 max-w-[100%] sm:max-w-[30%]'>
            <div className='text-center font-bold'>{run.name}</div>

            <table className="table-auto border-collapse text-[1rem] sm:text-[0.8rem] 2xl:text-sm " >
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
                {run.athletes.map((athlete, athlete_id) => {
                  return (
                    <tr className={'cursor-move bg-slate-400 active:bg-slate-600 active:text-slate-50 ' +
                      ((athlete_id == lastDraggedOver.row_index && run_id == lastDraggedOver.run_index) && " bg-white")}
                      draggable
                      onDrop={(e) => handleDragDrop(e, run_id, athlete_id)}
                      onDragStart={(e) => handleDragStart(e, run_id, athlete_id)}
                      onDragOver={(e) => handleDragOver(e, run_id, athlete_id)}
                      key={athlete_id}>
                      <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">{athlete_id + 1}.</td>
                      <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.age_group}</td>
                      <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.name.substring(0, 8)}{athlete.name.length > 8 && "..."}</td>
                      <td className="border border-slate-600 p-1 pl-2 pr-2">{athlete.surname.substring(0, 8)}{athlete.surname.length > 8 && "..."}</td>
                      <td className="border border-slate-600 p-1 pl-2 pr-2 text-center">
                        &#9776;
                      </td>
                    </tr>
                  )
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