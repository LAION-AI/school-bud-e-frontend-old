---
name: docker-build-push
description: Build and push Docker images for the School Bud-E Frontend project. This skill should be used when deploying updates to the Docker registry, preparing production releases, or when explicitly asked to build and push Docker images.
---

# Docker Build Push

## Overview

Automates the process of building and pushing Docker images for the School Bud-E Frontend project to the Docker registry. This skill handles the complete workflow from building multi-file docker-compose configurations to pushing tagged images to Docker Hub.

## When to Use This Skill

Use this skill when:
- Deploying updates to the Docker registry
- Preparing production releases or next-branch releases
- Explicitly asked to "build and push" Docker images
- Setting up CI/CD deployments
- Creating versioned Docker images for distribution

## Quick Start

To build and push the Docker image with default configuration:

```bash
./scripts/build_and_push.sh
```

This script will:
1. Validate that required docker-compose files exist
2. Build the image using both base and override compose files
3. Push the built image to the Docker registry
4. Provide colored output showing progress and any errors

## Configuration

### Default Settings

The skill uses these default configurations:

- **Base Compose File**: `docker-compose/docker-compose.yml`
- **Override Compose File**: `docker-compose/docker-compose.override.yml` (optional)
- **Image Name**: `michael55555/school-bud-e-frontend:next`
- **Registry**: Docker Hub (default)

### Customizing the Build

To customize the build process, edit the script variables at the top of `scripts/build_and_push.sh`:

```bash
COMPOSE_FILE_BASE="docker-compose/docker-compose.yml"
COMPOSE_FILE_OVERRIDE="docker-compose/docker-compose.override.yml"
IMAGE_NAME="michael55555/school-bud-e-frontend:next"
```

Common customizations:
- Change the tag from `next` to `latest`, `v1.0`, etc.
- Use different compose file configurations
- Target different Docker registries

## Manual Commands

If manual control is preferred, use these commands directly:

### Build Only

```bash
docker compose -f docker-compose/docker-compose.yml -f docker-compose/docker-compose.override.yml build
```

### Push Only

```bash
docker push michael55555/school-bud-e-frontend:next
```

### Build with Different Tag

```bash
docker compose -f docker-compose/docker-compose.yml build
docker tag school-bud-e-frontend:latest michael55555/school-bud-e-frontend:v1.0
docker push michael55555/school-bud-e-frontend:v1.0
```

## Workflow

### Standard Deployment Workflow

1. **Ensure you're logged into Docker Hub**:
   ```bash
   docker login
   ```

2. **Run the build and push script**:
   ```bash
   ./.claude/skills/docker-build-push/scripts/build_and_push.sh
   ```

3. **Verify the image was pushed**:
   ```bash
   docker pull michael55555/school-bud-e-frontend:next
   ```

### CI/CD Integration

For automated deployments, the script can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Build and Push Docker Image
  run: |
    docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}
    ./.claude/skills/docker-build-push/scripts/build_and_push.sh
```

## Troubleshooting

### Common Issues

**Build fails with "file not found"**:
- Ensure running the script from the project root directory
- Verify docker-compose files exist in `docker-compose/` directory

**Push fails with "unauthorized"**:
- Run `docker login` and authenticate with Docker Hub credentials
- Verify permission to push to the `michael55555/school-bud-e-frontend` repository

**Override file not found warning**:
- This is normal if no override file exists
- The build will proceed with only the base configuration
- Create `docker-compose/docker-compose.override.yml` if customization is needed

## Resources

### scripts/

- **build_and_push.sh** - Main automation script that handles the complete build and push workflow with error handling and colored output

### references/

No reference files are needed for this skill.

### assets/

No asset files are needed for this skill.
