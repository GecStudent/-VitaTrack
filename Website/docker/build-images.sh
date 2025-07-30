#!/bin/bash

# VitaTrack Docker Image Build Script

set -e

# Configuration
REGISTRY="vitatrack"
VERSION=${VERSION:-"0.1.0"}
ENVIRONMENT=${ENVIRONMENT:-"dev"}
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Determine tag based on environment
if [ "$ENVIRONMENT" == "prod" ]; then
  TAG="$VERSION"
  ADDITIONAL_TAG="stable"
elif [ "$ENVIRONMENT" == "staging" ]; then
  TAG="$VERSION-rc.1"
  ADDITIONAL_TAG="edge"
else
  TAG="$VERSION-dev.$GIT_HASH"
  ADDITIONAL_TAG="latest"
fi

# Build and tag images
build_and_tag() {
  local SERVICE=$1
  local CONTEXT=$2
  local DOCKERFILE=$3
  
  echo "===== Building $SERVICE image ====="
  docker build \
    --build-arg VERSION=$VERSION \
    --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
    --build-arg VCS_REF=$GIT_HASH \
    -t $REGISTRY/$SERVICE:$TAG \
    -t $REGISTRY/$SERVICE:$ADDITIONAL_TAG \
    -f $DOCKERFILE $CONTEXT
  
  # Run security scan
  ./docker/security-scan.sh $REGISTRY/$SERVICE:$TAG
  
  echo "===== Successfully built $REGISTRY/$SERVICE:$TAG ====="
}

# Build all images
build_and_tag "backend" "./backend" "./docker/backend/Dockerfile"
build_and_tag "frontend" "./frontend" "./docker/frontend/Dockerfile"
build_and_tag "ai-recommendation" "./ai" "./docker/ai/Dockerfile"
build_and_tag "image-recognition" "./ai" "./docker/ai/Dockerfile"
build_and_tag "utility" "./utility" "./docker/utility/Dockerfile"

echo "\n===== All images built successfully ====="
echo "Version: $VERSION"
echo "Tag: $TAG"
echo "Additional Tag: $ADDITIONAL_TAG"