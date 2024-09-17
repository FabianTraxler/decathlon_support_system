import { Discipline } from "./interfaces";

export function finish_discipline(group_name: string, discipline: Discipline, callback_fn: (discipline: Discipline) => void) {
    let api_url = `/api/discipline_state?name=${group_name}`

    fetch(api_url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "name": discipline.name,
            "state": "Finished"
        })
    })
        .then(res => {
            if (res.ok) {
                callback_fn({
                    ...discipline,
                    state: "Finished"
                })
            } else {
                throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
            }
        })
        .catch((e) => {
            console.error(e)
            throw e
        })
}

export function reset_discipline(group_name: string, discipline: Discipline, callback_fn: (discipline: Discipline) => void) {
    let api_url = `/api/discipline_state?name=${group_name}`

    fetch(api_url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "name": discipline.name,
            "state": "BeforeStart"
        })
    })
        .then(res => {
            if (res.ok) {
                callback_fn({
                    ...discipline,
                    state: "BeforeStart"
                })
            } else {
                throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
            }
        })
        .catch((e) => {
            console.error(e)
            throw e
        })
}