import { AchievementValue, Athlete, HeightAchievement } from "../athlete_fetching";
import { AthleteDistanceResults, AthleteHeightResults, AthleteID, Discipline, StartingOrder } from "../interfaces";
import { convert_to_integral_fractional } from "../parsing";

export async function saveStartingOrder(order: StartingOrder, group_name: string, callback_fn: (order: StartingOrder) => void) {
  await fetch(`/api/change_starting_order?name=${group_name}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order)
  }).then(res => {
    if (res.ok) {
      callback_fn(order)
    } else {
      return Promise.reject(new Error(`Network response was not ok: ${res.status} - ${res.statusText}`));
    }
  }).catch(e => {
    return Promise.reject(`Not updated: ${e}`)
  }
  )
}


export async function get_group_achievements(group_name: string, callback_fn: (athletes: Athlete[]) => void) {
  await fetch(`/api/group?name=${group_name}`)
    .then(res => {
      if (res.ok) {
        return res.json()
      } else {
        return Promise.reject(new Error(`Network response was not ok: ${res.status} - ${res.statusText}`));
      }
    })
    .then(res => {
      let athletes: Athlete[] = res.athletes
      callback_fn(athletes)
    })
    .catch(e => {
      Promise.reject(`Not updated: ${e}`)
    }
    )
}


export async function save_distance_achievement(athlete: AthleteDistanceResults, callback_fn: () => void) {
  let achievement: AchievementValue = {
    "Distance": {
      "name": athlete.discipline_name,
      "unit": athlete.discipline_unit
    }
  }
  if (achievement.Distance) {
    if (athlete.first_try) {
      achievement["Distance"]["first_try"] = convert_to_integral_fractional(athlete.first_try?.toString())
    }
    if (athlete.second_try) {
      achievement["Distance"]["second_try"] = convert_to_integral_fractional(athlete.second_try?.toString())
    }
    if (athlete.third_try) {
      achievement["Distance"]["third_try"] = convert_to_integral_fractional(athlete.third_try?.toString())
    }
    if (athlete.best_try) {
      achievement["Distance"]["final_result"] = convert_to_integral_fractional(athlete.best_try?.toString())
    }
  }


  await fetch(`/api/achievement?name=${athlete.name}&surname=${athlete.surname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(achievement)
  }).then(async function(res) {
    if (res.ok) {
      callback_fn()
    } else {
      return await update_distance_achievement(athlete, callback_fn)
    }
  }).catch(e => {
    return Promise.reject(new Error(`Not updated: ${e}`))
  }
  )
}

async function update_distance_achievement(athlete: AthleteDistanceResults, callback_fn: () => void) {
  let achievement = {
    "first_try": athlete.first_try,
    "second_try": athlete.second_try,
    "third_try": athlete.third_try,
  }

  await fetch(`/api/achievement?athlete_name=${athlete.name}_${athlete.surname}&name=${athlete.discipline_name}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(achievement)
  }).then(res => {
    if (res.ok) {
      callback_fn()
    } else {
      return Promise.reject(new Error(`Network response was not ok: ${res.status} - ${res.statusText}`));
    }
  })
}

export async function skip_distance_discipline(athlete?: AthleteDistanceResults): Promise<boolean> {
  if (athlete) {
    if (!athlete.first_try) {
      athlete.first_try = -1
    }
    if (!athlete.second_try) {
      athlete.second_try = -1
    }
    if (!athlete.third_try) {
      athlete.third_try = -1
    }
    if (!athlete.best_try) {
      athlete.best_try = -1
    }
    save_distance_achievement(athlete, () => { })
    .catch((e) => {
      console.log(e)
    })
    return true
  }
  console.error("No athlete selected")
  return false
}


export async function save_height_achievement(athlete_height_result: AthleteHeightResults, callback_fn: () => void, after_removed: boolean = false) {
  let achievement: AchievementValue = {
    "Height": {
      "name": athlete_height_result.discipline_name,
      "unit": athlete_height_result.discipline_unit,
    }
  }
  if (achievement["Height"]) {
    achievement["Height"] = update_height_achievement_dict(achievement["Height"], athlete_height_result)
  }


  await fetch(`/api/achievement?name=${athlete_height_result.name}&surname=${athlete_height_result.surname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(achievement)
  }).then(async function(res) {
    if (res.ok) {
      callback_fn()
    } else {
      if (athlete_height_result.tries == "" && !after_removed) {
        // Delete current achievement and create new one
        return await delete_and_create_new_height_achievement(athlete_height_result, callback_fn)
      } else {
        return await update_height_achievement(athlete_height_result, callback_fn)
      }
    }
  }).catch(e => {
    return Promise.reject(new Error(`Not updated: ${e}`))
  }
  )
}

export async function delete_and_create_new_height_achievement(athlete_height_result: AthleteHeightResults, callback_fn: () => void) {
  let athlete_name = `${athlete_height_result.name}_${athlete_height_result.surname}`
  await fetch(`/api/achievement?name=${athlete_height_result.discipline_name}&athlete_name=${athlete_name}`, {
    method: "DELETE",
  }).then(async function(res) {
    if (res.ok) {
      return await save_height_achievement(athlete_height_result, callback_fn, true)
    } else {
      return Promise.reject(new Error(`Network response was not ok: ${res.status} - ${res.statusText}`));
    }
  }).catch(e => {
    return Promise.reject(new Error(`Not updated: ${e}`))
  }
  )
}


export async function update_height_achievement(athlete_height_result: AthleteHeightResults, callback_fn: () => void, update_only_tries: boolean = false) {
  let achievement: HeightAchievement = {
    "name": athlete_height_result.discipline_name,
    "unit": athlete_height_result.discipline_unit,
  }

  if (update_only_tries) {
    achievement.tries = athlete_height_result.tries
  } else {
    achievement = update_height_achievement_dict(achievement, athlete_height_result)
  }


  await fetch(`/api/achievement?athlete_name=${athlete_height_result.name}_${athlete_height_result.surname}&name=${athlete_height_result.discipline_name}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(achievement)
  }).then(res => {
    if (res.ok) {
      callback_fn()
    } else {
      return Promise.reject(new Error(`Network response was not ok: ${res.status} - ${res.statusText}`));
    }
  }).catch(e => {
    return Promise.reject(new Error(`Not updated: ${e}`))
  })
}


function update_height_achievement_dict(achievement_dict: HeightAchievement, athlete: AthleteHeightResults): HeightAchievement {
  if (athlete.start_height) {
    achievement_dict["start_height"] = athlete.start_height
  }
  if (athlete.height_increase) {
    achievement_dict["height_increase"] = athlete.height_increase
  }
  if (athlete.tries != undefined) {
    achievement_dict["tries"] = athlete.tries
  }
  if (athlete.final_result) {
    achievement_dict["final_result"] = athlete.final_result
  }

  return achievement_dict
}
