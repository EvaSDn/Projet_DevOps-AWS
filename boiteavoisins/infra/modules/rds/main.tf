variable "env" { type = string }
variable "vpc_id" { type = string }
variable "private_data_subnet_ids" { type = list(string) }
variable "ecs_sg_id" { type = string }

resource "aws_db_subnet_group" "main" {
  name       = "boiteavoisins-${var.env}"
  subnet_ids = var.private_data_subnet_ids
}

resource "aws_security_group" "rds" {
  name        = "boiteavoisins-${var.env}-rds"
  description = "Security group pour RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL depuis ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.ecs_sg_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "postgres" {
  identifier                  = "boiteavoisins-${var.env}"
  engine                      = "postgres"
  engine_version              = "16.9"
  instance_class              = "db.t3.micro"
  allocated_storage           = 20
  storage_type                = "gp3"
  storage_encrypted           = true
  db_name                     = "boiteavoisins"
  username                    = "postgres"
  manage_master_user_password = true
  db_subnet_group_name        = aws_db_subnet_group.main.name
  vpc_security_group_ids      = [aws_security_group.rds.id]
  publicly_accessible         = false
  multi_az                    = false
  backup_retention_period     = 7
  deletion_protection         = false
  skip_final_snapshot         = true
}

output "db_endpoint" { value = aws_db_instance.postgres.endpoint }
output "db_host" { value = aws_db_instance.postgres.address }
output "db_secret_arn" { value = aws_db_instance.postgres.master_user_secret[0].secret_arn }
