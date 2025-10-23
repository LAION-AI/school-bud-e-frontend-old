# Deployment Environment Variables

Add these variables to your `.env` file to enable remote deployment:

```env
# Remote Deployment Configuration
DEPLOY_HOST=your.server.com           # The hostname or IP of your deployment server
DEPLOY_USER=your-username             # SSH username for the server
DEPLOY_PATH=/path/to/deployment       # Path on server where docker-compose.yml is located
DEPLOY_PORT=22                        # SSH port (optional, defaults to 22)
```

## Example Configuration

```env
# Example for a typical deployment
DEPLOY_HOST=example.com
DEPLOY_USER=ubuntu
DEPLOY_PATH=/home/ubuntu/school-bud-e-frontend/docker-compose
DEPLOY_PORT=22
```

## Prerequisites

1. **SSH Access**: Ensure you can SSH into the server without password (SSH key authentication)
   ```bash
   ssh-copy-id -p 22 user@your.server.com
   ```

2. **Docker & Docker Compose**: Must be installed on the remote server

3. **Deployment Directory**: The `DEPLOY_PATH` must contain:
   - `docker-compose.yml`
   - `.env` file with service configuration
   - Any other required configuration files

## Testing SSH Connection

Before running deployment, test your SSH connection:

```bash
ssh -p 22 user@your.server.com "echo 'Connection successful'"
```

If this works, the deployment script should work as well.
