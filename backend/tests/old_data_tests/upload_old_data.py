"""Script to upload old results into DB for testing Purposes"""
import time

import pandas as pd
from argparse import Namespace, ArgumentParser, BooleanOptionalAction
from typing import Dict, Union, List, Tuple
import requests
from datetime import datetime, timezone
import numpy as np
import json
from tqdm import tqdm


URL = "https://app.jedermannzehnkampf.at"

def parse_args() -> Namespace:
    parser = ArgumentParser(
        prog="Insertion Tool for old result in Excel"
    )
    parser.add_argument("-f", "--filename", default="Adressen.xls")
    parser.add_argument("-d", "--decathlon", action=BooleanOptionalAction, default=True)
    parser.add_argument("-k", "--kids", action=BooleanOptionalAction, default=False)
    parser.add_argument("-y", "--youth", action=BooleanOptionalAction, default=False)

    parser.add_argument("-a", "--achievements", action=BooleanOptionalAction, default=False)
    parser.add_argument("-s", "--starting_number", action=BooleanOptionalAction, default=False)
    parser.add_argument("-t", "--timetable", action=BooleanOptionalAction, default=True)
    parser.add_argument("--timetable_file", default="timetable.json")

    parser.add_argument("-p", "--in_progress", action=BooleanOptionalAction, default=False)

    return parser.parse_args()


def read_excel_file(filename: str) -> Dict[str, pd.DataFrame]:
    decathlon_sheet = pd.read_excel(filename, sheet_name="Adressen")
    decathlon_sheet = decathlon_sheet.dropna(subset=["Name"])

    kids_sheet = pd.read_excel(filename, sheet_name="Kinder - 3 - Kampf")
    kids_sheet = kids_sheet.dropna(subset=["Name"])

    return {"decathlon": decathlon_sheet, "kids": kids_sheet}


