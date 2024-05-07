import { AthleteDistanceResults, AthleteID, Discipline, StartingOrder } from "@/app/lib/interfaces";
import { createContext, useContext, useEffect, useState } from "react";
import { BeforeStartInfoBox, finish_discipline, start_discipline } from "./discipline";
import { get_group_achievements, save_distance_achievement } from "@/app/lib/achievement_edit/api_calls";
import { AchievementValue, Athlete } from "@/app/lib/athlete_fetching";
import { setTimeout } from "timers";
import { NavigationContext } from "../navigation";

// TODO: Add "revert" functionality and back-arrow only get one level back to current disciline and not to HOME if in input mode


interface DistanceDisciplineState {
    discipline: Discipline,
    results: Map<string, AthleteDistanceResults>,
    current_try: number
    current_order: AthleteDistanceResults[]
    default_order: AthleteDistanceResults[]
}

const empty_state = {
    discipline: { name: "", location: "", start_time: "", state: "", starting_order: "", discipline_type: "" },
    results: new Map(),
    current_try: 0,
    current_order: [],
    default_order: []
} as DistanceDisciplineState

const AthleteResults = createContext<{ state: DistanceDisciplineState, update_state: (state: DistanceDisciplineState) => void }>
    ({ state: empty_state, update_state: (empty_state) => { } });



export default function DistanceDiscipline({ group_name, discipline }: { group_name: string, discipline: Discipline }) {
    const [disciplineState, setDisciplineState] = useState<DistanceDisciplineState>({ ...empty_state, discipline: discipline })

    useEffect(() => {
        get_group_achievements(group_name, get_discipline_results)
    }, [group_name])

    const get_discipline_results = function (athletes: Athlete[]) {
        let athlete_results: Map<string, AthleteDistanceResults> = new Map()

        let discipline_unit = "m"//TODO: Check if we can get this value from somewhere else than hardcoding it

        athletes.forEach(athlete => {
            let athlete_result: AthleteDistanceResults = {
                name: athlete.name,
                surname: athlete.surname,
                starting_number: athlete.starting_number,
                age_group: "",
                discipline_name: discipline.name,
                discipline_unit: discipline_unit, 
                full_name: () => athlete.name + "_" + athlete.surname
            }
            let achievement_map: Map<string, AchievementValue> = new Map(Object.entries(athlete.achievements));
            let achievement = achievement_map.get(discipline.name)?.Distance;
            if (achievement) {
                let all_results = []
                if (achievement.first_try) {
                    athlete_result.first_try = parseFloat(achievement.first_try.integral + "." + achievement.first_try.fractional)
                    all_results.push(athlete_result.first_try)
                }
                if (achievement.second_try) {
                    athlete_result.second_try = parseFloat(achievement.second_try.integral + "." + achievement.second_try.fractional)
                    all_results.push(athlete_result.second_try)
                }
                if (achievement.third_try) {
                    athlete_result.third_try = parseFloat(achievement.third_try.integral + "." + achievement.third_try.fractional)
                    all_results.push(athlete_result.third_try)
                }
                if (achievement.final_result) {
                    if (all_results.length == 0 || Math.max(...all_results) == -1) {
                        athlete_result.first_try = parseFloat(achievement.final_result.integral + "." + achievement.final_result.fractional)
                        athlete_result.best_try = athlete_result.first_try
                    }
                }
            }
            athlete_results.set(athlete_result.full_name(), athlete_result)
        })

        // Get current starting order and try from results on load
        let current_try = 1
        let default_starting_order: AthleteDistanceResults[] = []
        if (typeof disciplineState.discipline.starting_order != "string" && disciplineState.discipline.starting_order.Default) {
            default_starting_order = disciplineState.discipline.starting_order.Default.map(athlete => { 
                return new AthleteDistanceResults(athlete, discipline.name, discipline_unit, athlete_results.get(athlete.name + "_" + athlete.surname)?.starting_number)
            })
            let try_order: AthleteDistanceResults[] = []
            let not_done = [1, 2, 3].some(try_number => { // Check all tries
                current_try = try_number
                try_order = [...default_starting_order]
                while (try_order.length > 0) {
                    let athlete = athlete_results.get(try_order[0].full_name())
                    if (athlete) {
                        // If athlete has no attempt for this try then start with this person
                        if (try_number == 1) {
                            if (!("first_try" in athlete)) {
                                return true
                            }
                        } else if (try_number == 2) {
                            if (!("second_try" in athlete)) {
                                return true
                            }
                        } else if (try_number == 3) {
                            if (!("third_try" in athlete)) {
                                return true
                            }
                        }
                    }
                    try_order.shift()
                }
            })
            if (not_done) {
                setDisciplineState({
                    ...disciplineState,
                    current_try: current_try,
                    results: athlete_results,
                    current_order: try_order,
                    default_order: default_starting_order
                })
            } else {
                finish_discipline(group_name, disciplineState.discipline, setDiscipline)
            }
        }
    }

    const setDiscipline = function (discipline: Discipline) {
        setDisciplineState({
            ...disciplineState,
            discipline: discipline
        })
    }


    if (disciplineState.current_try == 0 || disciplineState.results.size == 0) {
        return (<div>Loading results...</div>)
    }


    return (
        <AthleteResults.Provider value={{
            state: disciplineState,
            update_state: setDisciplineState
        }}>
            <div className="h-full">
                {
                    disciplineState.discipline.state == "BeforeStart" &&
                    <BeforeStartInfoBox
                        ready={true}
                        discipline={disciplineState.discipline}
                        start_discipline={() => start_discipline(group_name, disciplineState.discipline, setDiscipline)}
                    ></BeforeStartInfoBox>
                }
                {
                    (disciplineState.discipline.state == "Active" && disciplineState.default_order.length > 0) &&
                    <div className="h-full">
                        {
                            (typeof disciplineState.discipline.starting_order != "string" && disciplineState.discipline.starting_order.Default) ?
                                <StartingOrderOverview finish_discipline={() => finish_discipline(group_name, disciplineState.discipline, setDiscipline)}></StartingOrderOverview>
                                :
                                <div>
                                    Keine Reihenfolge
                                </div>
                        }
                    </div>
                }
                {
                    disciplineState.discipline.state == "Finished" &&
                    <div className="flex h-full text-2xl font-bold items-center justify-center">
                        <span>Abgeschlossen</span>
                    </div>
                }
            </div>
        </AthleteResults.Provider>
    )
}

