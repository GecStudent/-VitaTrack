#!/bin/bash

# VitaTrack Docker Image Security Scanning Script

set -e

# Check if image name is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <image-name>"
  exit 1
fi

IMAGE_NAME=$1
SCAN_OUTPUT_DIR="./scan-results"
CURRENT_DATE=$(date +"%Y-%m-%d_%H-%M-%S")

# Create output directory if it doesn't exist
mkdir -p "$SCAN_OUTPUT_DIR"

echo "===== Security Scanning for $IMAGE_NAME ====="

# 1. Run Docker Scout scan
echo "\n[1/3] Running Docker Scout vulnerability scan..."
docker scout cves "$IMAGE_NAME" --format json > "$SCAN_OUTPUT_DIR/${IMAGE_NAME//\//_}_scout_$CURRENT_DATE.json"

# Check if Trivy is installed
if ! command -v trivy &> /dev/null; then
  echo "Trivy not found. Installing..."
  curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
fi

# 2. Run Trivy scan
echo "\n[2/3] Running Trivy vulnerability scan..."
trivy image --format json --output "$SCAN_OUTPUT_DIR/${IMAGE_NAME//\//_}_trivy_$CURRENT_DATE.json" "$IMAGE_NAME"

# 3. Run Dockle scan for best practices
if ! command -v dockle &> /dev/null; then
  echo "Dockle not found. Installing..."
  curl -L -o dockle.tar.gz https://github.com/goodwithtech/dockle/releases/download/v0.4.5/dockle_0.4.5_Linux-64bit.tar.gz
  tar xvf dockle.tar.gz
  mv dockle /usr/local/bin/
  rm dockle.tar.gz
fi

echo "\n[3/3] Running Dockle best practices scan..."
dockle --format json --output "$SCAN_OUTPUT_DIR/${IMAGE_NAME//\//_}_dockle_$CURRENT_DATE.json" "$IMAGE_NAME"

# Generate summary report
echo "\n===== Scan Summary ====="
echo "Image: $IMAGE_NAME"
echo "Scan Date: $CURRENT_DATE"
echo "Results saved to: $SCAN_OUTPUT_DIR"

# Extract critical vulnerabilities from Trivy scan
CRITICAL_VULNS=$(cat "$SCAN_OUTPUT_DIR/${IMAGE_NAME//\//_}_trivy_$CURRENT_DATE.json" | jq -r '.Results[] | select(.Vulnerabilities != null) | .Vulnerabilities[] | select(.Severity == "CRITICAL") | .VulnerabilityID' | wc -l)
HIGH_VULNS=$(cat "$SCAN_OUTPUT_DIR/${IMAGE_NAME//\//_}_trivy_$CURRENT_DATE.json" | jq -r '.Results[] | select(.Vulnerabilities != null) | .Vulnerabilities[] | select(.Severity == "HIGH") | .VulnerabilityID' | wc -l)

echo "Critical Vulnerabilities: $CRITICAL_VULNS"
echo "High Vulnerabilities: $HIGH_VULNS"

# Check for failures
if [ "$CRITICAL_VULNS" -gt 0 ]; then
  echo "\n❌ SCAN FAILED: Critical vulnerabilities detected"
  exit 1
fi

echo "\n✅ SCAN PASSED"