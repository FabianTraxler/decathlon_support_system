import shutil

import numpy
import numpy as np
import win32com.client as win32
import boto3
import pandas as pd
import os
import datetime
import tqdm

col_mapping = {
	"NAME": "G",
	"VORNAME": "H",
	"Sex2": "I",
	"ORT": "J",
	"GBDT": "K",
	"TITEL": "L",
	"ADRESSE": "M",
	"Straße": "N",
	"PLZ": "O",
	"TEL.NR.": "P",
	"Handy": "Q",
	"E-Mail": "R",
	"100m": "Z",
	"Weit": "AB",
	"Kugel": "AD",
	"Hoch": "AF",
	"400 m": "AH",
	"Hürden": "AK",
	"Diskus": "AM",
	"Stab": "AO",
	"Speer": "AQ",
	"1500m - s": "AT",
	"1500m - min": "AS",
	"NR": "D"
}
col_name_mapping = {
	"surname": "NAME",
	"name": "VORNAME",
	"gender": "Sex2",
	"birth_date": "GBDT",
	"100 Meter Lauf": "100m",
	"Weitsprung": "Weit",
	"Kugelstoß": "Kugel",
	"Hochsprung": "Hoch",
	"400 Meter Lauf": "400 m",
	"110 Meter Hürden": "Hürden",
	"Diskuswurf": "Diskus",
	"Stabhochsprung": "Stab",
	"Speerwurf": "Speer",
	"1500 Meter Lauf": "1500m",
	"starting_number": "NR",
	# Youth disciplines
	"60 Meter Hürden": "Hürden",
	"60 Meter Lauf": "100m",
	"Vortex": "Speer",
	"1200 Meter Cross Lauf": "1500m",
	"1000 Meter Lauf": "1500m",
	"800 Meter Lauf": "1500m",
}

kids_col_name_mapping = {
	"60 Meter Lauf": "60 Meter",
	"Weitsprung": "Weit",
	"Schlagball": "Schlagball",
	"athlete_id": "Name",
	"birth_date": "Geb.Datum",
	"gender": "Sex",
	"starting_number": "Nummer"
}

kids_col_mapping = {
	"60 Meter": "G",
	"Weit": "I",
	"Schlagball": "K",
	"Name": "E",
	"Geb.Datum": "F",
	"Sex": "C",
	"Nummer": "B"
}

def char2int(chars: str):
	number = 0
	for i, char in enumerate(chars):
		number += ord(char.lower()) - 96 + (i) * 25

	return number

def write2excel(results_df: pd.DataFrame, empty_excel_file_path: str, filled_excel_path: str):
	# copy file
	shutil.copy(empty_excel_file_path, filled_excel_path)

	absolute_path = os.path.abspath(filled_excel_path)

	# Excel starten
	excel = win32.Dispatch('Excel.Application')
	#excel.Visible = False  # Excel im Hintergrund laufen lassen

	# Arbeitsmappe öffnen
	try:
		workbook = excel.Workbooks.Open(absolute_path)
		worksheet = workbook.Sheets('Adressen')
		kids_worksheet = workbook.Sheets("Kinder - 3 - Kampf")
	except Exception as e:
		workbook.Save()
		workbook.Close()
		return

	groups = results_df.groupby("group_name")

	# CSV-Datei lesen
	for group_name, group_df in groups:
		group_name = str(group_name)
		print(f"\n - {group_name} befüllen")
		try:
			if "Gruppe" in group_name and "J5K" not in group_name and "J7K" not in group_name:
				group_number = int(group_name.split(" ")[1])
				group_idx = 0
				for idx, row in tqdm.tqdm(group_df.iterrows(), total=len(group_df)):
					try:
						write_decathlon_athlete(worksheet, row, group_number, group_idx)
					except Exception as e:
						print("Error uploading athlete from group ", group_name, row.get("athlete_id"))
						print("Error:", e)
					group_idx += 1
			elif "U" in group_name and group_name != "U14" and group_name != "U16":
				group_idx = 0
				group_df = group_df.sort_values(by="gender")
				for idx, row in tqdm.tqdm(group_df.iterrows(), total=len(group_df)):
					try:
						write_kids_results(kids_worksheet, row, group_name, group_idx)
					except Exception as e:
						print("Error uploading athlete from group ", group_name, row.get("athlete_id"))
						print("Error:", e)
					group_idx += 1
			elif group_name in ["U14", "U16"]:
				group_idx = 0
				group_df = group_df.sort_values(by="gender")
				for idx, row in tqdm.tqdm(group_df.iterrows(), total=len(group_df)):
					try:
						write_youth_results(worksheet, row, group_name, group_idx)
					except Exception as e:
						print("Error uploading athlete from group ", group_name, row.get("athlete_id"))
						print("Error:", e)
					group_idx += 1
			else:
				print("Error: Nothing implemented for group: ", group_name)
		except Exception as e:
			print("Error uploading athletes from group ", group_name)
			print("Error:", e)

	# Arbeitsmappe speichern und schließen
	workbook.Save()
	workbook.Close()
	#excel.Quit()

