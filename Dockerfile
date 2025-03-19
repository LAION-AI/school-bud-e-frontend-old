FROM denoland/deno:alpine

WORKDIR /school-bud-e-frontend

# Install git
RUN apk add --no-cache git

# Configure git
RUN git config --global --add safe.directory /school-bud-e-frontend

# Clone and setup the repository
RUN git clone -b main https://github.com/LAION-AI/school-bud-e-frontend.git .

# Build the application
RUN deno task build

EXPOSE 8000

CMD ["deno", "task", "preview"] 