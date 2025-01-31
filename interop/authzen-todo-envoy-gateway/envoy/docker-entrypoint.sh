#!/bin/sh
set -e

echo "Generating envoy.yaml config file..."
cat /tmpl/envoy.yaml.tmpl | envsubst \$TODO_BACKEND,\$TODO_BACKEND_PORT,\$PORT,\$AUTHZEN_PROXY,\$AUTHZEN_PROXY_PORT > /etc/envoy.yaml
cat /etc/envoy.yaml
echo "Starting Envoy..."
/usr/local/bin/envoy -c /etc/envoy.yaml