def upload_decathlon_results(results: pd.DataFrame, config: Dict, skipped_disciplines: Dict = {}):
    if not config["timetable"]:
        groups = results["GRP"].unique()
        for group in groups:
            if group is None: continue
            group_name = f"Gruppe {group}"
            if not upload_group(group_name, "Decathlon"):
                print(f"{group_name} not uploaded")

    disciplines = [('100m', "100 Meter Lauf", "Time"),
                   ('Weit', "Weitsprung", "Distance"),
                   ('Kugel', "Kugelstoß", "Distance"),
                   ('Hoch', "Hochsprung", "Height"),
                   ('400 m', "400 Meter Lauf", "Time"),
                   ('Hürden', "110 Meter Hürden", "Time"),
                   ('Diskus', "Diskuswurf", "Distance"),
                   ('Stab', "Stabhochsprung", "Height"),
                   ('Speer', "Speerwurf", "Distance"),
                   (('1500m', '1500sec'), "1500 Meter Lauf", "Time")]

    for _, row in tqdm(results.iterrows(), total=len(results)):
        if row["GRP"] in ["J5K", "J7K"]:
            continue
        if isinstance(row["GRP"], int):
            group_name = f"Gruppe {row['GRP']}"
        else:
            group_name = row["GRP"]
        group_skipped_disciplines = skipped_disciplines.get(group_name, [])

        if (not isinstance(row["Name"], str) or row["Name"].strip() == "") and (not isinstance(row["NAME"], str) or row["NAME"].strip() == ""):
            continue
        achievements = {}
        for (short_name, long_name, discipline_type) in disciplines:
            if long_name in group_skipped_disciplines: continue  # skip achievement
            discipline = {}
            if isinstance(short_name, str):
                final_result = float(row[short_name])
            else:
                final_result = round(row[short_name[0]] * 60 + row[short_name[1]], 2)
            if np.isnan(final_result):
                final_result = {"integral": -1, "fractional": 0}
            if discipline_type == "Time":
                discipline[discipline_type] = {
                    "name": long_name,
                    "final_result": final_result,
                    "unit": "s"
                }
            elif discipline_type == "Distance":
                discipline[discipline_type] = {
                    "name": long_name,
                    "first_try": {"integral": -1, "fractional": 0},
                    "second_try": {"integral": -1, "fractional": 0},
                    "third_try": {"integral": -1, "fractional": 0},
                    "final_result": final_result,
                    "unit": "m"
                }
            elif discipline_type == "Height":
                if isinstance(final_result, float):
                    final_result = int(round(final_result * 100, 0))
                elif isinstance(final_result, Dict):
                    final_result = -1
                discipline[discipline_type] = {
                    "name": long_name,
                    "tries": "",
                    "start_height": -1,
                    "height_increase": -1,
                    "final_result": final_result,
                    "unit": "cm"
                }
            achievements[long_name] = discipline

        if isinstance(row["GBDT"], datetime):
            birth_day = row["GBDT"].replace(tzinfo=timezone.utc)
            birthday_timestamp = int(datetime.timestamp(birth_day))
        elif isinstance(row["GBDT"], str):
            datetime_str = row["GBDT"].strip().split(" ")[0]
            if "." in datetime_str:
                birth_day = datetime.strptime(datetime_str, '%d.%m.%Y').replace(tzinfo=timezone.utc)
            elif "-" in datetime_str:
                birth_day = datetime.strptime(datetime_str, '%Y-%m-%d').replace(tzinfo=timezone.utc)
            birthday_timestamp = int(datetime.timestamp(birth_day))
        else:
            birth_day = datetime.strptime("1.1.1990", '%d.%m.%Y')
            birthday_timestamp = int(datetime.timestamp(birth_day))
        group_name = f"Gruppe {row['GRP']}"

        gender = row["Sex2"]
        if isinstance(gender, str):
            gender = gender.upper()
        else:
            gender = "Staffel"

        if config["starting_number"] and len(group_skipped_disciplines) != 10:
            starting_number = row["NR"]
            try:
                int(starting_number)
            except:
                starting_number = None
        else:
            starting_number = None

        upload_success = upload_athlete(row["VORNAME"],
                                        row["NAME"],
                                        starting_number,
                                        birthday_timestamp,
                                        gender,
                                        achievements,
                                        group_name,
                                        "Decathlon",
                                        config)
        time.sleep(0.1)

        if not upload_success:
            print(f"Athlete: {row['VORNAME']} not uploaded")
    pass


