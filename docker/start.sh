#!/bin/sh

echo "Starting container..."

if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules)" ]; then
  echo "node_modules is empty or missing. Installing dependencies..."
  pnpm install
else
  echo "Dependencies already installed."
fi

echo "Starting Next.js development server on port $PORT..."
pnpm dev