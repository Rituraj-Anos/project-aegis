#!/bin/bash
URL=$1

if curl -s -f "$URL/health" > /dev/null; then
  echo "Health check passed"
  exit 0
else
  echo "Health check failed"
  exit 1
fi
