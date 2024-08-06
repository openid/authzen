#!/bin/bash

# bump the patch number in the version 
VERSION=$(npm version patch)

git commit -am "bumped version to $VERSION"
git push
git tag $VERSION
git push --tags
