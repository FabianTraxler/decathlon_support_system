"""
Change Name of athlete in all stores

1. athlete_store: athlete_id, name, surname
2. group_store: athlete_id
3. time_group_store: default_order, default_run_order, 10x discipline_order
"""

import boto3

def update_athlete_store(old_name, new_name):
	client = boto3.resource("dynamodb")
	table = client.Table("athlete_store")

	athlete = table.get_item(Key={'athlete_id': old_name["name"] + "_" + old_name["surname"]})

	if "Item" in athlete: # athlete exists
		athlete_data = athlete["Item"]
		athlete_data["name"] = new_name["name"]
		athlete_data["surname"] = new_name["surname"]
		athlete_data["athlete_id"] =  new_name["name"] + "_" + new_name["surname"]

		table.delete_item(Key={'athlete_id': old_name["name"] + "_" + old_name["surname"]})

		table.put_item(Item=athlete_data)
		print("Athlete name updated in athlete_store")
	else:
		print("Athlete not found in athlete_store")


def update_group_store(old_name, new_name):
	client = boto3.resource("dynamodb")
	table = client.Table("group_store")

	groups = table.scan()

	if "Items" in groups: # groups exists
		for group_data in groups["Items"]:
			for athlete_info in group_data["athlete_ids"]:
				if athlete_info == old_name:
					print("Athlete found in ", group_data["name"])

					i = group_data["athlete_ids"].index(old_name)
					group_data["athlete_ids"] = group_data["athlete_ids"][:i] + [new_name] + group_data["athlete_ids"][i + 1:]

					table.update_item(
						Key={"name": group_data["name"]},
						UpdateExpression="set athlete_ids=:a",
						ExpressionAttributeValues={":a": group_data["athlete_ids"]}
					)
					return

		else:
			print("Athlete not found in any group")
	else:
		print("No groups found")

def update_time_group_store(old_name, new_name):
	client = boto3.resource("dynamodb")
	table = client.Table("time_group_store")

	groups = table.scan()

	if "Items" in groups:  # groups exists
		for group_data in groups["Items"]:
			expression_attribute_values = {}
			for i, athlete_info in enumerate(group_data["default_athlete_order"]):
				if athlete_info["name"] == old_name["name"] and athlete_info["surname"] == old_name["surname"]:
					athlete_info["name"] = new_name["name"]
					athlete_info["surname"] = new_name["surname"]

					expression_attribute_values[":default_athlete_order"] = group_data["default_athlete_order"][:i] + [athlete_info] + group_data["default_athlete_order"][i + 1:]
					break
			else:
				print("Athlete not found in default_athlete_order")
			for i, run_info in enumerate(group_data["default_run_order"]):
				for j, athlete_info in enumerate(run_info["athletes"]):
					if athlete_info["name"] == old_name["name"] and athlete_info["surname"] == old_name["surname"]:
						athlete_info["name"] = new_name["name"]
						athlete_info["surname"] = new_name["surname"]
						run_info["athletes"] = run_info["athletes"][:j] + [athlete_info] + \
															  run_info["athletes"][j + 1:]
						group_data["default_run_order"][i] = run_info
						expression_attribute_values[":default_run_order"] = group_data["default_run_order"]
						break
				else:
					continue
				break
			else:
				print("Athlete not found in default_run_order")

			new_discipline_infos = []
			for discipline_info in group_data["disciplines"]:
				if "Track" in discipline_info["starting_order"]:
					for i, run_info in enumerate(discipline_info["starting_order"]["Track"]):
						for j, athlete_info in enumerate(run_info["athletes"]):
							if athlete_info["name"] == old_name["name"] and athlete_info["surname"] == old_name[
								"surname"]:
								athlete_info["name"] = new_name["name"]
								athlete_info["surname"] = new_name["surname"]
								run_info["athletes"] = run_info["athletes"][:j] + [athlete_info] + \
													   run_info["athletes"][j + 1:]
								discipline_info["starting_order"]["Track"][i] = run_info
								new_discipline_infos.append(discipline_info)
								break
						else:
							continue
						break

				elif "Default" in discipline_info["starting_order"]:
					for i, athlete_info in enumerate(discipline_info["starting_order"]["Default"]):
						if athlete_info["name"] == old_name["name"] and athlete_info["surname"] == old_name["surname"]:
							athlete_info["name"] = new_name["name"]
							athlete_info["surname"] = new_name["surname"]

							discipline_info["starting_order"]["Default"] = discipline_info["starting_order"]["Default"][:i] + [
								athlete_info] + discipline_info["starting_order"]["Default"][i + 1:]
							new_discipline_infos.append(discipline_info)
							break
				else:
					new_discipline_infos.append(discipline_info)

			expression_attribute_values[":disciplines"] = new_discipline_infos

			update_expression = "set " + ",".join([f"{k.replace(':', '')}={k}" for k in expression_attribute_values.keys()])

			if len(expression_attribute_values) == 0:
				print("No updates needed")
				return
			table.update_item(
				Key={"name": group_data["name"]},
				UpdateExpression=update_expression,
				ExpressionAttributeValues=expression_attribute_values
			)
			return
		else:
			print("Athlete not found in any group")
	else:
		print("No groups found")


if __name__ == "__main__":
	OLD_NAME = {
		"name": "Harald",
		"surname": "Polt"
	}
	NEW_NAME = {
		"name": "Harald",
		"surname": "_Ahrer%&"
	}
	update_athlete_store(OLD_NAME, NEW_NAME)

	update_group_store(OLD_NAME, NEW_NAME)

	update_time_group_store(OLD_NAME, NEW_NAME)