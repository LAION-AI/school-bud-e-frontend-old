# Testing Setup

This directory contains end-to-end (E2E) tests for the School Bud-E frontend application.

## Environment Setup

Before running the tests, you need to set up environment variables for API credentials.

### 1. Create Environment File

Copy the `.example.env` file from the project root to `.env`:

```bash
cp .example.env .env
```

### 2. Set Test Credentials

Add the following environment variables to your `.env` file:

```bash
# OpenAI credentials for E2E tests
TEST_OPENAI_API_KEY="your-actual-openai-api-key"
TEST_OPENAI_API_ENDPOINT="https://api.openai.com/v1/chat/completions"
TEST_OPENAI_MODEL_GPT4O="gpt-4o"
TEST_OPENAI_MODEL_GPT3_5="gpt-3.5-turbo"

# Invalid credentials for error testing
TEST_INVALID_API_KEY="invalid-test-key"
```

### 3. Required Credentials

- **TEST_OPENAI_API_KEY**: A valid OpenAI API key for testing AI features
- **TEST_OPENAI_API_ENDPOINT**: OpenAI API endpoint (usually the default)
- **TEST_OPENAI_MODEL_GPT4O**: GPT-4o model name
- **TEST_OPENAI_MODEL_GPT3_5**: GPT-3.5 model name
- **TEST_INVALID_API_KEY**: An invalid key for error testing scenarios

### 4. Security Notes

- ⚠️ **Never commit your `.env` file** - it's already in `.gitignore`
- 🔑 **Use test API keys** when possible, separate from production
- 🛡️ **Keep your API keys secure** and rotate them regularly

## Running Tests

After setting up the environment variables:

```bash
# Run all E2E tests
deno task test:e2e

# Run specific test files
deno task test:e2e tests/e2e/assignment-generation.test.ts
```

## Test Structure

- `tests/e2e/fixtures/credentials.ts` - Centralized credential management
- `tests/e2e/fixtures/test-helpers.ts` - Test utility functions
- `tests/e2e/assignment-generation*.test.ts` - Assignment generation tests

## Troubleshooting

### Environment Variable Not Found

If you get an error like `Environment variable TEST_OPENAI_API_KEY is required for tests`:

1. Check that your `.env` file exists in the project root
2. Verify the variable name matches exactly
3. Ensure there are no extra spaces in the `.env` file

### Invalid API Key Errors

If tests fail with authentication errors:

1. Verify your OpenAI API key is valid and active
2. Check that your API key has sufficient credits/quota
3. Ensure the API endpoint URL is correct 