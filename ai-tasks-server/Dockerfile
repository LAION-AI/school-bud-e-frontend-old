FROM python:3.11-slim

WORKDIR /app

# Add debugging packages
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Debug: Show Python version and location
RUN python --version && which python

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Debug: Show installed packages
RUN pip list

COPY . .

# Debug: Show directory structure
RUN ls -la && echo "=== app directory ===" && ls -la app/

# Debug: Show main.py content
RUN cat app/main.py

# Use shell form to ensure proper signal handling
CMD uvicorn app.main:app --host 0.0.0.0 --port 8083 --reload --log-level debug