def write_decathlon_athlete(worksheet, row: pd.Series, group_number: int, group_idx: int):
	for key, value in row.items():
		row_idx = (group_number - 1) * 30 + group_idx + 3

		if value is None or (isinstance(value, float) and np.isnan(value)):
			continue

		if key == "birth_date":
			try:
				if str(value)[0] == "-":
					if len(str(value)) >= 10:
						datetime_obj = datetime.datetime.utcfromtimestamp(int(value) / 100000)
					else:
						datetime_obj = datetime.datetime.utcfromtimestamp(int(value) / 10000)
				else:
					datetime_obj = datetime.datetime.utcfromtimestamp(int(value))
				value = f"{datetime_obj.day}.{datetime_obj.month}.{datetime_obj.year}"
			except Exception as e:
				print("Error converting birth date -- useing default 1.1.1990")
				value = "1.1.1970"
		elif key in ["Stabhochsprung", "Hochsprung"]:
			if not isinstance(value, str) and numpy.isnan(value):
				value = 0
			elif value[0] == "-":
				value = 0
			else:
				value = int(value) / 100
		elif key == "gender":
			value = value.lower()
			if value == "staffel":
				value = "-"
		elif key == "1500 Meter Lauf":
			if not isinstance(value, str) and np.isnan(value) or value == "-1,0":
				continue
			seconds = float(value.replace(",", "."))
			if np.isnan(seconds) or seconds == -1:
				continue
			min = seconds // 60
			seconds = seconds - min * 60

			xls_col = char2int(col_mapping.get(col_name_mapping.get(str(key)) + " - s"))
			worksheet.Cells(row_idx, xls_col).Value = seconds

			xls_col = char2int(col_mapping.get(col_name_mapping.get(str(key)) + " - min"))
			worksheet.Cells(row_idx, xls_col).Value = min
			continue
		else:
			try:
				if not isinstance(value, str) and numpy.isnan(value):
					value = 0
				else:
					value = float(value.replace(",", "."))
					if value == -1:
						value = 0.0
			except:
				pass
		col_chars = col_mapping.get(col_name_mapping.get(key))
		if col_chars is None:
			continue

		xls_col = char2int(col_chars)
		worksheet.Cells(row_idx, xls_col).Value = value


def write_youth_results(worksheet, row: pd.Series, group_name: str, group_idx: int):
	if group_name == "U14":
		row_idx = 243 + group_idx
	elif group_name == "U16":
		row_idx = 273 + group_idx
	else:
		return

	for key, value in row.items():
		if value is None or (isinstance(value, float) and np.isnan(value)):
			continue
		if key == "birth_date":
			try:
				if str(value)[0] == "-":
					if len(str(value)) >= 10:
						datetime_obj = datetime.datetime.utcfromtimestamp(int(value) / 100000)
					else:
						datetime_obj = datetime.datetime.utcfromtimestamp(int(value) / 10000)
				else:
					datetime_obj = datetime.datetime.utcfromtimestamp(int(value))
				value = f"{datetime_obj.day}.{datetime_obj.month}.{datetime_obj.year}"
			except Exception as e:
				print("Error converting birth date -- using default 1.1.2012/2010")
				if group_name == "U14":
					value = "1.1.2012"
				elif group_name == "U16":
					value = "1.1.2014"
				else:
					continue
		elif key in ["Stabhochsprung", "Hochsprung"]:
			if not isinstance(value, str) and numpy.isnan(value):
				value = 0
			elif value[0] == "-":
				value = 0
			else:
				value = int(value) / 100
		elif key == "gender":
			value = value.lower()
			if value == "staffel":
				value = "-"
		elif key in ["1200 Meter Cross Lauf", "1000 Meter Lauf", "800 Meter Lauf"]:
			if not isinstance(value, str) and np.isnan(value) or value == "-1,0":
				continue
			seconds = float(value.replace(",", "."))
			if np.isnan(seconds) or seconds == -1:
				continue
			min = seconds // 60
			seconds = seconds - min * 60

			xls_col = char2int(col_mapping.get(col_name_mapping.get(str(key)) + " - s"))
			worksheet.Cells(row_idx, xls_col).Value = seconds

			xls_col = char2int(col_mapping.get(col_name_mapping.get(str(key)) + " - min"))
			worksheet.Cells(row_idx, xls_col).Value = min
			continue
		else:
			try:
				if not isinstance(value, str) and numpy.isnan(value):
					value = 0
				else:
					value = float(value.replace(",", "."))
					if value == -1:
						value = 0.0
			except:
				pass
		col_chars = col_mapping.get(col_name_mapping.get(key))
		if col_chars is None:
			continue

		xls_col = char2int(col_chars)
		worksheet.Cells(row_idx, xls_col).Value = value


