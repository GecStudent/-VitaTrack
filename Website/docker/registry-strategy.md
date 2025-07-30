# VitaTrack Docker Registry and Image Versioning Strategy

## Docker Registry

VitaTrack uses Amazon Elastic Container Registry (ECR) to store and manage Docker images. The registry is organized as follows:


For example:

## Image Versioning Strategy

VitaTrack follows semantic versioning (SemVer) for Docker images:

### Tag Format

- **MAJOR**: Incremented for incompatible API changes
- **MINOR**: Incremented for backward-compatible functionality additions
- **PATCH**: Incremented for backward-compatible bug fixes
- **PRERELEASE**: Optional identifier for pre-release versions (e.g., alpha, beta, rc)
- **BUILD**: Optional build metadata (e.g., git commit hash)

### Special Tags

- **latest**: Points to the latest stable release
- **edge**: Points to the latest development build
- **stable**: Points to the latest production-ready build

### Examples

## CI/CD Integration

The versioning strategy is integrated with the CI/CD pipeline:

1. **Feature Branches**: `{service}-{branch}-{short-hash}`
2. **Development**: `{service}:edge`
3. **Staging**: `{service}:{version}-rc.{build}`
4. **Production**: `{service}:{version}` and `{service}:stable`

## Image Lifecycle Management

- Images older than 90 days are automatically removed from the registry, except for production releases
- Production releases are kept indefinitely
- A maximum of 5 previous minor versions are retained for rollback purposes

## Security Scanning

All images are scanned for vulnerabilities before being pushed to the registry:

1. **Build-time scanning**: Using Docker Scout during the build process
2. **Registry scanning**: Using Amazon ECR image scanning
3. **Runtime scanning**: Using Trivy in the Kubernetes cluster

## Image Signing

All production images are signed using Docker Content Trust to ensure integrity and authenticity.

## Image Optimization Guidelines

1. Use multi-stage builds to minimize image size
2. Include only necessary files in the final image
3. Use .dockerignore to exclude unnecessary files
4. Minimize the number of layers
5. Use specific base image versions instead of 'latest'
6. Run as non-root user
7. Set appropriate resource limits