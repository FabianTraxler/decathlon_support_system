# Build stage
FROM rust:1.85-slim-bullseye as builder

WORKDIR /app

# Copy the source code
COPY . .

# Build the application
RUN cargo build --release

# # Production stage
FROM debian:bullseye-slim

WORKDIR /usr/local/bin

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/target/release/decathlon_support_system .
COPY --from=builder /app/assets ./assets


CMD ["./decathlon_support_system"]