def write_kids_results(worksheet, row: pd.Series, group_name: str, group_idx: int):
	if group_name == "U4/U6":
		row_idx = 3 + group_idx
	elif group_name == "U8":
		row_idx = 33 + group_idx
	elif group_name == "U10":
		row_idx = 63 + group_idx
	elif group_name == "U12":
		row_idx = 123 + group_idx
	else:
		return

	for key, value in row.items():
		if value is None or (isinstance(value, float) and np.isnan(value)):
			continue
		if key == "birth_date":
			try:
				if str(value)[0] == "-":
					if len(str(value)) >= 10:
						datetime_obj = datetime.datetime.utcfromtimestamp(int(value) / 100000)
					else:
						datetime_obj = datetime.datetime.utcfromtimestamp(int(value) / 10000)
				else:
					datetime_obj = datetime.datetime.utcfromtimestamp(int(value))
				value = f"{datetime_obj.day}.{datetime_obj.month}.{datetime_obj.year}"
			except Exception as e:
				print("Error converting birth date -- useing default 1.1.1990")
				value = "1.1.1970"
		elif key == "gender":
			value = value.lower()
			if value == "staffel":
				value = "-"
		elif key == "athlete_id":
			value = " ".join(value.split("_"))
		else:
			try:
				if not isinstance(value, str) and numpy.isnan(value):
					value = 0
				else:
					value = float(value.replace(",", "."))
					if value == -1:
						value = 0.0
			except:
				pass


		col_chars = kids_col_mapping.get(kids_col_name_mapping.get(str(key)))
		if col_chars is None:
			continue

		xls_col = char2int(col_chars)
		worksheet.Cells(row_idx, xls_col).Value = value


def get_results():
	# Create a DynamoDB client using the default credentials and region
	dynamodb = boto3.client("dynamodb")

	response = dynamodb.scan(
		TableName = "athlete_store"
	)

	athletes_list = []

	for athlete_dict in response["Items"]:
		cleaned_dict = {}
		for k, v in athlete_dict.items():
			if k == "achievements":
				for k, v in v["M"].items():
					cleaned_dict[k] = get_achievement_value(next(iter(v.values())))
			else:
				cleaned_dict[k] =  next(iter(v.values()))

		athletes_list.append(cleaned_dict)

	athletes = pd.DataFrame(athletes_list)
	athletes["athlete_id"] = athletes["athlete_id"].astype(str)

	athlete_group_df = get_groups()

	athletes = athletes.merge(athlete_group_df, on="athlete_id")
	return athletes

def get_achievement_value(achievement_dict):
	if "Time" in achievement_dict:
		final_result = achievement_dict["Time"]["M"]["final_result"]
		return f'{final_result["M"]["integral"]["N"]},{final_result["M"]["fractional"]["N"]:0>2}'

	if "Distance" in achievement_dict:
		final_result = achievement_dict["Distance"]["M"]["final_result"]
		return f'{final_result["M"]["integral"]["N"]},{final_result["M"]["fractional"]["N"]:0>2}'

	if "Height" in achievement_dict:
		return achievement_dict["Height"]["M"]["final_result"]["N"]


def get_groups():
	dynamodb = boto3.client("dynamodb")

	response = dynamodb.scan(
		TableName = "group_store"
	)

	athletes_list = []

	for group_dict in response["Items"]:
		for athlete_dict in group_dict["athlete_ids"]["L"]:
			athletes_list.append({
				"group_name": group_dict["name"]["S"],
				"athlete_id": athlete_dict["M"]["name"]["S"] + "_" +  athlete_dict["M"]["surname"]["S"],
			})

	athletes = pd.DataFrame(athletes_list)
	athletes["athlete_id"] = athletes["athlete_id"].astype(str)

	return athletes


if __name__ == "__main__":
	# Datei-Pfade
	xls_file_path = '../tests/excel_files/Adressen_empty.xls'
	xls_file_path_filled = '../tests/excel_files/Adressen_filled.xls'

	boto3.setup_default_session(profile_name='jzk_app')

	print("Getting data ...")
	results_df = get_results()

	print("Filling Excel ...")
	write2excel(results_df, xls_file_path, xls_file_path_filled)
