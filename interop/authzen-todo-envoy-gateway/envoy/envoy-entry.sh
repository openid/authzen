#!/bin/sh
set -e

echo "Generating envoy.yaml config file..."
cat /tmpl/envoy.yaml.tmpl | envsubst \$PORT > /etc/envoy.yaml
echo "Starting Envoy..."
/usr/local/bin/envoy -c /etc/envoy.yaml
