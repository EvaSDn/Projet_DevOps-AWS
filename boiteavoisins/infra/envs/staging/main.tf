variable "image_uri" {
  description = "URI de l image backend dans ECR (specifique au compte, defini dans terraform.tfvars)"
  type        = string
}


module "vpc" {
  source = "../../modules/vpc"
  env    = "staging"
}

module "secrets" {
  source = "../../modules/secrets"
  env    = "staging"
}

module "sg_ecs" {
  source = "../../modules/sg-ecs"
  env    = "staging"
  vpc_id = module.vpc.vpc_id
}

module "rds" {
  source                  = "../../modules/rds"
  env                     = "staging"
  vpc_id                  = module.vpc.vpc_id
  private_data_subnet_ids = module.vpc.private_data_subnet_ids
  ecs_sg_id               = module.sg_ecs.ecs_sg_id
}


module "alb" {
  source            = "../../modules/alb"
  env               = "staging"
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  ecs_sg_id         = module.sg_ecs.ecs_sg_id
}

module "ecs" {
  source                 = "../../modules/ecs"
  env                    = "staging"
  vpc_id                 = module.vpc.vpc_id
  private_app_subnet_ids = module.vpc.private_app_subnet_ids
  ecs_sg_id              = module.sg_ecs.ecs_sg_id
  target_group_arn       = module.alb.target_group_arn
  db_secret_arn          = module.rds.db_secret_arn
  jwt_secret_arn         = module.secrets.jwt_secret_arn
  db_endpoint            = module.rds.db_endpoint
  image_uri              = var.image_uri
}

module "frontend" {
  source = "../../modules/s3-frontend"
  env    = "staging"
}

output "vpc_id" { value = module.vpc.vpc_id }
output "ecs_sg_id" { value = module.sg_ecs.ecs_sg_id }
output "rds_endpoint" { value = module.rds.db_endpoint }
output "rds_secret_arn" {
  value     = module.rds.db_secret_arn
  sensitive = true
}
output "jwt_secret_arn" { value = module.secrets.jwt_secret_arn }

# Outputs ALB (etape 1)
output "alb_dns_name" { value = module.alb.alb_dns_name }

# Output frontend (etape 5)
output "frontend_url" { value = module.frontend.website_url }