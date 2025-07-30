# VitaTrack AWS Infrastructure - VPC Configuration

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 3.0"

  name = "${var.project_name}-${var.environment}-vpc"
  cidr = var.vpc_cidr

  azs              = var.availability_zones
  public_subnets   = var.public_subnet_cidrs
  private_subnets  = var.private_subnet_cidrs
  database_subnets = var.database_subnet_cidrs

  # Enable NAT Gateway for private subnets
  enable_nat_gateway     = true
  single_nat_gateway     = var.environment != "prod" # Use single NAT Gateway for non-prod environments
  one_nat_gateway_per_az = var.environment == "prod" # Use one NAT Gateway per AZ for prod environment

  # Enable DNS support
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Create a dedicated subnet group for RDS
  create_database_subnet_group = true
  
  # Public subnet configuration
  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
    Tier = "Public"
  }
  
  # Private subnet configuration
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
    Tier = "Private"
  }
  
  # Database subnet configuration
  database_subnet_tags = {
    Tier = "Database"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc"
    Environment = var.environment
  }
}

# Create VPC Endpoints for S3 and DynamoDB
resource "aws_vpc_endpoint" "s3" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = [
          "s3:*"
        ]
        Resource = "*"
      }
    ]
  })
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(module.vpc.private_route_table_ids, module.vpc.public_route_table_ids)

  tags = {
    Name = "${var.project_name}-${var.environment}-s3-endpoint"
  }
}

resource "aws_vpc_endpoint" "dynamodb" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = [
          "dynamodb:*"
        ]
        Resource = "*"
      }
    ]
  })
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(module.vpc.private_route_table_ids, module.vpc.public_route_table_ids)

  tags = {
    Name = "${var.project_name}-${var.environment}-dynamodb-endpoint"
  }
}

# Create VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  log_destination      = aws_cloudwatch_log_group.vpc_flow_log.arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id               = module.vpc.vpc_id
  
  tags = {
    Name = "${var.project_name}-${var.environment}-vpc-flow-log"
  }
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  # Enable encryption with customer managed KMS key
  kms_key_id        = aws_kms_key.cloudwatch_key.arn
  kms_key_id = aws_kms_key.cloudwatch_key.arn
  name              = "/aws/vpc-flow-log/${var.project_name}-${var.environment}"
  retention_in_days = 30
  
  tags = {
    Name = "${var.project_name}-${var.environment}-vpc-flow-log-group"
  }
}

resource "aws_iam_role" "vpc_flow_log_role" {
  name = "${var.project_name}-${var.environment}-vpc-flow-log-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.project_name}-${var.environment}-vpc-flow-log-role"
  }
}

resource "aws_iam_role_policy" "vpc_flow_log_policy" {
  name = "${var.project_name}-${var.environment}-vpc-flow-log-policy"
  role = aws_iam_role.vpc_flow_log_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}