# =====================================================================
# Module SG-ECS - Security Group des taches ECS Fargate
# Cree separement pour casser la dependance circulaire ECS <-> RDS.
#
# MODIF AWS-2 : l'ancienne regle large "4000 depuis 10.0.0.0/16" est
# supprimee. L'autorisation du port 4000 est desormais ajoutee par le
# module ALB, uniquement depuis le SG de l'ALB (least privilege).
# =====================================================================

variable "env" { type = string }
variable "vpc_id" { type = string }

resource "aws_security_group" "ecs" {
  name        = "boiteavoisins-${var.env}-ecs"
  description = "Security group pour les taches ECS Fargate"
  vpc_id      = var.vpc_id

  # Pas de regle ingress inline : voir module ALB (aws_vpc_security_group_ingress_rule.ecs_from_alb)

  egress {
    description = "Sortie autorisee (ECR, Secrets Manager, RDS, SSM...)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "boiteavoisins-${var.env}-ecs" }
}

output "ecs_sg_id" { value = aws_security_group.ecs.id }