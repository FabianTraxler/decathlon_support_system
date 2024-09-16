import { AthleteHeightID, AthleteHeightResults, AthleteID, Discipline } from "@/app/lib/interfaces";
import { createContext, useContext, useEffect, useState } from "react";
import { BeforeStartInfoBox, finish_discipline, start_discipline } from "../discipline";
import { get_group_achievements } from "@/app/lib/achievement_edit/api_calls";
import { AchievementValue, Athlete } from "@/app/lib/athlete_fetching";
import { StartHeightInput } from "./starting_height";
import { HeightOrderOverview } from "./athlete_overview";
import { LoadingAnimation } from "@/app/lib/loading";


interface HeightDisciplineState {
    discipline: Discipline
    results: Map<string, AthleteHeightResults>
    current_try: number
    current_height: number
    height_increase: number
    current_order: AthleteHeightID[]
    default_order: AthleteHeightID[]
    athletes_in_next_try: AthleteHeightID[]
    athletes_in_next_next_try: AthleteHeightID[]
    athletes_in_next_height: AthleteHeightID[]
    new_athletes_for_new_height: Set<AthleteHeightID>
    discipline_progress_state: string // "new_height", "jumping",
    min_start_height: number,
    loaded: boolean,
    all_athletes_start_height_set: boolean
}

const empty_state = {
    discipline: { name: "", location: "", start_time: "", state: "", starting_order: "", discipline_type: "" },
    results: new Map(),
    current_try: 0,
    current_height: 0,
    height_increase: 0,
    current_order: [],
    default_order: [],
    athletes_in_next_try: [],
    athletes_in_next_next_try: [],
    athletes_in_next_height: [],
    new_athletes_for_new_height: new Set(),
    discipline_progress_state: "new_height",
    min_start_height: 0,
    loaded: false,
    all_athletes_start_height_set: false
} as HeightDisciplineState

export const AthleteResults = createContext<{ state: HeightDisciplineState, update_state: (state: HeightDisciplineState) => void }>
    ({ state: empty_state, update_state: (empty_state) => { } });


