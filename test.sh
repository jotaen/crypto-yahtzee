#!/bin/bash

./node_modules/.bin/mocha ${@} \
  --recursive \
  'src/**/*.spec.js'