def upload_youth_results(results: pd.DataFrame, config: Dict, skipped_disciplines: Dict = {}):
    if not config["timetable"]:
        if not upload_group("U14", "Pentathlon"):
            print(f"U14 not uploaded")
        if not upload_group("U16", "Heptathlon"):
            print(f"U16 not uploaded")

    disciplines = {
        "Pentathlon": [('100m', "60 Meter Lauf", "Time"),
                       ('Hoch', "Hochsprung", "Height"),
                       ('Hürden', "60 Meter Hürden", "Time"),
                       ('Speer', "Vortex", "Distance"),
                       (('1500m', '1500sec'), "1200 Meter Cross Lauf", "Time")],
        "Heptathlon": [('100m', "100 Meter Lauf", "Time"),
                       ('Hoch', "Hochsprung", "Height"),
                       ('Hürden', "60 Meter Hürden", "Time"),
                       ('Speer', "Speerwurf", "Distance"),
                       (('1500m', '1500sec'), "1000 Meter Lauf", "Time"),
                       ('Weit', "Weitsprung", "Distance"),
                       ('Kugel', "Kugelstoß", "Distance")],
    }

    for _, row in tqdm(results.iterrows(), total=len(results)):
        if row["GRP"] == "J5K":
            group_name = "U14"
            competition_type = "Pentathlon"
        elif row["GRP"] == "J7K":
            group_name = "U16"
            competition_type = "Heptathlon"
        else:
            continue

        group_skipped_disciplines = skipped_disciplines.get(group_name, [])

        if not isinstance(row["Name"], str) and np.isnan(row["Name"]):
            continue
        elif not isinstance(row["NAME"], str) or row["NAME"].strip() == "":
            continue
        
        achievements = {}
        for (short_name, long_name, discipline_type) in disciplines[competition_type]:
            if long_name in group_skipped_disciplines: continue  # skip achievement
            discipline = {}
            if isinstance(short_name, str):
                final_result = row[short_name]
            else:
                final_result = round(row[short_name[0]] * 60 + row[short_name[1]], 2)
            if np.isnan(final_result):
                final_result = {"integral": -1, "fractional": 0}
            if discipline_type == "Time":
                discipline[discipline_type] = {
                    "name": long_name,
                    "final_result": final_result,
                    "unit": "s"
                }
            elif discipline_type == "Distance":
                discipline[discipline_type] = {
                    "name": long_name,
                    "first_try": {"integral": -1, "fractional": 0},
                    "second_try": {"integral": -1, "fractional": 0},
                    "third_try": {"integral": -1, "fractional": 0},
                    "final_result": final_result,
                    "unit": "m"
                }
            elif discipline_type == "Height":
                if isinstance(final_result, float):
                    final_result = int(final_result * 100)
                elif isinstance(final_result, Dict):
                    final_result = -1
                discipline[discipline_type] = {
                    "name": long_name,
                    "tries": "",
                    "start_height": -1,
                    "height_increase": -1,
                    "final_result": final_result,
                    "unit": "cm"
                }
            achievements[long_name] = discipline

        if isinstance(row["GBDT"], datetime):
            birth_day = row["GBDT"]
            birthday_timestamp = int(datetime.timestamp(birth_day) + 3.156e+7) # Add one year to match current year
        elif isinstance(row["GBDT"], str):
            datetime_str = row["GBDT"].strip().split(" ")[0]
            if "." in datetime_str:
                birth_day = datetime.strptime(datetime_str, '%d.%m.%Y')
            elif "-" in datetime_str:
                birth_day = datetime.strptime(datetime_str, '%Y-%m-%d')
            else:
                birth_day = ""
            birthday_timestamp = int(datetime.timestamp(birth_day) + 3.156e+7) # Add one year to match current year
        else:
            birthday_timestamp = None

        gender = row["Sex2"]
        if isinstance(gender, str):
            gender = gender.upper()
        else:
            gender = "Staffel"

        if config["starting_number"]:
            starting_number = row["NR"]
            try:
                int(starting_number)
            except:
                starting_number = None
        else:
            starting_number = None

        upload_success = upload_athlete(row["VORNAME"],
                                        row["NAME"],
                                        starting_number,
                                        birthday_timestamp,
                                        gender,
                                        achievements,
                                        group_name,
                                        competition_type,
                                        config)
        time.sleep(0.1)

        if not upload_success:
            print(f"Athlete: {row['VORNAME']} not uploaded")
    pass


