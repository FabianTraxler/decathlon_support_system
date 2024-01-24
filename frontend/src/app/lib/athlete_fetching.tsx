export interface Athlete {
  name: string,
  surname: string,
  starting_number: number,
  birth_date: number,
  achievements: Map<string, Map<string, AchievementValue>>,
  total_points: number
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
