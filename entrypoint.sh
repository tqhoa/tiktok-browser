#!/bin/sh
set -e

if [ "$VNC_ENABLED" = "1" ]; then
  echo "[entrypoint] VNC_ENABLED=1 - starting Xvfb + x11vnc + noVNC"

  export DISPLAY=:99
  SCREEN_RES="${VNC_SCREEN_RES:-1920x1080x24}"

  Xvfb "$DISPLAY" -screen 0 "$SCREEN_RES" -nolisten tcp &
  XVFB_PID=$!

  # Wait for X server to be ready
  for i in $(seq 1 30); do
    if xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done

  fluxbox &

  x11vnc -display "$DISPLAY" -forever -shared -rfbport 5900 -nopw -quiet &

  websockify --web=/usr/share/novnc/ "${NOVNC_PORT:-6080}" localhost:5900 &

  trap 'kill $XVFB_PID 2>/dev/null' EXIT
else
  echo "[entrypoint] VNC_ENABLED not set - running headless, no VNC"
fi

exec "$@"