def upload_kids_results(results: pd.DataFrame, config: Dict, skipped_disciplines: Dict = {}):
    if not config["timetable"]:
        group_names = ["U12", "U10", "U8", "U4/U6"]
        for group_name in group_names:
            if not upload_group(group_name, "Triathlon"):
                print(f"{group_name} not uploaded")

    disciplines = [('60 Meter', "60 Meter Lauf", "Time"),
                   ('Weit', "Weitsprung", "Distance"),
                   ('Schlagball', "Schlagball", "Distance")]

    for _, row in tqdm(results.iterrows(), total=len(results)):
        if not isinstance(row["Nummer"], int) and not isinstance(row["Nummer"], float):
            continue

        group_name = row["Klasse"]
        if group_name in ["U4", "U6"]:
            group_name = "U4/U6"

        group_skipped_disciplines = skipped_disciplines.get(group_name, [])

        if not isinstance(row["Name"], str) and np.isnan(row["Name"]):
            continue
        achievements = {}
        for (short_name, long_name, discipline_type) in disciplines:
            if long_name in group_skipped_disciplines: continue  # skip achievement
            discipline = {}
            if isinstance(short_name, str):
                final_result = float(row[short_name])
            else:
                final_result = round(row[short_name[0]] * 60 + row[short_name[1]], 2)
            if np.isnan(final_result):
                final_result = {"integral": -1, "fractional": 0}

            if discipline_type == "Time":
                discipline[discipline_type] = {
                    "name": long_name,
                    "final_result": final_result,
                    "unit": "s"
                }
            elif discipline_type == "Distance":
                discipline[discipline_type] = {
                    "name": long_name,
                    "first_try": {"integral": -1, "fractional": 0},
                    "second_try": {"integral": -1, "fractional": 0},
                    "third_try": {"integral": -1, "fractional": 0},
                    "final_result": final_result,
                    "unit": "m"
                }
            elif discipline_type == "Height":
                if isinstance(final_result, float):
                    final_result = int(final_result * 100)
                elif isinstance(final_result, Dict):
                    final_result = -1
                discipline[discipline_type] = {
                    "name": long_name,
                    "tries": "",
                    "start_height": -1,
                    "height_increase": -1,
                    "final_result": final_result,
                    "unit": "cm"
                }
            achievements[long_name] = discipline

        if isinstance(row["Geb.Datum"], datetime):
            birth_day = row["Geb.Datum"]
            birthday_timestamp = int(datetime.timestamp(birth_day) + 3.156e+7) # Add one year to match current year
        elif isinstance(row["Geb.Datum"], str):
            datetime_str = row["Geb.Datum"].strip().split(" ")[0]
            if "." in datetime_str:
                birth_day = datetime.strptime(datetime_str, '%d.%m.%Y')
            elif "-" in datetime_str:
                birth_day = datetime.strptime(datetime_str, '%Y-%m-%d')
            birthday_timestamp = int(datetime.timestamp(birth_day) + 3.156e+7) # Add one year to match current year
        else:
            birthday_timestamp = None

        gender = row[2]
        if isinstance(gender, str):
            gender = gender.upper()
        else:
            continue

        if config["starting_number"]:
            try:
                starting_number = int(row["Nummer"])
            except:
                starting_number = None
        else:
            starting_number = None

        name = row["Name"].split(" ")[0]
        surname = " ".join(row["Name"].split(" ")[1:])

        upload_success = upload_athlete(name,
                                        surname,
                                        starting_number,
                                        birthday_timestamp,
                                        gender,
                                        achievements,
                                        group_name,
                                        "Triathlon",
                                        config)
        time.sleep(0.1)

        if not upload_success:
            print(f"Athlete: {row['Name']} not uploaded")
    pass


def upload_athlete(name: str, surname: str,
                   starting_number: int, birth_day: int, gender: str,
                   achievements: Dict[str, Dict[str, Dict[str, Union[str, float]]]],
                   group_name: str, competition_type: str,
                   config: Dict) -> bool:
    url = URL + "/api/athlete"
    name = str(name).replace(".", " ")
    surname = str(surname).replace(".", " ")
    if isinstance(surname, float) or surname == "nan":
        surname = ""

    if isinstance(name, float) or name == "nan":
        name = ""

    upload_achievements = {}
    if config["achievements"]:
        upload_achievements = achievements

    post_body = {
        "name": name.strip(),
        "surname": surname.strip(),
        "gender": gender,
        "achievements": upload_achievements,
        "competition_type": competition_type,
        "starting_number": starting_number
    }
    if birth_day is not None:
        post_body["birth_date"] = birth_day
    response = requests.post(url,
                             json=post_body)
    if response.ok:
        ## Add to group
        url = URL + "/api/group"
        post_body = {
            "athlete_ids": [
                {
                    "name": name.strip(),
                    "surname": surname.strip()
                }
            ]
        }
        response = requests.put(url,
                                params={
                                    "name": group_name,
                                },
                                json=post_body)
        if response.ok:
            return True
        else:
            time.sleep(30)
            response = requests.put(url,
                                    params={
                                        "name": group_name,
                                    },
                                    json=post_body)
            if response.ok:
                return True
            else:
                return False
    else:
        return False


