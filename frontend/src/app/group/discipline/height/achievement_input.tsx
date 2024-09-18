import { useContext, useState } from "react";
import { AthleteResults } from "./height_discipline";
import { AthleteHeightID, AthleteHeightResults, AthleteID } from "@/app/lib/interfaces";
import { get_tries_for_height } from "./athlete_overview";
import AthleteEditPopup from "../athlete_edit_popup";

export function HeightInput({ athlete, save_try, skip_try }:
                                {
                                    athlete: AthleteHeightID,
                                    save_try: (athlete: AthleteHeightResults, new_value: string, athlete_still_active: boolean, skip_error: boolean) => void,
                                    skip_try: (athlete: AthleteHeightResults, new_value: string, athlete_still_active: boolean) => void
                                }) {
    const { state } = useContext(AthleteResults)
    const [showAthleteEdit, setShowAthleteEdit] = useState(false)
    const string_html_entity_map = new Map()
    string_html_entity_map.set("O", <span>&#9989;</span>)
    string_html_entity_map.set("X", <span>&#10060;</span>)
    string_html_entity_map.set("/", <span>--</span>)

    const athlete_result = state.results.get(athlete.full_name())
    if (athlete_result) {
        const height_tries = get_tries_for_height(athlete_result, state.current_height)

        const handle_try_update = function (value: string) {
            let new_try_string = update_try_string_with_new_value(value, athlete_result, state.current_height, state.current_try)
            save_try(athlete_result, new_try_string, true, false)
        }

        const handle_surrender = function () {
            let new_try_string = update_try_string_with_surrender(athlete_result, state.current_height)
            skip_try(athlete_result, new_try_string, false)
        }

        const handle_height_skip = function () {
            let new_try_string = update_try_string_with_skip(athlete_result, state.current_height, state.current_try)
            skip_try(athlete_result, new_try_string, true)
        }

        return (
            <div className="grid grid-rows-9 h-full w-full z-50 p-2 bg-slate-400 shadow-lg border rounded-md select-none">
                <div className="flex flex-row items-center justify-between text-xl sm:text-4xl p-2 bg-slate-700 text-slate-100 rounded-md">
                    <div onClick={_ => setShowAthleteEdit(true)} className="flex hover:cursor-pointer active:text-slate-400 fill-slate-100 active:fill-slate-400">
                        <div>
                            {athlete.name} {athlete.surname}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" className="fit pl-2 h-6 fill-inherit">
                            <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h274.9c-2.4-6.8-3.4-14-2.6-21.3l6.8-60.9 1.2-11.1 7.9-7.9 77.3-77.3c-24.5-27.7-60-45.5-99.9-45.5zm45.3 145.3l-6.8 61c-1.1 10.2 7.5 18.8 17.6 17.6l60.9-6.8 137.9-137.9-71.7-71.7-137.9 137.8zM633 268.9L595.1 231c-9.3-9.3-24.5-9.3-33.8 0l-37.8 37.8-4.1 4.1 71.8 71.7 41.8-41.8c9.3-9.4 9.3-24.5 0-33.9z" />
                        </svg>
                    </div>
                    {showAthleteEdit &&
                        <AthleteEditPopup
                            athlete={athlete}
                            onclose={() => { setShowAthleteEdit(false) }}
                            skipTry={() => {
                                handle_height_skip()
                            }}
                            skipDiscipline={handle_surrender}
                        ></AthleteEditPopup>
                    }
                    <div>{athlete_result?.final_result} cm</div>
                </div>
                <div className="flex items-center text-lg font-bold"><span>Aktuelle Höhe: {state.current_height}cm</span></div>
                <div className="row-span-5">
                    <div className="grid grid-rows-3 h-full">
                        {Array.from(Array(state.current_try).keys()).map(try_number => {
                            try_number += 1
                            if (try_number < state.current_try) {
                                return (
                                    <div key={try_number}>
                                        <div className="text-lg underline">{try_number}. Versuch</div>
                                        <div className="grid grid-cols-1">
                                            <div className="p-3 border text-center">{string_html_entity_map.get(height_tries[try_number - 1])}</div>
                                        </div>
                                    </div>
                                )
                            } else {
                                return (
                                    <div key={try_number}>
                                        <div className="text-lg underline">{try_number}. Versuch</div>
                                        <div className="grid grid-cols-2">
                                            <div className="rounded-md shadow-lg m-2 p-3 border text-center hover:cursor-pointer bg-green-200  bg-opacity-40 active:bg-opacity-100" onClick={() => handle_try_update("O")}>&#9989;</div>
                                            <div className="rounded-md shadow-lg m-2 p-3 border text-center hover:cursor-pointer bg-red-200 bg-opacity-40 active:bg-opacity-100" onClick={() => handle_try_update("X")}>&#10060;</div>
                                        </div>
                                    </div>
                                )
                            }
                        })}
                    </div>

                </div>
                <div className="row-span-2">
                    <div className="flex justify-center items-center h-full">
                        <div className="w-4/5 flex items-center justify-between text-lg font-bold">
                            <span className="rounded-md shadow-lg border p-2 bg-red-400 bg-opacity-40 active:bg-opacity-100" onClick={handle_surrender}>Aufgabe</span>
                            <span className="rounded-md shadow-lg border p-2 bg-yellow-200 bg-opacity-40 active:bg-opacity-100" onClick={handle_height_skip}>Höhe auslassen</span>
                        </div>
                    </div>
                </div>

            </div>
        )
    } else {
        return (
            <div>Error loading athlete results</div>
        )
    }
}

function update_try_string_with_new_value(new_try_value: string, athlete_result: AthleteHeightResults, current_height: number, current_try: number): string {
    let all_tries_string = athlete_result.tries;
    let height_index_from_starting_height = (current_height - (athlete_result.start_height || 0)) / (athlete_result.height_increase || 1)

    if (all_tries_string) {
        let new_try_string = ""
        let all_tries_array = all_tries_string.split("-")
        if ((all_tries_array.length - 1) >= height_index_from_starting_height) { // currently the same try as the last stored
            let current_try_string = all_tries_array[height_index_from_starting_height]
            if (current_try_string.length < current_try) {
                for (let i = current_try_string.length; i < current_try - 1; i++) {
                    current_try_string += "/"
                }
                current_try_string += new_try_value
            } else {
                current_try_string = current_try_string.slice(0, current_try - 1) + new_try_value
            }
            all_tries_array[height_index_from_starting_height] = current_try_string
            new_try_string = all_tries_array.join("-")
        }
        else if ((all_tries_array.length - 1) < height_index_from_starting_height) { // currently a new try (higher height)
            let new_tries_strings: string[] = []
            Array.from(Array(height_index_from_starting_height - all_tries_array.length).keys()).map(try_number => {
                new_tries_strings.push("///")
            })

            let new_try_array = all_tries_array.concat(new_tries_strings)
            let current_try_string = ""
            for (let i = 0; i < current_try - 1; i++) {
                current_try_string += "/"
            }
            current_try_string += new_try_value
            new_try_array.push(current_try_string)

            new_try_string = new_try_array.join("-")
        }

        return new_try_string
    } else {
        // First try for this person in this competition
        let new_tries_strings: string[] = []

        let current_try_string = ""
        for (let i = 0; i < current_try - 1; i++) {
            current_try_string += "/"
        }
        current_try_string += new_try_value
        new_tries_strings.push(current_try_string)

        return new_tries_strings.join("-")
    }
}

/// Function to fill the try string of the current height with / and finally a X
function update_try_string_with_surrender(athlete_result: AthleteHeightResults, current_height: number): string {
    let all_tries_string = athlete_result.tries;
    let height_index_from_starting_height = (current_height - (athlete_result.start_height || 0)) / (athlete_result.height_increase || 1)

    if (all_tries_string) {
        let new_try_string = ""
        let all_tries_array = all_tries_string.split("-")
        if ((all_tries_array.length - 1) >= height_index_from_starting_height) { // currently the same try as the last stored
            let current_try_string = all_tries_array[height_index_from_starting_height]
            if (current_try_string.length < 3) {
                for (let i = current_try_string.length; i < 2; i++) {
                    current_try_string += "/"
                }
                current_try_string += "X"
            } else {
                current_try_string = current_try_string.slice(0, 3) + "X"
            }
            all_tries_array[height_index_from_starting_height] = current_try_string
            new_try_string = all_tries_array.join("-")
        }
        else if ((all_tries_array.length - 1) < height_index_from_starting_height) { // currently a new try (higher height)
            let new_tries_strings: string[] = []
            Array.from(Array(height_index_from_starting_height - all_tries_array.length).keys()).map(try_number => {
                new_tries_strings.push("///")
            })

            let new_try_array = all_tries_array.concat(new_tries_strings)
            let current_try_string = ""
            for (let i = 0; i < 2; i++) {
                current_try_string += "/"
            }
            current_try_string += "X"
            new_try_array.push(current_try_string)

            new_try_string = new_try_array.join("-")
        }

        return new_try_string
    } else {
        // First try for this person in this competition
        return "//X"
    }
}


/// Function to fill the try string of the current height with / and start next height with current try by filling with / until current try
function update_try_string_with_skip(athlete_result: AthleteHeightResults, current_height: number, current_try: number): string {
    let all_tries_string = athlete_result.tries;
    let height_index_from_starting_height = (current_height - (athlete_result.start_height || 0)) / (athlete_result.height_increase || 1)

    if (all_tries_string) {
        let new_try_string = ""
        let all_tries_array = all_tries_string.split("-")
        if ((all_tries_array.length - 1) >= height_index_from_starting_height) { // currently the same try as the last stored
            let current_try_string = all_tries_array[height_index_from_starting_height]

            if (current_try_string.length < 3) { // Fill current try with / 
                for (let i = current_try_string.length; i < 3; i++) {
                    current_try_string += "/"
                }
            }

            all_tries_array[height_index_from_starting_height] = current_try_string

            // Add skipped tries to next height
            all_tries_array.push("/".repeat(current_try - 1))

            new_try_string = all_tries_array.join("-")
        }
        else if ((all_tries_array.length - 1) < height_index_from_starting_height) { // currently a new try (higher height)
            let new_tries_strings: string[] = []
            Array.from(Array(height_index_from_starting_height - all_tries_array.length).keys()).map(try_number => {
                new_tries_strings.push("///")
            })
            let new_try_array = all_tries_array.concat(new_tries_strings)

            let current_try_string = "///"
            new_try_array.push(current_try_string)

            new_try_string = new_try_array.join("-")
        }

        return new_try_string
    } else {
        // First try for this person in this competition
        let new_tries_strings: string[] = []

        let current_try_string = "///"
        new_tries_strings.push(current_try_string)

        return new_tries_strings.join("-")
    }
}
