---
name: remote-deploy
description: Deploy the School Bud-E Frontend application to a remote server via SSH. This skill should be used when deploying updates to production or staging servers, when explicitly asked to deploy to a remote server, or when updating a running deployment.
---

# Remote Deploy

## Overview

Automates the deployment of School Bud-E Frontend to a remote server via SSH. This skill handles the complete deployment workflow: pulling the latest Docker image, stopping old containers, and starting updated containers on the remote server.

## When to Use This Skill

Use this skill when:
- Deploying updates to production or staging servers
- Explicitly asked to "deploy to remote" or "deploy to server"
- Updating a running deployment after pushing new Docker images
- Rolling out configuration changes to remote environments
- Performing remote container restarts

## Prerequisites

Before using this skill, ensure:

1. **SSH Key Authentication**: Set up passwordless SSH access to the remote server
   ```bash
   ssh-copy-id -p 22 user@your.server.com
   ```

2. **Environment Variables**: Add deployment configuration to `.env`:
   ```env
   DEPLOY_HOST=your.server.com
   DEPLOY_USER=your-username
   DEPLOY_PATH=/path/to/deployment
   DEPLOY_PORT=22  # optional, defaults to 22
   ```

3. **Remote Server Setup**:
   - Docker and Docker Compose installed
   - Deployment directory exists at `DEPLOY_PATH`
   - `docker-compose.yml` configured in deployment directory
   - User has Docker permissions (in docker group)

For detailed environment variable setup, see `references/env_example.md`.

## Quick Start

To deploy to the remote server:

```bash
./.claude/skills/remote-deploy/scripts/deploy.sh
```

This script will:
1. Load deployment configuration from `.env`
2. Validate SSH connection to remote server
3. Execute deployment commands on the remote server:
   - Pull latest Docker images
   - Stop running containers
   - Start updated containers
4. Display container status

## Configuration

### Required Environment Variables

Add these to your `.env` file:

| Variable | Description | Example |
|----------|-------------|---------|
| `DEPLOY_HOST` | Server hostname or IP | `example.com` or `192.168.1.100` |
| `DEPLOY_USER` | SSH username | `ubuntu` or `deploy` |
| `DEPLOY_PATH` | Path to docker-compose directory | `/home/ubuntu/school-bud-e-frontend/docker-compose` |
| `DEPLOY_PORT` | SSH port (optional) | `22` (default) |

### Example Configuration

```env
# Production deployment
DEPLOY_HOST=prod.example.com
DEPLOY_USER=deploy
DEPLOY_PATH=/opt/school-bud-e-frontend/docker-compose
DEPLOY_PORT=22

# Staging deployment
# DEPLOY_HOST=staging.example.com
# DEPLOY_USER=ubuntu
# DEPLOY_PATH=/home/ubuntu/school-bud-e/docker-compose
```

## Deployment Workflow

### Standard Deployment Process

1. **Build and push new Docker image** (if needed):
   ```bash
   ./.claude/skills/docker-build-push/scripts/build_and_push.sh
   ```

2. **Deploy to remote server**:
   ```bash
   ./.claude/skills/remote-deploy/scripts/deploy.sh
   ```

3. **Verify deployment**:
   ```bash
   ssh user@server.com "cd /path/to/deployment && docker compose ps"
   ```

### Manual Deployment Commands

If you prefer to run commands manually:

```bash
# SSH into the server
ssh -p 22 user@your.server.com

# Navigate to deployment directory
cd /path/to/deployment

# Pull latest images
docker compose pull

# Restart services
docker compose down
docker compose up -d

# Check status
docker compose ps
```

## Troubleshooting

### SSH Connection Issues

**Problem**: SSH connection fails

**Solutions**:
- Verify SSH key authentication works: `ssh -p 22 user@server.com "echo OK"`
- Check DEPLOY_HOST and DEPLOY_USER are correct in `.env`
- Ensure SSH port (DEPLOY_PORT) is correct
- Check firewall rules allow SSH connections

### Docker Permission Issues

**Problem**: "permission denied while trying to connect to Docker daemon"

**Solutions**:
- Add user to docker group on remote server:
  ```bash
  sudo usermod -aG docker $USER
  ```
- Log out and back in for group changes to take effect
- Or run with sudo (not recommended for production)

### Path Not Found

**Problem**: "directory not found" or "docker-compose.yml not found"

**Solutions**:
- Verify DEPLOY_PATH is correct in `.env`
- SSH into server and check the directory exists:
  ```bash
  ssh user@server.com "ls -la /path/to/deployment"
  ```
- Ensure docker-compose.yml is in that directory

### Image Pull Fails

**Problem**: "failed to pull image"

**Solutions**:
- Verify Docker Hub credentials on remote server: `docker login`
- Check image name in docker-compose.yml matches pushed image
- Ensure remote server has internet access
- Check Docker Hub repository permissions

### Container Won't Start

**Problem**: Containers start but immediately exit

**Solutions**:
- Check logs on remote server:
  ```bash
  ssh user@server.com "cd /path/to/deployment && docker compose logs"
  ```
- Verify `.env` file exists in deployment directory with correct values
- Check port conflicts: `docker compose ps -a`
- Review container health with: `docker inspect <container_name>`

## Advanced Usage

### Multiple Deployment Targets

To manage multiple deployment targets (staging, production), use different .env files:

```bash
# Deploy to staging
cp .env.staging .env
./.claude/skills/remote-deploy/scripts/deploy.sh

# Deploy to production
cp .env.production .env
./.claude/skills/remote-deploy/scripts/deploy.sh
```

### CI/CD Integration

Integrate with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Deploy to Remote Server
  env:
    DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
    DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
    DEPLOY_PATH: ${{ secrets.DEPLOY_PATH }}
  run: |
    echo "DEPLOY_HOST=$DEPLOY_HOST" >> .env
    echo "DEPLOY_USER=$DEPLOY_USER" >> .env
    echo "DEPLOY_PATH=$DEPLOY_PATH" >> .env
    ./.claude/skills/remote-deploy/scripts/deploy.sh
```

### Custom Deployment Commands

Edit the script to add custom deployment steps:

1. Database migrations
2. Cache clearing
3. Health checks
4. Rollback capabilities
5. Backup creation

## Resources

### scripts/

- **deploy.sh** - Main deployment automation script that handles SSH connection, validation, and remote command execution

### references/

- **env_example.md** - Detailed documentation of required environment variables with examples and prerequisites
