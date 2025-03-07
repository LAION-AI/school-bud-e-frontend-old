#!/bin/bash

# Exit on error
set -e

# Load nvm (Node Version Manager)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node.js version 22
nvm install 22
nvm use 22

# Install dependencies if needed
npm install

# Open Cypress test runner
npm run cypress:open 