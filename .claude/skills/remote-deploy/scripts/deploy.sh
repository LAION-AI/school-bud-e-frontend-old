#!/bin/bash
# Deploy School Bud-E Frontend to remote server via SSH

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== School Bud-E Frontend Remote Deployment ===${NC}"

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -E 'DEPLOY_HOST|DEPLOY_USER|DEPLOY_PATH|DEPLOY_PORT' | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Validate required environment variables
if [ -z "$DEPLOY_HOST" ]; then
    echo -e "${RED}Error: DEPLOY_HOST not set in .env${NC}"
    echo -e "${YELLOW}Add the following to your .env file:${NC}"
    echo -e "DEPLOY_HOST=your.server.com"
    echo -e "DEPLOY_USER=your-username"
    echo -e "DEPLOY_PATH=/path/to/deployment"
    echo -e "DEPLOY_PORT=22  # optional, defaults to 22"
    exit 1
fi

if [ -z "$DEPLOY_USER" ]; then
    echo -e "${RED}Error: DEPLOY_USER not set in .env${NC}"
    exit 1
fi

if [ -z "$DEPLOY_PATH" ]; then
    echo -e "${RED}Error: DEPLOY_PATH not set in .env${NC}"
    exit 1
fi

# Default SSH port to 22 if not specified
DEPLOY_PORT=${DEPLOY_PORT:-22}

# SSH connection string
SSH_CONN="${DEPLOY_USER}@${DEPLOY_HOST}"
SSH_OPTS="-p ${DEPLOY_PORT}"

echo -e "${GREEN}Deployment Configuration:${NC}"
echo -e "  Host: ${DEPLOY_HOST}"
echo -e "  User: ${DEPLOY_USER}"
echo -e "  Path: ${DEPLOY_PATH}"
echo -e "  Port: ${DEPLOY_PORT}"
echo ""

# Test SSH connection
echo -e "${BLUE}Testing SSH connection...${NC}"
if ssh ${SSH_OPTS} ${SSH_CONN} "echo 'Connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ SSH connection failed${NC}"
    echo -e "${YELLOW}Make sure you can SSH to the server: ssh ${SSH_OPTS} ${SSH_CONN}${NC}"
    exit 1
fi

# Execute deployment commands on remote server
echo -e "${BLUE}Executing deployment commands on remote server...${NC}"

ssh ${SSH_OPTS} ${SSH_CONN} << ENDSSH
    set -e

    echo -e "${GREEN}Navigating to deployment directory...${NC}"
    cd ${DEPLOY_PATH}

    echo -e "${GREEN}Pulling latest Docker image...${NC}"
    docker compose pull

    echo -e "${GREEN}Stopping containers...${NC}"
    docker compose down

    echo -e "${GREEN}Starting containers...${NC}"
    docker compose up -d

    echo -e "${GREEN}Checking container status...${NC}"
    docker compose ps
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi
