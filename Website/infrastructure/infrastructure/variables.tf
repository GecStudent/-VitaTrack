# VitaTrack AWS Infrastructure - Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "vitatrackapp"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "vitatrackapp.com"
}

# VPC Variables
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.7.0/24", "10.0.8.0/24", "10.0.9.0/24"]
}

# RDS Variables
variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "vitatrackdb"
}

variable "db_username" {
  description = "Username for the database"
  type        = string
  default     = "vitatrackadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Password for the database"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "Instance class for the RDS instance"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for the RDS instance (in GB)"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for the RDS instance (in GB)"
  type        = number
  default     = 100
}

# ElastiCache Variables
variable "redis_node_type" {
  description = "Node type for the ElastiCache Redis cluster"
  type        = string
  default     = "cache.t3.small"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes for the ElastiCache Redis cluster"
  type        = number
  default     = 2
}

# EKS Variables
variable "eks_cluster_version" {
  description = "Version of the EKS cluster"
  type        = string
  default     = "1.24"
}

variable "eks_node_instance_types" {
  description = "Instance types for the EKS node groups"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "eks_node_desired_capacity" {
  description = "Desired capacity for the EKS node groups"
  type        = number
  default     = 2
}

variable "eks_node_min_capacity" {
  description = "Minimum capacity for the EKS node groups"
  type        = number
  default     = 1
}

variable "eks_node_max_capacity" {
  description = "Maximum capacity for the EKS node groups"
  type        = number
  default     = 5
}

# S3 Variables
variable "static_assets_bucket_name" {
  description = "Name of the S3 bucket for static assets"
  type        = string
  default     = "vitatrackapp-static-assets"
}

variable "backups_bucket_name" {
  description = "Name of the S3 bucket for backups"
  type        = string
  default     = "vitatrackapp-backups"
}