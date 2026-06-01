#!/bin/bash
cd "$(dirname "$0")"

echo "========================================"
echo "  RedAI-Canvas 正在启动..."
echo "  访问地址: http://localhost:8777"
echo "  请勿关闭此窗口"
echo "========================================"
echo

if [ -x "./venv/bin/python3" ]; then
  PY="./venv/bin/python3"
elif [ -x "./venv/bin/python" ]; then
  PY="./venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PY="python3"
else
  PY="python"
fi

(sleep 2 && open "http://localhost:8777/" >/dev/null 2>&1) &

exec "$PY" server.py
