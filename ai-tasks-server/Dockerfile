# syntax=docker/dockerfile:1.4
FROM python:3.11-slim

WORKDIR /app

ENV ENABLE_DEBUG=false

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt && \
    if [ "$ENABLE_DEBUG" = "true" ] ; then pip install --no-cache-dir debugpy ; fi

COPY . .

CMD ["sh", "-c", "if [ \"$ENABLE_DEBUG\" = \"true\" ]; then exec python -m debugpy --wait-for-client --listen 0.0.0.0:5678 -m uvicorn app.main:app --host 0.0.0.0 --port 8083; else exec uvicorn app.main:app --host 0.0.0.0 --port 8083; fi"]
