export function convert_to_integral_fractional(number_string: string | undefined): { integral: number, fractional: number } | undefined {
    if (number_string) {
        let value = {
            "integral": -1,
            "fractional": 0
        }
        if (number_string.includes(".")) {
            value = {
                "integral": (Number.isNaN(parseInt(number_string.split(".")[0]))) ? -1 : parseInt(number_string.split(".")[0]),
                "fractional": parseInt(number_string.split(".")[1].padEnd(2, "0")) || 0
            }
        } else if (number_string.includes(",")) {
            value = {
                "integral": (Number.isNaN(parseInt(number_string.split(",")[0]))) ? -1 : parseInt(number_string.split(";")[0]),
                "fractional": parseInt(number_string.split(",")[1].padEnd(2, "0")) || 0
            }
        } else {
            value = {
                "integral": (Number.isNaN(parseInt(number_string))) ? -1 : parseInt(number_string),
                "fractional": 0
            }
        }
        return value
    }
    return undefined

}

export function convert_from_integral_fractional(integral_fraction: { integral: number, fractional: number }): number | string {
    let final_number = ""
    if (integral_fraction.integral == -1) {
        return "X"
    } else {
        final_number = integral_fraction.integral.toString() || ""
        final_number += "."
        final_number += integral_fraction.fractional.toString() || ""

        return parseFloat(final_number)
    }
}



export function convert_date(date_str: string): string {
    let date = new Date(date_str)
    let day = new Intl.DateTimeFormat("de-DE", { weekday: "long" }).format(date)
    let hour = date.getHours()
    let minute = date.getMinutes().toString()

    if (minute.length < 2) {
        minute = minute.padEnd(2, "0")
    }

    return day + ", " + hour + ":" + minute
}


export function convert_date_to_time(date_str: string): string {
    let date = new Date(date_str)
    let day = new Intl.DateTimeFormat("de-DE", { weekday: "long" }).format(date)
    let hour = date.getHours()
    let minute = date.getMinutes().toString()

    if (minute.length < 2) {
        minute = minute.padEnd(2, "0")
    }

    return hour + ":" + minute
}