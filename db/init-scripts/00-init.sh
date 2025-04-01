#!/bin/bash
set -e

echo "Installing Node.js dependencies for initialization scripts..."
cd /docker-entrypoint-initdb.d
npm install

echo "Node.js dependencies installed successfully" 