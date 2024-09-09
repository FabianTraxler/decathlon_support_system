"""Script to upload old results into DB for testing Purposes"""
import time

import pandas as pd
from argparse import Namespace, ArgumentParser, BooleanOptionalAction
from typing import Dict, Union, List, Tuple
import requests
from datetime import datetime
import numpy as np
import json
from tqdm import tqdm
import pytz
import gspread
def parse_args() -> Namespace:
	parser = ArgumentParser(
		prog="Insertion Tool for current registered athletes"
	)
	parser.add_argument("-r", "--register_table", default="Anmeldungen 2024")
	parser.add_argument("-t", "--timetable", default="./timetable.json")

	return parser.parse_args()


def get_google_sheet(google_sheets_name):
	utc = pytz.UTC
	gc = gspread.service_account(
		filename='/home/fabian/Desktop/STW/Jedermannzehnkampf/email-scaper/.config/gspread/service_account.json')
	sh = gc.open(google_sheets_name)
	return sh

def get_birthday(birthday):
	if birthday == "":
		return None
	try:
		birthday = datetime.strptime(birthday, "%Y-%m-%d")
	except:
		try:
			birthday = datetime.strptime(birthday, "%d.%m.%Y")
		except:
			return None
	return birthday


def upload_decathlon(google_sheets_name: str):
	sheet = get_google_sheet(google_sheets_name)
	worksheet = sheet.worksheet("10-Kampf")
	zehnkampf_df = pd.DataFrame(worksheet.get_all_records())

	# Upload / Create groups
	groups = zehnkampf_df["Gruppe"].unique()
	for group in groups:
		if group is None: continue
		group_name = f"Gruppe {group}"
		if not upload_group(group_name, "Decathlon"):
			print(f"{group_name} not uploaded")

	for _, row in tqdm(zehnkampf_df.iterrows(), total=len(zehnkampf_df)):
		group_name = f"Gruppe {row['Gruppe']}"

		if (not isinstance(row["Vorname"], str) or row["Name"].strip() == ""):
			continue

		if isinstance(row["Geburtstag"], datetime):
			birth_day = row["Geburtstag"]
			birthday_timestamp = int(datetime.timestamp(birth_day))
		elif isinstance(row["Geburtstag"], str):
			datetime_str = row["Geburtstag"].strip().split(" ")[0]
			if "." in datetime_str:
				birth_day = datetime.strptime(datetime_str, '%d.%m.%Y')
			elif "-" in datetime_str:
				birth_day = datetime.strptime(datetime_str, '%Y-%m-%d')
			birthday_timestamp = int(datetime.timestamp(birth_day))
		else:
			birth_day = datetime.strptime("1.1.1990", '%d.%m.%Y')
			birthday_timestamp = int(datetime.timestamp(birth_day))

		gender = row["Geschlecht"]
		if isinstance(gender, str):
			gender = gender.upper()
		else:
			gender = "Staffel"
   		
		if row["Bezahlt"] in [1,2,3]:
			paid = True
		else:
			paid = False

		upload_success = upload_athlete(row["Vorname"],
										row["Name"],
										None,
										birthday_timestamp,
										gender,
										group_name,
										"Decathlon",
          								row["T-Shirt"],
										paid
                        				)
		time.sleep(0.1)

		if not upload_success:
			print(f"Athlete: {row['Vorname']} not uploaded")
	pass



def upload_kids(google_sheets_name: str):
	sheet = get_google_sheet(google_sheets_name)
	worksheet = sheet.worksheet("Kinder+Jugend")
	jugend_df = pd.DataFrame(worksheet.get_all_records())

	group_names = jugend_df["Gruppe"].unique()
	for group_name in group_names:
		if group_name == "U14":
			if not upload_group(group_name, "Pentathlon"):
				print(f"{group_name} not uploaded")
		elif group_name == "U16":
			if not upload_group(group_name, "Heptathlon"):
				print(f"{group_name} not uploaded")
		else:
			if not upload_group(group_name, "Triathlon"):
				print(f"{group_name} not uploaded")


	for _, row in tqdm(jugend_df.iterrows(), total=len(jugend_df)):
		group_name = row["Gruppe"]
		if group_name in ["U4", "U6"]:
			group_name = "U4/U6"
		if group_name == "U14":
			competition_type ="Pentathlon"
		elif group_name == "U16":
			competition_type = "Heptathlon"
		else:
			competition_type = "Triathlon"

		if (not isinstance(row["Vorname"], str) and np.isnan(row["Name"])) or row["Vorname"] == "":
			continue

		if isinstance(row["Geburtsdatum"], datetime):
			birth_day = row["Geburtsdatum"]
			birthday_timestamp = int(datetime.timestamp(birth_day))
		elif isinstance(row["Geburtsdatum"], str):
			datetime_str = row["Geburtsdatum"].strip().split(" ")[0]
			if "." in datetime_str:
				birth_day = datetime.strptime(datetime_str, '%d.%m.%Y')
			elif "-" in datetime_str:
				birth_day = datetime.strptime(datetime_str, '%Y-%m-%d')
			else:
				birth_day = None
			birthday_timestamp = int(datetime.timestamp(birth_day))
		else:
			birth_day = datetime.strptime("1.1.1990", '%d.%m.%Y')
			birthday_timestamp = int(datetime.timestamp(birth_day))

		gender = row["Geschlecht"]
		if isinstance(gender, str):
			gender = gender.upper()
		else:
			gender = "Staffel"
   
		if(row["Bezahlt"] in [1,2,3]):
			paid = True
		else:
			paid = False

		upload_success = upload_athlete(row["Vorname"],
										row["Name"],
										None,
										birthday_timestamp,
										gender,
										group_name,
										competition_type,
          								row["T-Shirt"],
                  						paid
                        				)

		time.sleep(0.1)

		if not upload_success:
			print(f"Athlete: {row['Name']} not uploaded")
	pass


def upload_athlete(name: str, surname: str,
				   starting_number: int, birth_day: int, gender: str,
				   group_name: str, competition_type: str, t_shirt: str, paid: bool) -> bool:
	url = "http://127.0.0.1:3001/api/athlete"
	name = str(name).replace(".", " ")
	surname = str(surname).replace(".", " ")
	if isinstance(surname, float) or surname == "nan":
		surname = ""

	if isinstance(name, float) or name == "nan":
		name = ""

	upload_achievements = {}

	post_body = {
		"name": name.strip(),
		"surname": surname.strip(),
		"gender": gender,
		"achievements": upload_achievements,
		"competition_type": competition_type,
		"starting_number": starting_number,
		"t_shirt": t_shirt,
  		"paid": paid
	}
	if birth_day is not None:
		post_body["birth_date"] = birth_day
	response = requests.post(url,
							 json=post_body)
	if response.ok:
		## Add to group
		url = "http://127.0.0.1:3001/api/group"
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
			time.sleep(1)
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


def upload_timetable(timetable_path: str) -> bool:
	with open(timetable_path) as f:
		timetable = json.load(f)

	url = "http://127.0.0.1:3001/api/time_table"
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

def main(args: Namespace):
	upload_timetable(args.timetable)
	upload_decathlon(args.register_table)
	upload_kids(args.register_table)


if __name__ == "__main__":
	args = parse_args()
	main(args)
