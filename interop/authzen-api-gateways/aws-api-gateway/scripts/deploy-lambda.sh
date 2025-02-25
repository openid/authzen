#!/bin/bash

rm deploy.zip
zip -r deploy.zip ./*
aws lambda update-function-code --function-name authzen-authorizer --zip-file fileb://${PWD}/deploy.zip