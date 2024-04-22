"""Script to upload old results into DB for testing Purposes"""
import pandas as pd
from argparse import Namespace, ArgumentParser, BooleanOptionalAction
from typing import Dict, Union, List, Tuple
import requests
from datetime import datetime
import numpy as np
import json

def parse_args() -> Namespace:
    parser = ArgumentParser(
        prog="Insertion Tool for old result in Excel"
    )
    parser.add_argument("-f", "--filename", default="Adressen.xls")
    parser.add_argument("-d", "--decathlon", action=BooleanOptionalAction, default=True)
    parser.add_argument("-k", "--kids", action=BooleanOptionalAction, default=False)

    parser.add_argument("-a", "--achievements", action=BooleanOptionalAction, default=False)
    parser.add_argument("-s", "--starting_number", action=BooleanOptionalAction, default=False)
    parser.add_argument("-t", "--timetable", action=BooleanOptionalAction, default=True)
    parser.add_argument("--timetable_file", default="timetable.json")

    parser.add_argument("-p", "--in_progress", action=BooleanOptionalAction, default=False)

    return parser.parse_args()

def read_excel_file(filename: str) -> Dict[str, pd.DataFrame]:
    decathlon_sheet = pd.read_excel(filename, sheet_name="Adressen")
    decathlon_sheet = decathlon_sheet.dropna(subset=["Name"])

    return {"decathlon": decathlon_sheet }

def upload_decathlon_results(results: pd.DataFrame, config: Dict, skipped_disciplines: Dict = {}): 
    groups = results["GRP"].unique()
    for group in groups:
        if group is None: continue
        group_name = f"Gruppe {group}"
        if not upload_group(group_name, "Decathlon"):
            print(f"{group_name} not uploaded")

    disciplines = [ ('100m', "100 Meter Lauf", "Time"), 
                    ('Weit', "Weitsprung", "Distance"),
                    ('Kugel', "Kugelstoß", "Distance"), 
                    ('Hoch', "Hochsprung", "Height"), 
                    ('400 m', "400 Meter Lauf", "Time"),
                    ('Hürden', "110 Meter Hürden", "Time"), 
                    ('Diskus', "Diskuswurf", "Distance"), 
                    ('Stab', "Stabhochsprung", "Height"), 
                    ('Speer', "Speerwurf", "Distance"), 
                    (('1500m', '1500sec'), "1500 Meter Lauf", "Time" )]

    for _, row in results.iterrows():
        if isinstance(row["GRP"], int):
            group_name = f"Gruppe {row['GRP']}"
        else:
            group_name = row["GRP"]
        group_skipped_disciplines = skipped_disciplines.get(group_name, [])
        
        if not isinstance(row["NAME"], str) and np.isnan(row["NAME"]): continue
        achievements = []
        for (short_name, long_name, discipline_type) in disciplines:
            if long_name in group_skipped_disciplines: continue # skip achievement
            discipline = {}
            if isinstance(short_name, str):
                final_result = row[short_name]
            else:
                final_result = round(row[short_name[0]] * 60 + row[short_name[1]], 2)
            if np.isnan(final_result):
                final_result = { "integral": -1, "fractional": 0 }
            if discipline_type == "Time":
                discipline[discipline_type] = {
                    "name": long_name,
                    "final_result": final_result,
                    "unit": "s"
                }
            elif discipline_type == "Distance":
                    discipline[discipline_type] = {
                        "name": long_name,
                        "first_try": { "integral": -1, "fractional": 0 },
                        "second_try": { "integral": -1, "fractional": 0 },
                        "third_try": { "integral": -1, "fractional": 0 },
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
            achievements.append(discipline)
        
        if isinstance(row["GBDT"], datetime):
            birth_day = row["GBDT"]
            birthday_timestamp = int(datetime.timestamp(birth_day))
        elif isinstance(row["GBDT"], str):
            datetime_str = row["GBDT"].strip().split(" ")[0]
            if "." in datetime_str:
                birth_day = datetime.strptime(datetime_str, '%d.%m.%Y')
            elif "-" in datetime_str:
                birth_day = datetime.strptime(datetime_str, '%Y-%m-%d')
            birthday_timestamp = int(datetime.timestamp(birth_day))
        else:
            birthday_timestamp = None
        group_name = f"Gruppe {row['GRP']}"
        
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
                                        "Decathlon", 
                                        config)
        
        if not upload_success:
            print(f"Athlete: {row['VORNAME']} not uploaded")
    pass

def upload_athlete(name: str, surname: str, 
                   starting_number: int, birth_day: int, gender: str,
                   achievements: List[Dict[str, Dict[str, Union[str, float]]]],
                   group_name: str, competition_type: str,
                   config: Dict) -> bool:
    url = "http://127.0.0.1:3001/api/athlete"
    name = str(name).replace(".", " ")
    surname= str(surname).replace(".", " ")
    post_body = {
        "name": name,
        "surname": surname,
        "gender": gender,
        "achievements": {},
        "competition_type": competition_type,
        "starting_number": starting_number
    }
    if birth_day is not None:
        post_body["birth_date"] = birth_day
    response = requests.post(url,
                             json=post_body)
    if response.ok:
        if config["achievements"]:
        ## Upload Acievements
            post_params = {
                "name": name,
                "surname": surname
            }
            for achievement in achievements:
                    url = "http://127.0.0.1:3001/api/achievement"
                    post_body = achievement
                    response = requests.post(url,
                                            params=post_params,
                                            json=post_body)
                    if not response.ok:
                        return False
        
        ## Add to group
        url = "http://127.0.0.1:3001/api/group"
        post_body = {
            "athlete_ids": [
                {
                    "name": name,
                    "surname": surname
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
            return False
        
    else: 
        return False

def upload_group(name: str, competition_type: str) -> bool:
    url = "http://127.0.0.1:3001/api/group"
    post_body = {
        "name": name,
        "athlete_ids": [],
        "competition_type": competition_type
    }
    response = requests.post(url,
                             json=post_body)
    return response.ok

def upload_timetable(timetable: Dict) -> bool:
    url = "http://127.0.0.1:3001/api/time_table"
    post_body = timetable
    response = requests.post(url,
                             json=post_body)
    return response.ok 

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
    url = f"http://127.0.0.1:3001/api/discipline_state?name={group_name}"
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
        "starting_number": args.starting_number,
        "achievements": args.achievements,
        "timetable": args.timetable,
        "simulate_in_progress": args.in_progress,
        "selected_time": {
            "day": "Samstag",
            "h": 9,
            "min": 30
        }
    }
    
    if config["timetable"]:
        with open(args.timetable_file) as f:
            timetable = json.load(f)
        upload_timetable(timetable)
        
    skipped_disciplines = {}        
    if config["simulate_in_progress"]:
        skipped_disciplines, _ = simulate_in_progress(timetable, config["selected_time"])
    
    if config["decathlon"]:
        upload_decathlon_results(old_results["decathlon"], config, skipped_disciplines=skipped_disciplines)

    print("Data uploaded")

if __name__ == "__main__":
    args = parse_args()
    main(args)    