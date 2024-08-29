import { useContext, useState } from "react";
import { AthleteResults, athlete_in_competition, decode_athlete_tries } from "./height_discipline";
import { AthleteHeightID, AthleteHeightResults, AthleteID } from "@/app/lib/interfaces";
import { update_height_achievement } from "@/app/lib/achievement_edit/api_calls";
import { HeightInput } from "./achievement_input";
import { NavigationContext } from "../../navigation";

export function HeightOrderOverview({ finish_discipline }: { finish_discipline: () => void }) {
    const { state, update_state } = useContext(AthleteResults)
    const [selectedAthlete, setSelectedAthlete] = useState<AthleteHeightID | undefined>()
    const navigation = useContext(NavigationContext)

    const save_athlete_try = function (athlete: AthleteHeightResults, new_value: string, athlete_still_active: boolean) {
        let selected_athlete = state.current_order[0]
        navigation.history.push({
            name: "Save Achievement",
            reset_function: () => {
                setSelectedAthlete(selected_athlete)
                update_state({ ...state })
            }
        })

        if (athlete) {
            athlete.tries = new_value
            let current_athlete_state = decode_athlete_tries(athlete)
            athlete.final_result = current_athlete_state.jumped_height
            
            let update_result = { ...athlete, full_name: () => athlete.full_name() }
            update_height_achievement(update_result, () => {
                let new_results = state.results
                if (athlete) {
                    new_results.set(athlete.full_name(), athlete)
                }
                let height_try_result = get_try_result(athlete, state.current_height, state.current_try)
                let try_successful = height_try_result != "X"
                try_completed(new_results, try_successful, athlete_still_active, new AthleteHeightID(athlete.name, athlete.surname, athlete.age_group, athlete.starting_number || NaN))
                //setTimeout(() => try_completed(new_results, try_successful, athlete), 200)
            }, true)
        } else {
            alert("Error while saving achievement")
        }
    }

    const handle_skip = function(athlete: AthleteHeightResults, new_value: string, athlete_still_active: boolean){
        let old_state = { ...state }
        save_athlete_try(athlete, new_value, athlete_still_active)
        if (old_state.current_order.length == state.current_order.length){
            try_completed(state.results, false, athlete_still_active, new AthleteHeightID(athlete.name, athlete.surname, athlete.age_group, athlete.starting_number || NaN))
        }
    }

    const increase_height = function (current_height: number, athletes_in_next_height: Set<string>) {
        // Increase Height + Check if new people join the competition + check if anyone still in competition
        let new_height = current_height + state.height_increase

        let athletes_for_next_height: AthleteHeightID[] = []
        let athletes_for_second_try: AthleteHeightID[] = []
        let athletes_for_third_try: AthleteHeightID[] = []

        let new_athletes: Set<AthleteHeightID> = new Set();
        let athletes_not_yet_in_competition: AthleteHeightID[] = []

        state.default_order.forEach((athlete) => {
            let athlete_result = state.results.get(athlete.full_name())
            if (athlete_result) {
                let athlete_state = decode_athlete_tries(athlete_result)
                if (athlete_state.still_active && athlete_state.next_height == new_height){
                    if (!athletes_in_next_height.has(athlete.full_name()) && athlete_state.current_try == 1) {
                        new_athletes.add(athlete)
                    }

                    if (athlete_state.current_try == 1){
                        athletes_for_next_height.push(athlete)
                    } else if (athlete_state.current_try == 2){
                        athletes_for_second_try.push(athlete)
                    } else if (athlete_state.current_try == 3){
                        athletes_for_third_try.push(athlete)
                    }
                }
                if ((athlete_result.start_height || 0) > new_height || athlete_result.current_height > new_height) {
                    athletes_not_yet_in_competition.push(athlete)
                }
            }
        })

        if (athletes_for_next_height.length == 0 && athletes_for_second_try.length == 0 && athletes_for_third_try.length == 0) {
            if (athletes_not_yet_in_competition.length == 0) {
                finish_discipline()
            } else {
                increase_height(new_height, new Set())
            }
        } else {
            let current_try = 1;
            if(athletes_for_next_height.length > 0) {
                current_try = 1
            } else if(athletes_for_second_try.length > 0){
                current_try = 2
                athletes_for_next_height = athletes_for_second_try
                athletes_for_second_try = []
                athletes_for_third_try = []
            } else if (athletes_for_third_try.length > 0){
                current_try = 3
                athletes_for_next_height = athletes_for_third_try
                athletes_for_second_try = []
                athletes_for_third_try = []
            }
            update_state({
                ...state,
                current_height: new_height,
                discipline_progress_state: "new_height",
                current_try: current_try,
                current_order: athletes_for_next_height,
                athletes_in_next_try: athletes_for_second_try,
                athletes_in_next_next_try: athletes_for_third_try,
                new_athletes_for_new_height: new_athletes
            })
        }
    }

    const try_completed = function(new_results: Map<string, AthleteHeightResults>, try_successful: boolean, athlete_still_active: boolean, athlete: AthleteHeightID) {
        let athletes_in_next_try = [...state.athletes_in_next_try]
        let athletes_in_next_height = [...state.athletes_in_next_height]

        if (try_successful) {
            athletes_in_next_height.push(athlete)
        } else  if (athlete_still_active){
            athletes_in_next_try.push(athlete)
        }
        if (state.current_order.length <= 1) {
            if (state.current_try == 3) {
                // Increase Height + Check if new people join the competition + check if anyone still in competition
                increase_height(state.current_height, new Set(athletes_in_next_height.map(athlete => athlete.full_name())))
            } else {
                // increase try
                if (athletes_in_next_try.length == 0){
                    if(state.athletes_in_next_next_try.length == 0){ // No athletes in this height
                        increase_height(state.current_height, new Set(athletes_in_next_height.map(athlete => athlete.full_name())))
                    }else { // athletes only for last try
                        update_state({
                            ...state,
                            current_try: state.current_try + 2,
                            current_order: state.athletes_in_next_next_try,
                            athletes_in_next_height: athletes_in_next_height,
                            athletes_in_next_try: [],
                            athletes_in_next_next_try: [],
                            results: new_results
                        })
                    }
                } else { // athletes in next try
                    update_state({
                        ...state,
                        current_try: state.current_try + 1,
                        current_order: athletes_in_next_try,
                        athletes_in_next_height: athletes_in_next_height,
                        athletes_in_next_try: state.athletes_in_next_next_try,
                        athletes_in_next_next_try: [],
                        results: new_results
                    })
                }
                setSelectedAthlete(undefined)
            }
        } else {

            update_state({
                ...state,
                current_order: state.current_order.slice(1),
                results: new_results,
                athletes_in_next_try: athletes_in_next_try,
                athletes_in_next_height: athletes_in_next_height
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

    if (state.current_order.length == 0){
        increase_height(state.current_height, new Set())
    }

    if (selectedAthlete) {
        return (
            <HeightInput athlete={selectedAthlete} save_try={save_athlete_try} skip_try={handle_skip}></HeightInput>
        )
    } else {
        let first_athlete = state.current_order[0]
        if (first_athlete == undefined) {
            return (<div>Error</div>)
        }
        return (
            <div className="grid grid-rows-7 h-full">
                <div>
                    <div className="flex  justify-between font-bold text-2xl p-2">
                        <div className="underline">
                            Aktuelle Höhe:
                        </div>
                        <div>
                            {state.current_height}cm
                        </div> </div>
                </div>
                <div className="row-span-2 grid grid-rows-5">
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
                        <div className="col-span-3 flex items-center justify-center border bg-green-200"><span className="text-center">{state.current_order[0].name} {state.current_order[0].surname}</span></div>
                        <div className="flex items-center justify-center border bg-green-200"><span>&gt;</span></div>
                    </div>
                </div>
                <div className="row-span-4">
                    {state.current_order.length > 1 &&
                        <div>
                            <div className="font-bold underline text-xl">In Vorbereitung {state.current_try}. Versuch</div>
                            {
                                state.current_order.slice(1, 5).map((athlete => {
                                    return (
                                        <div key={athlete.starting_number} className=" grid grid-cols-5 text-lg sm:text-xl">
                                            <div className="flex items-center justify-center border pt-2 pb-2"><span>{athlete.starting_number}</span></div>
                                            <div className="col-span-3 flex items-center justify-center border pt-2 pb-2"><span className="text-center">{athlete.name} {athlete.surname}</span></div>
                                            <div className="flex items-center justify-center border pt-2 pb-2"><span></span></div>
                                        </div>
                                    )
                                }))
                            }
                        </div>
                    }

                    {(state.current_order.length < 5 && state.current_try < 3 && state.athletes_in_next_try.length > 0) &&
                        <div>
                            <div className="font-bold underline text-xl">In Vorbereitung {state.current_try + 1}. Versuch:</div>
                            {
                                state.athletes_in_next_try.slice(0, 5 - state.current_order.length).map((athlete => {
                                    return (
                                        <div key={athlete.starting_number} className=" grid grid-cols-5 text-lg sm:text-xl">
                                            <div className="flex items-center justify-center border pt-2 pb-2"><span>{athlete.starting_number}</span></div>
                                            <div className="col-span-3 flex items-center justify-center border pt-2 pb-2"><span className="text-center">{athlete.name} {athlete.surname}</span></div>
                                            <div className="flex items-center justify-center border pt-2 pb-2"><span></span></div>
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

function get_try_result(athlete_result: AthleteHeightResults, current_height: number, current_try: number): string {
    let height_tries = get_tries_for_height(athlete_result, current_height)
    if (height_tries.length == 3){
        return height_tries[2] // return last attempt
    } else {
        return height_tries[current_try - 1]
    }
}

export function get_tries_for_height(athlete_result: AthleteHeightResults, current_height: number): string[] {
    let tries = athlete_result.tries?.split("-")

    let current_height_index = (current_height - (athlete_result.start_height || 0)) / (athlete_result.height_increase || 1)

    if (tries) {
        let current_height_tries_string = tries[current_height_index]
        let current_tries = []
        if (current_height_tries_string){
            for (let i = 0; i < current_height_tries_string.length; i++) {
                current_tries.push(current_height_tries_string[i])
            }
        }
        return current_tries
    } else {
        return []
    }
}
