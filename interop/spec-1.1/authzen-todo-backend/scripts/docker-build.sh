#!/bin/bash

# default image name (if not passed into script as env variable)
IMAGE=${IMAGE:-authzen-todo-backend-spec-1-1}

docker build --tag ghcr.io/aserto-dev/$IMAGE .
