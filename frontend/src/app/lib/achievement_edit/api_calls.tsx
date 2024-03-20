import { AchievementValue, Athlete } from "../athlete_fetching";
import { AthleteDistanceResults, AthleteID, Discipline, StartingOrder } from "../interfaces";
import { convert_to_integral_fractional } from "../parsing";

export function saveStartingOrder(order: StartingOrder, group_name: string, callback_fn: (order: StartingOrder) => void) {
  fetch(`/api/change_starting_order?name=${group_name}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order)
  }).then(res => {
    if (res.ok) {
      callback_fn(order)
    } else {
      throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
    }
  }).catch(e => {
    alert(`Not updated: ${e}`)
  }
  )
}


export function get_group_achievements(group_name: string, callback_fn: (athletes: Athlete[]) => void) {
  fetch(`/api/group?name=${group_name}`)
    .then(res => {
      if (res.ok) {
        return res.json()
      } else {
        throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
      }
    })
    .then(res => {
      let athletes: Athlete[] = res.athletes
      callback_fn(athletes)
    })
    .catch(e => {
      alert(`Not updated: ${e}`)
    }
    )
}


export function save_distance_achievement(athlete: AthleteDistanceResults, callback_fn: () => void) {
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
  }


  fetch(`/api/achievement?name=${athlete.name}&surname=${athlete.surname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(achievement)
  }).then(res => {
    if (res.ok) {
      callback_fn()
    } else {
      update_distance_achievement(athlete, callback_fn)
    }
  }).catch(e => {
    alert(`Not updated: ${e}`)
  }
  )
}

function update_distance_achievement(athlete: AthleteDistanceResults, callback_fn: () => void) {
  let achievement = {
    "first_try": athlete.first_try,
    "second_try": athlete.second_try,
    "third_try": athlete.third_try,
  }

  fetch(`/api/achievement?athlete_name=${athlete.name}_${athlete.surname}&name=${athlete.discipline_name}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(achievement)
  }).then(res => {
    if (res.ok) {
      callback_fn()
    } else {
      throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
    }
  })
}