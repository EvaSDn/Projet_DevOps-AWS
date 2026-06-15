variable "env" { type = string }
variable "vpc_id" { type = string }

resource "aws_security_group" "ecs" {
  name        = "boiteavoisins-${var.env}-ecs"
  description = "Security group pour les taches ECS Fargate"
  vpc_id      = var.vpc_id

  ingress {
    description = "Trafic depuis le VPC sur le port 4000"
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "boiteavoisins-${var.env}-ecs" }
}

output "ecs_sg_id" { value = aws_security_group.ecs.id }
