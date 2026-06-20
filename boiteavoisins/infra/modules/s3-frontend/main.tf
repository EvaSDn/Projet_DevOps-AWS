# =====================================================================
# Module S3 (website hosting) - Frontend React (SPA)
#
# CloudFront etant bloque sur le Learner Lab (OAC/OAI/Function/Distribution
# refuses), on sert le front via le mode "website" natif de S3.
# Pas de mixed-content : le front (http S3) appelle l'API (http ALB).
# Fallback SPA natif : error_document = index.html.
# =====================================================================

variable "env" { type = string }

locals {
  name = "boiteavoisins-${var.env}"
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "frontend" {
  bucket = "${local.name}-frontend-${data.aws_caller_identity.current.account_id}"
}

# Mode website : index + fallback SPA sur index.html
resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # routing SPA : toute 404 renvoie l'app React
  }
}

# Autoriser l'acces public en lecture (necessaire pour un site statique S3)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadGetObject"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.frontend.arn}/*"
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend]
}

output "bucket_name" { value = aws_s3_bucket.frontend.id }
output "website_url" {
  value = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}