function StartingOrderOverview({ finish_discipline }: { finish_discipline: () => void }) {
    const [selectedAthlete, setSelectedAthlete] = useState<AthleteDistanceResults | undefined>()
    const { state, update_state } = useContext(AthleteResults)
    const navigation = useContext(NavigationContext)

    const save_athlete_try = function (athlete: AthleteID, try_number: number, new_value: number | string) {
        let selected_athlete = state.current_order[0]
        navigation.history.push({
            name: "Save Achievement",
            reset_function: () => {
                setSelectedAthlete(selected_athlete)
                update_state({ ...state })
            }
        })
        let athlete_result = state.results.get(athlete.full_name())
        if (typeof new_value == "string") {
            new_value = parseFloat(new_value)
        }
        if (athlete_result) {
            let update_result = { ...athlete_result, full_name: () => athlete_result.full_name() }
            // Reset all tries to only update the new one
            update_result.first_try = undefined
            update_result.second_try = undefined
            update_result.third_try = undefined

            if (try_number == 1) {
                athlete_result.first_try = new_value
                update_result.first_try = new_value
            } else if (try_number == 2) {
                athlete_result.second_try = new_value
                update_result.second_try = new_value
            } else if (try_number == 3) {
                athlete_result.third_try = new_value
                update_result.third_try = new_value
            }
            if (!athlete_result.best_try || new_value > athlete_result.best_try) {
                athlete_result.best_try = new_value
                update_result.best_try = new_value
            }

            save_distance_achievement(update_result, () => {
                let new_results = state.results
                if (athlete_result) {
                    new_results.set(athlete.full_name(), athlete_result)
                }
                setTimeout(() => try_completed(new_results), 200)
            })
        } else {
            alert("Error while saving achievement")
        }

    }

    const try_completed = function (new_results: Map<string, AthleteDistanceResults>) {
        if (state.current_order.length <= 1) {
            if (state.current_try >= 3) {
                // Finish discipline
                finish_discipline()
            } else {
                // increase try
                update_state({
                    ...state,
                    current_try: state.current_try + 1,
                    current_order: state.default_order,
                    results: new_results
                })
                setSelectedAthlete(undefined)
            }
        } else {
            update_state({
                ...state,
                current_order: state.current_order.slice(1),
                results: new_results
            })
            setSelectedAthlete(undefined)
        }

    }


    const select_athlete = function () {
        setSelectedAthlete(state.current_order[0])
        navigation.history.push({
            name: "Select Athlete",
            reset_function: () => setSelectedAthlete(undefined)
        })
    }


    if (selectedAthlete) {
        return (
            <DistanceInput athlete={selectedAthlete} try_completed={save_athlete_try}></DistanceInput>
        )
    } else {
        return (
            <div className="grid grid-rows-2">
                <div className="grid grid-rows-5">
                    <div className="font-bold underline text-2xl">{state.current_try}. Versuch: </div>
                    <div className="row-span-1 grid grid-cols-5 text-xl font-bold h-full">
                        <div className="flex items-center justify-center border"><span>#</span></div>
                        <div className="col-span-3 flex items-center justify-center border"><span>Name</span></div>
                        <div className="flex items-center justify-center border"><span></span></div>
                    </div>
                    <div className="row-span-3 grid grid-cols-5 text-xl font-bold h-full"
                        onClick={select_athlete}
                    >
                        <div className="flex items-center justify-center border bg-green-200"><span>{state.current_order[0].starting_number}</span></div>
                        <div className="col-span-3 flex items-center justify-center border bg-green-200"><span>{state.current_order[0].name} {state.current_order[0].surname}</span></div>
                        <div className="flex items-center justify-center border bg-green-200"><span>&gt;</span></div>
                    </div>
                </div>
                <div className="mt-3">
                    {state.current_order.length > 1 &&
                        <div>
                            <div className="font-bold underline text-xl">In Vorbereitung {state.current_try}. Versuch</div>
                            {
                                state.current_order.slice(1, 5).map((athlete => {
                                    return (
                                        <div key={athlete.full_name()} className=" grid grid-cols-5 text-lg sm:text-xl">
                                            <div className="flex items-center justify-center border pt-2 pb-2"><span>{athlete.starting_number}</span></div>
                                            <div className="col-span-4 flex items-center justify-center border pt-2 pb-2"><span>{athlete.name} {athlete.surname}</span></div>
                                        </div>
                                    )
                                }))
                            }
                        </div>
                    }

                    {(state.current_order.length < 5 && state.current_try < 3) &&
                        <div>
                            <div className="font-bold underline text-xl">In Vorbereitung {state.current_try + 1}. Versuch:</div>
                            {
                                state.default_order.slice(0, 5 - state.current_order.length).map((athlete => {
                                    return (
                                        <div key={athlete.starting_number} className=" grid grid-cols-5 text-lg sm:text-xl">
                                            <div className="flex items-center justify-center border pt-2 pb-2"><span>{athlete.starting_number}</span></div>
                                            <div className="col-span-4 flex items-center justify-center border pt-2 pb-2"><span>{athlete.name} {athlete.surname}</span></div>
                                        </div>
                                    )
                                }))
                            }
                        </div>
                    }
                </div>
            </div>
        )
    }

}

