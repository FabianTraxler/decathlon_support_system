# ---------- IAM Role for DynamoDB AutoScaling ----------
resource "aws_iam_role" "dynamodb_autoscale_role" {
  name = "DynamoDBAutoscaleRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "application-autoscaling.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "dynamodb_autoscale_policy_attach" {
  role       = aws_iam_role.dynamodb_autoscale_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

# ---------- DynamoDB Tables ----------

# athlete_store (15/15 -> autoscale to 50/50)
resource "aws_dynamodb_table" "athlete_store" {
  name           = "athlete_store"
  billing_mode   = "PROVISIONED"
  hash_key       = "athlete_id"
  read_capacity  = 15
  write_capacity = 15

  attribute {
    name = "athlete_id"
    type = "S"
  }

  tags = {
    Name = "athlete_store"
  }

  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_appautoscaling_target" "athlete_store_read" {
  max_capacity       = 50
  min_capacity       = 15
  resource_id        = "table/${aws_dynamodb_table.athlete_store.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
  role_arn           = aws_iam_role.dynamodb_autoscale_role.arn
}

resource "aws_appautoscaling_policy" "athlete_store_read_policy" {
  name               = "athlete-store-read-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.athlete_store_read.resource_id
  scalable_dimension = aws_appautoscaling_target.athlete_store_read.scalable_dimension
  service_namespace  = aws_appautoscaling_target.athlete_store_read.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_target" "athlete_store_write" {
  max_capacity       = 50
  min_capacity       = 15
  resource_id        = "table/${aws_dynamodb_table.athlete_store.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
  role_arn           = aws_iam_role.dynamodb_autoscale_role.arn
}

resource "aws_appautoscaling_policy" "athlete_store_write_policy" {
  name               = "athlete-store-write-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.athlete_store_write.resource_id
  scalable_dimension = aws_appautoscaling_target.athlete_store_write.scalable_dimension
  service_namespace  = aws_appautoscaling_target.athlete_store_write.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}

# group_store (4/4 -> autoscale to 10/10)
resource "aws_dynamodb_table" "group_store" {
  name           = "group_store"
  billing_mode   = "PROVISIONED"
  hash_key       = "name"
  read_capacity  = 4
  write_capacity = 4

  attribute {
    name = "name"
    type = "S"
  }
}

resource "aws_appautoscaling_target" "group_store_read" {
  max_capacity       = 10
  min_capacity       = 4
  resource_id        = "table/${aws_dynamodb_table.group_store.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
  role_arn           = aws_iam_role.dynamodb_autoscale_role.arn
}

resource "aws_appautoscaling_policy" "group_store_read_policy" {
  name               = "group-store-read-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.group_store_read.resource_id
  scalable_dimension = aws_appautoscaling_target.group_store_read.scalable_dimension
  service_namespace  = aws_appautoscaling_target.group_store_read.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
  }
}

resource "aws_appautoscaling_target" "group_store_write" {
  max_capacity       = 10
  min_capacity       = 4
  resource_id        = "table/${aws_dynamodb_table.group_store.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
  role_arn           = aws_iam_role.dynamodb_autoscale_role.arn
}

resource "aws_appautoscaling_policy" "group_store_write_policy" {
  name               = "group-store-write-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.group_store_write.resource_id
  scalable_dimension = aws_appautoscaling_target.group_store_write.scalable_dimension
  service_namespace  = aws_appautoscaling_target.group_store_write.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
  }
}

# time_group_store (3/3 -> autoscale to 10/10)
resource "aws_dynamodb_table" "time_group_store" {
  name           = "time_group_store"
  billing_mode   = "PROVISIONED"
  hash_key       = "name"
  read_capacity  = 3
  write_capacity = 3

  attribute {
    name = "name"
    type = "S"
  }
}

resource "aws_appautoscaling_target" "time_group_store_read" {
  max_capacity       = 10
  min_capacity       = 3
  resource_id        = "table/${aws_dynamodb_table.time_group_store.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
  role_arn           = aws_iam_role.dynamodb_autoscale_role.arn
}

resource "aws_appautoscaling_policy" "time_group_store_read_policy" {
  name               = "time-group-store-read-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.time_group_store_read.resource_id
  scalable_dimension = aws_appautoscaling_target.time_group_store_read.scalable_dimension
  service_namespace  = aws_appautoscaling_target.time_group_store_read.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
  }
}

resource "aws_appautoscaling_target" "time_group_store_write" {
  max_capacity       = 10
  min_capacity       = 3
  resource_id        = "table/${aws_dynamodb_table.time_group_store.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
  role_arn           = aws_iam_role.dynamodb_autoscale_role.arn
}

resource "aws_appautoscaling_policy" "time_group_store_write_policy" {
  name               = "time-group-store-write-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.time_group_store_write.resource_id
  scalable_dimension = aws_appautoscaling_target.time_group_store_write.scalable_dimension
  service_namespace  = aws_appautoscaling_target.time_group_store_write.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
  }
}

# team_store (2/2, no autoscaling)
resource "aws_dynamodb_table" "team_store" {
  name           = "team_store"
  billing_mode   = "PROVISIONED"
  hash_key       = "team_name"
  read_capacity  = 2
  write_capacity = 2

  attribute {
    name = "team_name"
    type = "S"
  }
}

# authentication (3/3, no autoscaling)
resource "aws_dynamodb_table" "authentication" {
  name           = "authentication"
  billing_mode   = "PROVISIONED"
  hash_key       = "password"
  read_capacity  = 3
  write_capacity = 3

  attribute {
    name = "password"
    type = "S"
  }
}

# ---------- Outputs ----------
output "ec2_public_ip" {
  value = aws_eip.ec2_eip.public_ip
}

output "dynamodb_tables" {
  value = [
    aws_dynamodb_table.athlete_store.name,
    aws_dynamodb_table.group_store.name,
    aws_dynamodb_table.time_group_store.name,
    aws_dynamodb_table.team_store.name,
    aws_dynamodb_table.authentication.name
  ]
}
