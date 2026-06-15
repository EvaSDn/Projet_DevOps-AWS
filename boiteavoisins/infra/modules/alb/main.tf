variable "env" { type = string }
variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }
output "alb_dns_name" { value = "en-attente" }
output "alb_sg_id" { value = "en-attente" }
output "target_group_arn" { value = "en-attente" }