function DistanceInput({ athlete, try_completed }: { athlete: AthleteID, try_completed: (athlete: AthleteID, try_number: number, new_value: number | string) => void }) {
    const { state } = useContext(AthleteResults)
    const athlete_result = state.results.get(athlete.full_name())
    let try_value: number | string = ""
    if (athlete_result) {
        if (state.current_try == 1) {
            try_value = athlete_result.first_try || ""
        } else if (state.current_try == 2) {
            try_value = athlete_result.second_try || ""

        } else if (state.current_try == 3) {
            try_value = athlete_result.third_try || ""
        }
    }
    const [selectedTry, setSelectedTry] = useState({ try_number: state.current_try, try_value: try_value })

    return (
        <div className="grid grid-rows-8 h-full w-full z-50 p-2 bg-slate-400 shadow-lg border rounded-md">
            <div className="flex flex-row items-center justify-between text-xl sm:text-4xl p-2 bg-slate-700 text-slate-100 rounded-md">
                <div>{athlete.name} {athlete.surname}</div>
                <div>{athlete_result?.best_try != -1 && athlete_result?.best_try} m</div>
            </div>
            {[1, 2, 3].map(try_number => {
                let try_value: number | string = ""
                if (try_number == selectedTry.try_number) {
                    try_value = selectedTry.try_value
                } else if (athlete_result) {
                    if (try_number == 1) {
                        try_value = (typeof athlete_result.first_try !== 'undefined') ? athlete_result.first_try : ""
                    } else if (try_number == 2) {
                        try_value = (typeof athlete_result.second_try !== 'undefined') ? athlete_result.second_try : ""
                    } else if (try_number == 3) {
                        try_value = (typeof athlete_result.third_try !== 'undefined') ? athlete_result.third_try : ""
                    }
                }

                return (
                    <Try
                        key={try_number}
                        try_number={try_number}
                        try_value={try_value}
                        current_try={selectedTry.try_number == try_number}
                        setSelectedTry={setSelectedTry}
                        save_value={(try_number: number, new_value: number | string) => try_completed(athlete, try_number, new_value)}>
                    </Try>
                )
            })}
            <NumberPad current_value={selectedTry} updateValue={setSelectedTry}></NumberPad>
        </div>
    )
}


