#!/bin/bash
# Kill any process holding port 3000 before starting
fuser -k 3000/tcp 2>/dev/null || true
sleep 1
exec node_modules/.bin/next start
