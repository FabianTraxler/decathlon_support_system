import boto3
import pandas as pd
import os
import numpy as np
import pdfkit as pdf
import io
from datetime import datetime

def get_age_group(row: pd.Series):
    birth_year = datetime.fromtimestamp(int(row["birth_date"])).year
    current_year = datetime.now().year
    age = current_year - birth_year
    
    age_group = row["gender"].upper()
    
    if age > 40:
        age_group += "40"
    elif age > 50:
        age_group += "50"
    elif age > 60:
        age_group += "60"
    elif age > 70:
        age_group += "70"
        
    return age_group

def get_groups():
    dynamodb = boto3.client("dynamodb")

    response = dynamodb.scan(
		TableName = "athlete_store"
    )

    athletes_list = []

    for athlete_dict in response["Items"]:
        cleaned_dict = {}
        for k, v in athlete_dict.items():
            if k == "achievements":
                continue
            else:
                cleaned_dict[k] =  next(iter(v.values()))

        athletes_list.append(cleaned_dict)

    athletes = pd.DataFrame(athletes_list)
    athletes["athlete_id"] = athletes["athlete_id"].astype(str)
    
    athletes["Klasse"] = athletes.apply(get_age_group, axis=1)

    if "paid" in athletes.columns:
        athletes["Bezahlt"] = athletes["paid"]
    else:
        athletes["Bezahlt"] = False
        
    athletes["Bezahlt"] = athletes["Bezahlt"].apply(lambda x: "Ja" if x else "Nein" )
    
    response = dynamodb.scan(
		TableName = "group_store"
	)

    athletes_list = []

    for group_dict in response["Items"]:
        for athlete_dict in group_dict["athlete_ids"]["L"]:
            athletes_list.append({
                "Gruppe": group_dict["name"]["S"],
                "Vorname": athlete_dict["M"]["name"]["S"],
                "Nachname": athlete_dict["M"]["surname"]["S"],
                "athlete_id": athlete_dict["M"]["name"]["S"] + "_" + athlete_dict["M"]["surname"]["S"]
                })

    athlete_group_df = pd.DataFrame(athletes_list)
    athlete_group_df["athlete_id"] = athlete_group_df["athlete_id"].astype(str)
 
    athletes = athletes.merge(athlete_group_df, on="athlete_id")

    athletes["Startnummer"] = ""
    groups = athletes.groupby("Gruppe")

    return groups

def create_pdf(group_info: pd.DataFrame, folder: str):

    final_html = '<html><head><meta charset="UTF-8"></head><body></body></html>'
    for group_name, group_df in group_info:
        buf = io.StringIO()
        
        group_df = group_df.sort_values(by="Nachname")

        group_df.to_html(buf, index=False, columns=["Vorname", "Nachname", "Klasse", "Bezahlt", "Startnummer"])
        new_group_info = f"""
        <div style="page-break-before:always;padding:40px">        
            <h2>{group_name}</h2>
            <div style="font-size:40em">
                {buf.getvalue()}
            </div>
        </div>
        """
        final_html = final_html.replace('</body></html>', new_group_info + '</body></html>')
    
    pdf_path = os.path.join(folder, "athletes.pdf")
    pdf.from_string(final_html, pdf_path)

if __name__ == "__main__":
    OUT_FOLDER = "./output"
    if not os.path.isdir(OUT_FOLDER):
        os.makedirs(OUT_FOLDER)
    group_info = get_groups()    
    
    create_pdf(group_info, OUT_FOLDER)