function Try({ try_number, try_value, current_try, save_value, setSelectedTry }:
    { try_number: number, try_value: number | string, current_try: boolean, save_value: (try_number: number, new_value: number | string) => void, setSelectedTry: (val: { try_number: number, try_value: number | string }) => void }) {

    return (
        <div className="text-xl sm:text-4xl">
            <div className="grid grid-cols-3 justify-between items-center h-full">
                <div >
                    {try_number}. Versuch:
                </div>
                <div className="flex flex-row items-center justify-center h-full">
                    <div className={"text-center w-full min-h-[50%] p-1 rounded bg-slate-400 " + (current_try && "bg-slate-50 border border-green-300")}
                        onClick={() => setSelectedTry({ try_number: try_number, try_value: try_value })}
                    >
                        {try_value != -1 && try_value}
                        {(try_value == -1 && current_try) && ""}
                        {(try_value == -1 && !current_try) && "X"}

                    </div>
                    <div>
                        {try_value != -1 && "m"}
                    </div>
                </div>
                {
                    current_try &&
                    <div className="flex flex-row items-center justify-center h-full p-3">
                        {
                            (try_value != "") &&
                            <div className="flex items-center justify-center border rounded-md shadow-lg h-full w-[75%] border-stw_green active:bg-slate-100"
                                onClick={() => save_value(try_number, try_value)}
                            >
                                &#9989;
                            </div>
                        }
                        {
                            (try_value == "") &&
                            <div className="flex items-center justify-center  border rounded-md shadow-lg h-full  w-[75%] border-stw_orange active:bg-slate-100"
                                onClick={() => save_value(try_number, -1)}
                            >
                                &#10060;
                            </div>
                        }
                    </div>
                }
            </div>
        </div>
    )
}

function NumberPad({ current_value, updateValue }: { current_value: { try_number: number, try_value: number | string }, updateValue: (val: { try_number: number, try_value: number | string }) => void }) {

    const handleClick = function (val: string | number) {
        let new_value: string | number = current_value.try_value.toString()

        if (new_value == "-1") {
            new_value = ""
        }

        if (typeof val == "string") {
            if (val == ".") {
                new_value += val
            } else if (val == "C") {
                new_value = new_value.slice(0, new_value.length - 1)
            }
        } else {
            new_value += val
        }
        updateValue({ ...current_value, try_value: new_value })
    }
    return (
        <div className="row-span-4 grid grid-cols-3 grid-rows-4 h-full">
            {
                [1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "C"].map(val => {
                    return (
                        <div
                            key={val}
                            className="border flex justify-center items-center active:bg-slate-100"
                            onClick={() => handleClick(val)}
                        >
                            <span className="font-bold text-2xl sm:text-4xl">{val}</span>
                        </div>
                    )
                })
            }
        </div>
    )
}