export interface Athlete {
  name: string,
  surname: string,
  starting_number: number,
  birth_date: number,
  achievements: Map<string, AchievementValue>,
  total_points: number,
  gender: string,
  group_name?: string,
  competition_type: string,
  t_shirt?: string,
  paid?: boolean
}

export interface AchievementValue {
  Time?: TimeAchievement,
  Distance?: DistanceAchievement,
  Height?: HeightAchievement,
  athlete_name?: string
}

export interface TimeAchievement {
  final_result?: { integral: number, fractional: number },
  name: string,
  unit: string
}

export interface DistanceAchievement {
  final_result?: { integral: number, fractional: number },
  first_try?: { integral: number, fractional: number },
  second_try?: { integral: number, fractional: number },
  third_try?: { integral: number, fractional: number },
  name: string,
  unit: string
}

export interface HeightAchievement {
  final_result?: number,
  start_height?: number,
  height_increase?: number,
  tries?: string,
  name: string,
  unit: string
}


export function fetch_group_athletes(group_name: string, update_function: (athletes: Athlete[]) => void) {
  let api_url = `/api/group?name=${group_name}`

  fetch(api_url)
    .then(res => {
      if (res.ok) {
        return res.json()
      } else {
        throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
      }
    })
    .then(res => {
      update_function(res["athletes"])
    })
    .catch((e) => {
      console.error(e)
      update_function([])
    })
}

export function fetch_age_group_athletes(group_name: string, update_function: (athletes: Athlete[]) => void) {
  let age_identifier = group_name.replace("AK-", "");
  let api_url = `/api/age_group?age_identifier=${age_identifier}`

  fetch(api_url)
    .then(res => {
      if (res.ok) {
        return res.json()
      } else {
        throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
      }
    })
    .then(res => {
      update_function(res["athletes"])
    })
    .catch((e) => {
      console.error(e)
      update_function([])
    })
}

export function fetch_all_athletes(update_function: (athletes: Athlete[]) => void) {
  let api_url = `/api/athletes`

  fetch(api_url)
    .then(res => {
      if (res.ok) {
        return res.json()
      } else {
        throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
      }
    })
    .then(res => {
      let all_athletes: Athlete[] = [];

      Object.entries(res).map(([group_name, athletes]) => {
        let group_athletes: Athlete[] = athletes as Athlete[];

        group_athletes.map(athlete => {
          athlete.group_name = group_name
          all_athletes.push(athlete)
        })
      })
      update_function(all_athletes)
    })
    .catch((e) => {
      console.error(e)
      update_function([])
    })
}


export function sort_athletes(a: Athlete, b: Athlete, sort_query: { name: string, ascending: boolean }): number {
  var return_value = 0;
  switch (sort_query.name) {
    case "#":
      if (!a.starting_number) return_value = 1
      else if (!b.starting_number) return_value = -1
      else if (a.starting_number < b.starting_number) return_value = -1
      else if (a.starting_number > b.starting_number) return_value = 1
      else return_value = 0
      break
    case "Vorname":
      if (a.name < b.name) return_value = -1
      else if (a.name > b.name) return_value = 1
      else return_value = 0
      break
    case "JG":
      let keyA = new Date(a.birth_date * 1000)
      let keyB = new Date(b.birth_date * 1000)
      if (keyA < keyB) return_value = -1
      else if (keyA > keyB) return_value = 1
      else return_value = 0
      break;
    case "Nachname":
      if (a.surname < b.surname) return_value = -1
      else if (a.surname > b.surname) return_value = 1
      else return_value = 0
      break;
    case "Name":
      if (a.surname < b.surname) return_value = -1
      else if (a.surname > b.surname) return_value = 1
      else {
        if (a.name < b.name) return_value = -1
        else if (a.name > b.name) return_value = 1
        else return_value = 0
      }
      break;
    case "Summe":
      if (a.total_points < b.total_points) return_value = -1
      else if (a.total_points > b.total_points) return_value = 1
      else return_value = 0
      break;
    case "Gender":
        if (a.gender < b.gender) return_value = -1
        else if (a.gender > b.gender) return_value = 1
        else return_value = 0
        break;
    case "Gruppe":
      if (!a.group_name) return_value = 1
      else if (!b.group_name) return_value = -1
      else if (a.group_name < b.group_name) return_value = -1
      else if (a.group_name > b.group_name) return_value = 1
      else return_value = 0
      break;
    case "age_group":
      if (a.gender < b.gender) return_value = -1
      else if (a.gender > b.gender) return_value = 1
      else {
        if (a.birth_date < b.birth_date) return_value = 1
        else if (a.birth_date > b.birth_date) return_value = -1
        else return_value = 0
      }
      break;
    case "T-Shirt":
        if (!a.t_shirt) return_value = 1
        else if (!b.t_shirt) return_value = -1
        else if (a.t_shirt < b.t_shirt) return_value = -1
        else if (a.t_shirt > b.t_shirt) return_value = 1
        else return_value = 0
        break;
    case "Bezahlt":
        if (!a.paid) return_value = 1
        else if (!b.paid) return_value = -1
        else if (a.paid < b.paid) return_value = -1
        else if (a.paid > b.paid) return_value = 1
        else return_value = 0
        break;
    default:
      return_value = 0
      break;
  }

  if (return_value == 0) { // sort by starting number on equality and then on surname
    if (a.starting_number < b.starting_number) return_value = -1
    else if (a.starting_number > b.starting_number) return_value = 1
    else {
      if (a.surname < b.surname) return_value = -1
      else if (a.surname > b.surname) return_value = 1
      else return_value = 0
    }
  }

  return sort_query.ascending ? return_value : -1 * return_value;

}