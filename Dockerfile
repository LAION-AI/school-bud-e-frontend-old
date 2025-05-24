FROM denoland/deno:alpine

# Add build argument for branch
ARG BRANCH=main

WORKDIR /school-bud-e-frontend

# Install git
RUN apk add --no-cache git

# Configure git
RUN git config --global --add safe.directory /school-bud-e-frontend

# Clone and setup the repository using the specified branch
RUN git clone -b ${BRANCH} https://github.com/LAION-AI/school-bud-e-frontend.git .

RUN deno --version

# Build the application
RUN deno task build

EXPOSE 8000

CMD ["deno", "task", "preview"] 