def upload_group(name: str, competition_type: str) -> bool:
    url = URL + "/api/group"
    post_body = {
        "name": name,
        "athlete_ids": [],
        "competition_type": competition_type
    }
    response = requests.post(url,
                             json=post_body)
    return response.ok


def upload_timetable(timetable: Dict) -> bool:
    url = URL + "/api/time_table"
    post_body = timetable
    response = requests.post(url,
                             json=post_body)
    if response.ok: 
        all_groups_uploaded = True
        for group_name, disciplines in timetable["Groups"].items():
            num_disciplines = len(disciplines)
            competition_type = ""
            
            if num_disciplines == 3:
                competition_type = "Triathlon"
            elif num_disciplines == 5:
                competition_type = "Pentathlon"
            elif num_disciplines == 7:
                competition_type = "Heptathlon"
            elif num_disciplines == 10:
                competition_type = "Decathlon"
                
            all_groups_uploaded = all_groups_uploaded & upload_group(group_name, competition_type)
        return all_groups_uploaded
    else:
        return False    
        


def simulate_in_progress(timetable: Dict, selected_time: Dict) -> Tuple[Dict, bool]:
    skipped_disciplines = {}
    all_ok = True
    for group, disciplines in timetable["Groups"].items():
        skipped_disciplines[group] = []
        for name, info in disciplines.items():
            time, day = info["time"].split(",")
            hour, min = time.split(":")
            hour = int(hour.strip())
            min = int(min.strip())
            day = day.strip()

            if day == selected_time["day"]:
                # check for selected time
                if hour < selected_time["h"]:
                    all_ok = all_ok & update_discipline_state(group_name=group, name=name, state="Finished")
                elif hour == selected_time["h"]:
                    if min < selected_time["min"]:
                        all_ok = all_ok & update_discipline_state(group_name=group, name=name, state="Finished")
                    elif min == selected_time["min"]:
                        all_ok = all_ok & update_discipline_state(group_name=group, name=name, state="Active")
                        skipped_disciplines[group].append(name)
                    else:
                        skipped_disciplines[group].append(name)
                else:
                    # not finished because selected is time is before start time
                    skipped_disciplines[group].append(name)

            elif day == "Samstag":
                # finished because selected is sonntag
                all_ok = all_ok & update_discipline_state(group_name=group, name=name, state="Finished")
            else:
                # not finished because selected is Samstag and day is Sonntag
                skipped_disciplines[group].append(name)

    return skipped_disciplines, all_ok


def update_discipline_state(group_name: str, name: str, state: str):
    url = URL + f"/api/discipline_state?name={group_name}"
    post_body = {
        "name": name,
        "state": state
    }
    response = requests.put(url, json=post_body)
    return response.ok


def main(args: Namespace):
    print("Uploading Data")
    old_results = read_excel_file(args.filename)

    config = {
        "decathlon": args.decathlon,
        "kids": args.kids,
        "youth": args.youth,
        "starting_number": args.starting_number,
        "achievements": args.achievements,
        "timetable": args.timetable,
        "simulate_in_progress": args.in_progress,
        "selected_time": {
            "day": "Samstag",
            "h": 11,
            "min": 30
        }
    }

    if config["timetable"]:
        with open(args.timetable_file, encoding='utf-8') as f:
            timetable = json.load(f)
        upload_timetable(timetable)

    skipped_disciplines = {}
    if config["simulate_in_progress"]:
        skipped_disciplines, _ = simulate_in_progress(timetable, config["selected_time"])

    if config["decathlon"]:
        upload_decathlon_results(old_results["decathlon"], config, skipped_disciplines=skipped_disciplines)

    if config["youth"]:
        upload_youth_results(old_results["decathlon"], config, skipped_disciplines=skipped_disciplines)

    if config["kids"]:
        upload_kids_results(old_results["kids"], config, skipped_disciplines=skipped_disciplines)

    print("Data uploaded")


if __name__ == "__main__":
    args = parse_args()
    main(args)
