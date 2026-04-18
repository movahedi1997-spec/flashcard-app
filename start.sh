#!/bin/bash
# Kill any process holding port 3000 before starting
PID=$(ss -tlnp | grep ':3000' | grep -oP 'pid=\K[0-9]+')
if [ -n "$PID" ]; then
  echo "Killing process $PID on port 3000"
  kill -9 "$PID"
  sleep 1
fi
exec node_modules/.bin/next start
