#!/bin/bash
# Build and push Docker image for School Bud-E Frontend

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Docker build and push process...${NC}"

# Configuration
COMPOSE_FILE_BASE="docker-compose/docker-compose.yml"
COMPOSE_FILE_OVERRIDE="docker-compose/docker-compose.override.yml"
IMAGE_NAME="michael55555/school-bud-e-frontend:next"

# Check if docker-compose files exist
if [ ! -f "$COMPOSE_FILE_BASE" ]; then
    echo -e "${RED}Error: $COMPOSE_FILE_BASE not found${NC}"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE_OVERRIDE" ]; then
    echo -e "${YELLOW}Warning: $COMPOSE_FILE_OVERRIDE not found, proceeding with base config only${NC}"
    COMPOSE_ARGS="-f $COMPOSE_FILE_BASE"
else
    COMPOSE_ARGS="-f $COMPOSE_FILE_BASE -f $COMPOSE_FILE_OVERRIDE"
fi

# Build the Docker image
echo -e "${GREEN}Building Docker image...${NC}"
if docker compose $COMPOSE_ARGS build; then
    echo -e "${GREEN}✓ Docker build completed successfully${NC}"
else
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi

# Push the Docker image
echo -e "${GREEN}Pushing Docker image to registry...${NC}"
if docker push "$IMAGE_NAME"; then
    echo -e "${GREEN}✓ Docker push completed successfully${NC}"
    echo -e "${GREEN}Image available at: $IMAGE_NAME${NC}"
else
    echo -e "${RED}✗ Docker push failed${NC}"
    exit 1
fi

echo -e "${GREEN}All operations completed successfully!${NC}"
