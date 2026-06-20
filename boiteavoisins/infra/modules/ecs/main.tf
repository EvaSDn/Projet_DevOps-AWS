# =====================================================================
# Module ECS Fargate - Backend BoiteAVoisins
# Cluster + Task Definition + Service (2 taches, ALB) + Auto Scaling
# + Observabilite (CloudWatch Logs, Container Insights, alarme CPU/SNS).
#
# Learner Lab : aucun role IAM cree -> on reutilise le LabRole existant.
# =====================================================================

variable "env" { type = string }
variable "vpc_id" { type = string }
variable "private_app_subnet_ids" { type = list(string) }
variable "ecs_sg_id" { type = string }
variable "target_group_arn" { type = string }
variable "db_secret_arn" { type = string }
variable "jwt_secret_arn" { type = string }
variable "db_endpoint" { type = string } # format host:port
variable "image_uri" { type = string }

locals {
  name    = "boiteavoisins-${var.env}"
  db_host = split(":", var.db_endpoint)[0]
  db_port = split(":", var.db_endpoint)[1]
}

# ---------------------------------------------------------------------
# LabRole (Learner Lab) : execution role + task role.
# ---------------------------------------------------------------------
data "aws_iam_role" "lab" {
  name = "LabRole"
}

# ---------------------------------------------------------------------
# Logs CloudWatch
# ---------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${local.name}-backend"
  retention_in_days = 7
}

# ---------------------------------------------------------------------
# Cluster ECS (Container Insights pour l'observabilite)
# ---------------------------------------------------------------------
resource "aws_ecs_cluster" "main" {
  name = local.name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ---------------------------------------------------------------------
# Task Definition Fargate (256 CPU / 512 Mo)
# ---------------------------------------------------------------------
resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = data.aws_iam_role.lab.arn
  task_role_arn            = data.aws_iam_role.lab.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = var.image_uri
      essential = true

      portMappings = [
        { containerPort = 4000, protocol = "tcp" }
      ]

      environment = [
        { name = "PORT", value = "4000" },
        { name = "PGHOST", value = local.db_host },
        { name = "PGPORT", value = local.db_port },
        { name = "PGDATABASE", value = "boiteavoisins" },
        { name = "PGUSER", value = "postgres" },
        { name = "PGSSL", value = "true" }
      ]

      secrets = [
        { name = "PGPASSWORD", valueFrom = "${var.db_secret_arn}:password::" },
        { name = "JWT_SECRET", valueFrom = var.jwt_secret_arn }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# ---------------------------------------------------------------------
# Service ECS : 2 taches (2 AZ), derriere l'ALB, rollback automatique.
# ---------------------------------------------------------------------
resource "aws_ecs_service" "backend" {
  name            = "${local.name}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  enable_execute_command = true # pour appliquer le schema SQL (etape 4)

  network_configuration {
    subnets          = var.private_app_subnet_ids
    security_groups  = [var.ecs_sg_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "backend"
    container_port   = 4000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  health_check_grace_period_seconds = 60

  depends_on = [aws_cloudwatch_log_group.backend]
}

# ---------------------------------------------------------------------
# Auto Scaling : cible CPU 70% (min 2, max 4)
# ---------------------------------------------------------------------
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 4
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "${local.name}-cpu-target"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}

# ---------------------------------------------------------------------
# Monitoring : SNS + alarme CPU > 80%
# ---------------------------------------------------------------------
resource "aws_sns_topic" "alerts" {
  name = "${local.name}-alerts"
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${local.name}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Utilisation CPU ECS superieure a 80 pourcent"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.backend.name
  }
}

# ---------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------
output "cluster_name" { value = aws_ecs_cluster.main.name }
output "service_name" { value = aws_ecs_service.backend.name }
output "alerts_topic_arn" { value = aws_sns_topic.alerts.arn }