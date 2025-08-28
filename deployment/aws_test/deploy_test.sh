#!/bin/bash

export DB_NAME_ATHLETE="athlete_store_test"
export DB_NAME_AUTHENTICATION="authentication_test"
export DB_NAME_GROUP="group_store_test"
export DB_NAME_TIMEGROUP="time_group_store_test"
export DB_NAME_TEAM="team_store_test"
export RUST_BACKTRACE=1

terraform plan
terraform apply 