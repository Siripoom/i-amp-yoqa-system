#!/usr/bin/env bash
# exit on error
set -o errexit

# Install LibreOffice
apt-get update
apt-get install -y libreoffice

# Install Node.js dependencies
npm install
