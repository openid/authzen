#!/bin/bash

REGISTRY=${REGISTRY:-gcr.io}
PROJECT=${PROJECT:-authzen-457117}
IMAGE=${IMAGE:-authzen-todo-backend}

# extract version from package.json
VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

# submit the build to google cloud build and tag the image with the version
gcloud builds submit --tag $REGISTRY/$PROJECT/$IMAGE:$VERSION
