#!/usr/bin/env bash
# exit on error
set -o errexit

# Build Backend
npm install --include=dev
npm run build

# Build Frontend
cd src/vue-frontend
npm install --include=dev
npm run build
cd ../..