export default function HeightDiscipline({ group_name, discipline }: { group_name: string, discipline: Discipline }) {
    const min_start_height = discipline.name == "Hochsprung" ? 80 : 120 // TODO: Get from API Call (stored in central config) 
    const height_increase = discipline.name == "Hochsprung" ? 4 : 20 // TODO: Get from API Call (stored in central config) 
    const max_start_increase = discipline.name == "Hochsprung" ? 200 : 400 // TODO: Get from API Call (stored in central config) 

    const [disciplineState, setDisciplineState] = useState<HeightDisciplineState>({ ...empty_state, discipline: discipline, current_height: min_start_height, height_increase: height_increase })
    const [showStartHeightInput, setShowStartHeightInput] = useState(false)

    const get_discipline_results = function (athletes: Athlete[], discipline: Discipline) {
        if (typeof disciplineState.discipline.starting_order != "string" && disciplineState.discipline.starting_order.Default) {
            let default_starting_order = disciplineState.discipline.starting_order.Default as AthleteID[]
            //default_starting_order = default_starting_order.filter((athlete) => athlete.starting_number != undefined)

            let current_state = get_descipline_state_from_results(athletes, discipline, min_start_height, height_increase, default_starting_order)

            if (current_state.current_try_order.length > 0 || !current_state.all_athletes_start_height_set) {
                if (!current_state.all_athletes_start_height_set) {
                    // Not all athletes ready
                    discipline.state = "BeforeStart"
                } else {
                    //  all athletes ready
                    discipline.state = "Active"
                }
                setDisciplineState({
                    ...disciplineState,
                    discipline: discipline,
                    current_height: current_state.current_height,
                    current_try: current_state.current_try,
                    results: current_state.athlete_results,
                    current_order: current_state.current_try_order,
                    athletes_in_next_try: current_state.next_try_order,
                    athletes_in_next_height: current_state.athletes_in_next_height,
                    discipline_progress_state: current_state.height_not_started ? "new_height" : "jumping",
                    default_order: current_state.default_starting_order,
                    loaded: true,
                    all_athletes_start_height_set: current_state.all_athletes_start_height_set,
                    new_athletes_for_new_height: current_state.new_in_height
                })
            } else if (current_state.athlete_results.size == 0) {
                let discipline = disciplineState.discipline;
                discipline.state = "NoAthletes"
                setDisciplineState({
                    ...disciplineState,
                    loaded: true,
                    discipline: discipline
                })
            } else {
                finish_discipline(group_name, disciplineState.discipline, (discipline: Discipline) => {
                    setDisciplineState({
                        ...disciplineState,
                        loaded: true,
                        discipline: discipline
                    })
                })
            }
        }
    }
    const initialze_discipline = function (discipline: Discipline) {
        get_group_achievements(group_name, (athletes) => get_discipline_results(athletes, discipline))
    }

    useEffect(() => {
        get_group_achievements(group_name, (athletes) => get_discipline_results(athletes, disciplineState.discipline))
    }, [group_name])

    const finish_height_discipline = function () {
        finish_discipline(group_name, disciplineState.discipline, (discipline: Discipline) => {
            setDisciplineState({
                ...disciplineState,
                loaded: true,
                discipline: discipline,
            })
        })
    }

    if (disciplineState.loaded == false) {
        return (
            <div className="flex justify-center items-center h-full w-full"><LoadingAnimation></LoadingAnimation></div>
        )
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
                        ready={disciplineState.all_athletes_start_height_set}
                        discipline={disciplineState.discipline}
                        start_discipline={() => {
                            if (disciplineState.all_athletes_start_height_set) {
                                start_discipline(group_name, disciplineState.discipline, initialze_discipline)
                            } else {
                                alert("Noch nicht alle Starthöhen eingetragen")
                            }
                        }}
                    >
                        <div className="text-2xl mt-8 sm:mt-14 justify-center flex ">
                            <div
                                className={"border rounded-md shadow-md  w-fit p-2 sm:p-4 hover:cursor-pointer " + (disciplineState.all_athletes_start_height_set ? " bg-green-200 active:bg-green-500 " : "bg-stw_blue active:bg-blue-800 ")}
                                onClick={() => setShowStartHeightInput(!showStartHeightInput)}
                            >
                                Anfangshöhen bearbeiten
                            </div>
                        </div>
                    </BeforeStartInfoBox>
                }
                {
                    disciplineState.discipline.state == "NoAthletes" &&
                    <div className="h-full flex flex-col items-center justify-center">
                        <div className="font-bold text-xl text-center">
                            Kein Athlet:innen mit Startnummer! Warten auf Anmeldung.
                        </div>
                        <div
                            className="border border-red-900 rounded-xl shadow-md shadow-black bg-red-400 p-2  m-5 active:shadow-none"
                            onClick={() => finish_height_discipline()}
                        >
                            Diziplin dennoch abschließen!
                        </div>
                    </div>

                }
                {
                    showStartHeightInput &&
                    <StartHeightInput step_size={height_increase} min_height={min_start_height} max_height={max_start_increase} close={() => setShowStartHeightInput(false)}></StartHeightInput>
                }
                {
                    (disciplineState.discipline.state == "Active" && disciplineState.discipline_progress_state == "new_height" && disciplineState.default_order.length > 0) &&
                    <NewHeightOverview></NewHeightOverview>
                }
                {
                    (disciplineState.discipline.state == "Active" && disciplineState.discipline_progress_state == "jumping" && disciplineState.default_order.length > 0) &&
                    <HeightOrderOverview finish_discipline={finish_height_discipline}></HeightOrderOverview>
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

function NewHeightOverview() {
    const { state, update_state } = useContext(AthleteResults)

    const start_height = function () {
        let new_current_order: AthleteHeightID[] = []
        state.default_order.forEach(athlete => {
            if (state.current_order.includes(athlete) || state.new_athletes_for_new_height.has(athlete)) {
                new_current_order.push(athlete)
            }
        })
        update_state({
            ...state,
            current_order: new_current_order,
            discipline_progress_state: "jumping",
            new_athletes_for_new_height: new Set()
        })
    }


    return (
        <div className="h-full grid grid-rows-8">
            <div className="row-span-2">
                <div className="text-2xl underline mt-2 sm:mt-4 ">
                    Neue Höhe:
                </div>
                <div className="text-4xl font-bold text-center mt-2 sm:mt-4 ">
                    {state.current_height} cm
                </div>
            </div>

            <div className="w-full row-span-5">

                {state.new_athletes_for_new_height.size >= 1 ?
                    <div className="h-full w-full grid grid-rows-8">
                        <div className="text-xl underline">
                            Neu im Bewerb:
                        </div>
                        <div className="row-span-7 mt-2 w-full overflow-scroll">
                            {
                                Array.from(state.new_athletes_for_new_height).map((athlete => {
                                    return (
                                        <div key={athlete.starting_number} className=" grid grid-cols-4 text-lg sm:text-xl w-full">
                                            <div className="flex items-center justify-center border pt-2 pb-2"><span>{athlete.starting_number}</span></div>
                                            <div className="col-span-3 flex items-center justify-center border pt-2 pb-2"><span>{athlete.name} {athlete.surname}</span></div>
                                        </div>
                                    )
                                }))
                            }

                        </div>
                    </div>
                    :
                    <div className="text-center font-xl">
                        Keine neuen Athlet:innen im Bewerb
                    </div>
                }
            </div>
            <div className="row-span-1 text-3xl items-center justify-center flex ">
                <div
                    className="border rounded-md shadow-md bg-green-200 w-fit h-fit p-2 sm:p-4 hover:cursor-pointer active:bg-slate-500"
                    onClick={start_height}
                >
                    Höhe starten
                </div>
            </div>
        </div>
    )
}


export function athlete_in_competition(athlete_result: AthleteHeightResults, new_height: number): boolean {
    let result_string = athlete_result.tries

    if (result_string && result_string?.length > 0) {
        let all_heights = result_string.split("-")

        return all_heights.every((height_tries) => {
            if (height_tries[2] == "X") { // used all tries at a previous height and therefore elimiated
                return false
            } else {
                return true
            }
        })
    } else {
        if (athlete_result.start_height == new_height) { // joined competition at this height
            return true
        } else { // starts at a later height
            return false
        }
    }
}

interface AthleteState {
    jumped_height: number
    still_active: boolean
    next_height: number
    current_try: number
}

function get_descipline_state_from_results(athletes: Athlete[], discipline: Discipline, min_start_height: number, height_increase: number, default_starting_order: AthleteID[]) {


    let athlete_results: Map<string, AthleteHeightResults> = new Map() // stored in state as results

    let current_height = Infinity;

    var all_athletes_start_height_set = true;

    let active_athletes: AthleteHeightResults[] = []
    athletes.forEach(athlete => {
        if (athlete.starting_number != undefined) { // Only consider activce atheltes

            // Setup athlete results with default value 
            let athlete_result: AthleteHeightResults = {
                name: athlete.name,
                surname: athlete.surname,
                starting_number: athlete.starting_number,
                age_group: "",
                discipline_name: discipline.name,
                discipline_unit: "cm", //TODO: Check if we can get this value from somewhere else than hardcoding it
                start_height: min_start_height,
                start_height_set: false,
                height_increase: height_increase,
                still_active: false,
                current_height: min_start_height,
                current_try: 1,
                full_name: () => athlete.name + "_" + athlete.surname
            }

            // Check if some of the values are already stored in DB
            let achievement_map: Map<string, AchievementValue> = new Map(Object.entries(athlete.achievements));
            let achievement = achievement_map.get(discipline.name)?.Height;
            if (achievement) {
                if (achievement.start_height) {
                    athlete_result.start_height = achievement.start_height
                    athlete_result.start_height_set = true;
                } else {
                    all_athletes_start_height_set = false
                }
                if (achievement.height_increase) {
                    athlete_result.height_increase = achievement.height_increase
                }
                if (achievement.tries) {
                    athlete_result.tries = achievement.tries
                    // Get current state of athlete in this discipline
                    let decoded_tries = decode_athlete_tries(athlete_result)
                    athlete_result.current_height = decoded_tries.next_height
                    athlete_result.current_try = decoded_tries.current_try
                    athlete_result.still_active = decoded_tries.still_active
                    athlete_result.final_result = decoded_tries.jumped_height

                    if (athlete_result.still_active && decoded_tries.next_height < current_height) {
                        current_height = decoded_tries.next_height
                    }
                } else if (achievement.start_height) {
                    athlete_result.still_active = true
                    athlete_result.current_height = achievement.start_height
                    athlete_result.current_try = 1
                    if (achievement.start_height < current_height && achievement.start_height != -1) {
                        current_height = achievement.start_height
                    }
                }
            } else {
                // Never started discipline and therefore still active
                athlete_result.still_active = true
                all_athletes_start_height_set = false
            }
            athlete_results.set(athlete_result.full_name(), athlete_result)

            if (athlete_result.still_active) {
                active_athletes.push(athlete_result)
            }
        }
    })

    let converted_default_starting_order = default_starting_order.map(athlete => {
        let starting_number = athlete_results.get(athlete.name + "_" + athlete.surname)?.starting_number || NaN
        return new AthleteHeightID(athlete.name, athlete.surname, athlete.age_group, starting_number)
    })


    if (active_athletes.length > 0) {
        if (current_height == Infinity) {
            current_height = min_start_height
        }

        let current_try = 1
        let current_try_order: AthleteHeightID[] = [];
        let next_try_order: AthleteHeightID[] = []
        let height_successful_jumped: AthleteHeightID[] = []
        let height_not_started: boolean = false;
        let new_in_height: Set<AthleteHeightID> = new Set();

        while (current_try <= 3) {
            converted_default_starting_order.forEach(athlete_id => {
                let athlete = athlete_results.get(athlete_id.full_name())
                if (athlete && athlete.still_active && athlete.current_height == current_height) {
                    if (athlete.current_try == current_try) {
                        current_try_order.push(athlete_id)
                    } else if (athlete.current_try == (current_try + 1)) {
                        next_try_order.push(athlete_id)
                    }
                    if (athlete.start_height == current_height) {
                        new_in_height.add(athlete_id)
                    }
                } else if (athlete && athlete.still_active && athlete.final_result && athlete.final_result >= current_height) {
                    height_successful_jumped.push(athlete_id)
                }
            })
            if (current_try_order.length > 0) {
                break
            } else {
                current_try_order = [];
                next_try_order = []
                current_try += 1
            }
        }
        if (current_try == 1 && next_try_order.length == 0) {
            height_not_started = true;
        }
        return {
            athlete_results: athlete_results,
            current_height: current_height,
            current_try: current_try,
            current_try_order: current_try_order,
            next_try_order: next_try_order,
            athletes_in_next_height: height_successful_jumped,
            all_athletes_start_height_set: all_athletes_start_height_set,
            default_starting_order: converted_default_starting_order,
            height_not_started: height_not_started,
            new_in_height: new_in_height
        }


    } else {
        let new_athletes_for_new_height: Set<AthleteHeightID> = new Set();
        return {
            athlete_results: athlete_results,
            current_height: 0,
            current_try: 0,
            current_try_order: [],
            next_try_order: [],
            athletes_in_next_height: [],
            all_athletes_start_height_set: all_athletes_start_height_set,
            default_starting_order: [],
            height_not_started: false,
            new_in_height: new_athletes_for_new_height
        }
    }
}


export function decode_athlete_tries(athlete_result: AthleteHeightResults): AthleteState {
    let jumped_height = 0
    let still_active = true

    let tries = athlete_result.tries?.split("-") || []

    tries.forEach((height_try, i) => {
        if (height_try.includes("O")) {
            jumped_height = (athlete_result.start_height || 0) + i * (athlete_result.height_increase || 0);
        } else if (height_try.length == 3 && height_try[2] == "X") {
            still_active = false
        }
    })

    let next_height = still_active ? Infinity : jumped_height
    let current_try = 1

    if (still_active) {
        let last_attempt = tries[tries.length - 1]
        if (last_attempt == undefined) { // not started
            next_height = athlete_result.start_height || 0;
        } else if (last_attempt.includes("O")) { // new height
            next_height = (athlete_result.start_height || 0) + tries.length * (athlete_result.height_increase || 0);
            current_try = 1
        } else if (last_attempt.length < 3) { // has already jumped height / currently jumping this height
            next_height = (athlete_result.start_height || 0) + (tries.length - 1) * (athlete_result.height_increase || 0);
            current_try = last_attempt.length + 1
        } else if (last_attempt.length == 3) { // already had three tries but skipped the last one
            next_height = (athlete_result.start_height || 0) + tries.length * (athlete_result.height_increase || 0);
            if (last_attempt == "///") { // skipped last height completely
                for (let i = tries.length - 2; i >= 0; i--) {
                    for (let j = tries[i].length - 1; j >= 0; j--) {
                        if (tries[i][j] == "X") {
                            current_try = j + 2
                            break
                        } else if (tries[i][j] == "O") {
                            current_try = 1
                            break
                        }
                    }
                }
            } else {
                for (let i = last_attempt.length - 1; i >= 0; i--) {
                    if (last_attempt[i] == "X") {
                        current_try = i + 2
                        break
                    } else if (last_attempt[i] == "O") {
                        current_try = 1
                        break
                    }
                }
            }
        } else {
            alert("Error loading athlete result")
        }
    }

    return {
        jumped_height: jumped_height,
        still_active: still_active,
        next_height: next_height,
        current_try: current_try
    }

}