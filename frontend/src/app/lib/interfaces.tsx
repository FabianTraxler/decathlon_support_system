export interface Discipline {
    name: string,
    location: string,
    start_time: string,
    state: string,
    starting_order: StartingOrder | string
}

export interface StartingOrder {
    Track?: {
        name: string,
        athletes: AthleteID[]
    }[],
    Default?: AthleteID[]
}


export interface AthleteID {
    name: string,
    surname: string,
    starting_number: number,
    age_group: string
}

export interface AthleteDistanceResults extends AthleteID {
    discipline_name: string,
    discipline_unit: string,
    first_try?: number,
    second_try?: number,
    third_try?: number,
    best_try?: number
}

// TODO: Merge with Achievement Interface?
export interface AthleteHeightResults extends AthleteID {
    discipline_name: string,
    discipline_unit: string,
    tries?: string,
    start_height?: number,
    start_height_set: boolean,
    height_increase?: number,
    final_result?: number,
    still_active: boolean,
    current_height: number,
    current_try: number
}