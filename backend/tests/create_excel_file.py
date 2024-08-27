"""
Necessary columns:
{
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
	"E-Mail": "R"
	"100m": "Z",
	"Weit": "AB",
	"Kugel": "AD",
	"Hoch": "AF",
	"400 m": "AH",
	"Hürden": "AK"
	"Diskus": "AM",
	"Stab": "AO",
	"Speer": "AQ",
	"1500m": "AS"
}
"""


import boto3
import pandas as pd
from xlrd import open_workbook
from xlutils.copy import copy
from xlutils.filter import process,XLRDReader,XLWTWriter

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

def get_achievement_value(achievement_dict):
    if "Time" in achievement_dict:
        final_result = achievement_dict["Time"]["M"]["final_result"]
        return final_result["M"]["integral"]["N"] + "," + final_result["M"]["fractional"]["N"]

    if "Distance" in achievement_dict:
        final_result = achievement_dict["Distance"]["M"]["final_result"]
        return final_result["M"]["integral"]["N"] + "," + final_result["M"]["fractional"]["N"]

    if "Height" in achievement_dict:
        return achievement_dict["Height"]["M"]["final_result"]["N"]

def copy2(wb):
    w = XLWTWriter()
    process(
        XLRDReader(wb,'unknown.xls'),
        w
        )
    return w.output[0][1], w.style_list

def merge_into_excel(athlete_df, excel_path):

    rb = open_workbook(excel_path, formatting_info=True, on_demand=True)
    inSheet = rb.sheet_by_index(0)

    # Copy the workbook, and get back the style
    # information in the `xlwt` format
    outBook, outStyle = copy2(rb)

    # Get the style of _the_ cell:
    xf_index = inSheet.cell_xf_index(3, 6)
    saved_style = outStyle[xf_index]

    # Update the cell, using the saved style as third argument of `write`:
    outBook.get_sheet(0).write(3, 6, 'changed!', saved_style)

    s = outBook.get_sheet(0)
    s.write(3, 6, 'changed!', saved_style)
    outBook.save('./excel_files/Adressen_empty_filled.xls')

    workbook = open_workbook(excel_path)
    sheet = workbook['Adressen']

    sheet.write(3, 7, "Hans")

    workbook.save('./excel_files/Adressen_empty_filled.xls')



if __name__ == "__main__":
    empty_excel_path = "excel_files/Adressen_empty.xls"
    results_df = get_results()

    merge_into_excel(results_df, empty_excel_path)
