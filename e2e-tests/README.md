# End-to-End Tests for School-Bud-E Frontend

This directory contains end-to-end tests for the School-Bud-E frontend application using Cypress and TypeScript.

## Prerequisites

- Node.js 22 or higher (will be automatically installed via nvm)
- nvm (Node Version Manager)
- A running instance of the School-Bud-E frontend application (on localhost:8000)

## Directory Structure

```
e2e-tests/
├── cypress/
│   ├── e2e/           # Test files
│   ├── fixtures/      # Test data
│   ├── support/       # Support files and commands
│   └── videos/        # Test recordings (created during test runs)
├── open-cypress.sh    # Script to open Cypress UI
├── run-cypress.sh     # Script to run Cypress tests headlessly
└── package.json
```

## Running Tests

There are two ways to run the tests:

### 1. Interactive Mode (Cypress UI)

To open the Cypress Test Runner UI:

```bash
./open-cypress.sh
```

This will:
- Ensure Node.js 22 is installed
- Install all dependencies
- Open the Cypress Test Runner
- Allow you to run tests interactively and see them execute in real time

### 2. Headless Mode

To run all tests in headless mode (CI/CD friendly):

```bash
./run-cypress.sh
```

This will:
- Ensure Node.js 22 is installed
- Install all dependencies
- Run all tests in headless mode
- Generate videos of test runs
- Output test results to the console

## Writing Tests

Tests are written in TypeScript and located in the `cypress/e2e` directory. Each test file should have the extension `.cy.ts`.

Example test structure:

```typescript
describe('Feature', () => {
  beforeEach(() => {
    cy.visit('/path')
  })

  it('should do something', () => {
    // Test code here
  })
})
```

## Configuration

The main Cypress configuration is in `cypress.config.ts`. The default configuration:
- Base URL: http://localhost:8000
- TypeScript support enabled
- Video recording enabled
- Screenshots on failure enabled

## Troubleshooting

1. If you get permission errors when running the scripts:
   ```bash
   chmod +x run-cypress.sh open-cypress.sh
   ```

2. If the application is not running:
   - Ensure the School-Bud-E frontend is running on port 8000
   - Check the baseUrl in cypress.config.ts matches your setup

3. If Node.js version issues occur:
   - Ensure nvm is installed
   - The scripts will automatically install Node.js 22 if needed 