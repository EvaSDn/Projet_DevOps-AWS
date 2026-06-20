# =====================================================================
# Module ALB - Application Load Balancer public (HTTP 80)
# Cible les taches ECS Fargate du backend sur le port 4000.
# =====================================================================

variable "env" { type = string }
variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }

# ID du SG des taches ECS (cree par le module sg-ecs).
# Permet d'ajouter ici la regle "least privilege" ALB -> ECS:4000.
variable "ecs_sg_id" { type = string }

# ---------------------------------------------------------------------
# Security Group de l'ALB : seul point d'entree HTTP public.
# ---------------------------------------------------------------------
resource "aws_security_group" "alb" {
  name        = "boiteavoisins-${var.env}-alb"
  description = "SG de l ALB public (HTTP 80 depuis Internet)"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP depuis Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Sortie vers les taches ECS"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "boiteavoisins-${var.env}-alb" }
}

# ---------------------------------------------------------------------
# Least privilege : l'ECS n'accepte le 4000 QUE depuis le SG de l'ALB.
# (remplace l'ancienne regle large "4000 depuis 10.0.0.0/16")
# ---------------------------------------------------------------------
resource "aws_vpc_security_group_ingress_rule" "ecs_from_alb" {
  security_group_id            = var.ecs_sg_id
  description                  = "Backend 4000 uniquement depuis l ALB"
  from_port                    = 4000
  to_port                      = 4000
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.alb.id
}

# ---------------------------------------------------------------------
# Application Load Balancer (public, sur les 2 subnets publics / 2 AZ).
# ---------------------------------------------------------------------
resource "aws_lb" "main" {
  name               = "boiteavoisins-${var.env}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  tags = { Name = "boiteavoisins-${var.env}-alb" }
}

# ---------------------------------------------------------------------
# Target Group : cible les IP des taches Fargate, health check /api/health
# ---------------------------------------------------------------------
resource "aws_lb_target_group" "backend" {
  name        = "boiteavoisins-${var.env}-tg"
  port        = 4000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip" # obligatoire pour Fargate (reseau awsvpc)

  deregistration_delay = 30 # staging : rollover rapide

  health_check {
    path                = "/api/health"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = { Name = "boiteavoisins-${var.env}-tg" }
}

# ---------------------------------------------------------------------
# Listener HTTP:80 -> forward vers le target group.
# ---------------------------------------------------------------------
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# ---------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------
output "alb_dns_name"     { value = aws_lb.main.dns_name }
output "alb_arn"          { value = aws_lb.main.arn }
output "alb_sg_id"        { value = aws_security_group.alb.id }
output "target_group_arn" { value = aws_lb_target_group.backend.arn }