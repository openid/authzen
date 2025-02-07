# Use a specific version of golang for reproducibility
FROM golang:1.23 AS external-pdp

# Copy go.mod and go.sum files and download dependencies
COPY ./authzen-external-authorizer/go.mod ./authzen-external-authorizer/go.sum ./
RUN go mod download

# Copy the source code and build the application
COPY ./authzen-external-authorizer/*.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /external-pdp

# Use a specific version of envoyproxy for reproducibility
FROM envoyproxy/envoy:v1.31-latest

# Copy the envoy configuration and entry script
COPY ./envoy/envoy.yaml /tmpl/envoy.yaml.tmpl
COPY ./envoy/envoy-entry.sh /
RUN chmod 500 /envoy-entry.sh

# Copy the built application from the previous stage
COPY --from=external-pdp /external-pdp /external-pdp
COPY openapi.json openapi.json
RUN chmod 500 /external-pdp

# Copy the docker entrypoint script and set permissions
COPY docker-entrypoint.sh /
RUN chmod 500 /docker-entrypoint.sh

# Install gettext for environment variable substitution
RUN apt-get update && apt-get install -y gettext && apt-get clean

# Set the entrypoint for the container
ENTRYPOINT ["/docker-entrypoint.sh"]
