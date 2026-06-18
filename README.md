\# Boîte À Voisins - Projet DevSecOps / AWS



\## Description du projet

\[Ajouter ici la description de l'application Boîte À Voisins]



\## Schéma d'architecture

\[Insérer le lien vers l'image du schéma d'architecture AWS (VPC, ALB, ECS Fargate, RDS, S3/CloudFront)]



\## Procédure de déploiement

\### Infrastructure (AWS-1 \& AWS-2)

1\. Bootstrap Terraform (S3 + DynamoDB)

2\. Déploiement des modules VPC, Secrets, RDS

3\. Déploiement de l'ALB et ECR

4\. Push de l'image Docker sur ECR

5\. Déploiement ECS Fargate et application du schéma SQL (ECS Exec)

6\. Déploiement S3 + CloudFront et upload du frontend



\### Application (CI/CD)

Le déploiement applicatif est automatisé via GitHub Actions :

\- \*\*Staging\*\* : Déployé automatiquement à chaque push sur la branche `develop`.

\- \*\*Production\*\* : Déployé lors d'un push sur `main` (nécessite une approbation manuelle).



\## Variables d'environnement partagées

| Clé | Valeur |

| :--- | :--- |

| Région AWS | `us-east-1` |

| RDS Endpoint | `boiteavoisins-staging.ci2rgnzwbyhe.us-east-1.rds.amazonaws.com:5432` |

| RDS Database | `boiteavoisins` |

| VITE\_API\_URL | `http://\[DNS\_ALB]` |



\*(Voir AWS Secrets Manager pour les mots de passe et le secret JWT).\*



\## Procédure de Rollback

En cas d'échec d'un déploiement ou de crash en production :

1\. \*\*Automatique (ECS Circuit Breaker)\*\* : Si les health checks de la nouvelle version échouent, ECS annulera le déploiement automatiquement.

2\. \*\*Manuel (Ancienne Task Definition)\*\* : 

&#x20;  - Aller dans la console AWS ECS.

&#x20;  - Sélectionner le service `boiteavoisins-backend`.

&#x20;  - Mettre à jour le service en choisissant la révision précédente de la Task Definition.

&#x20;  - Forcer le déploiement.

