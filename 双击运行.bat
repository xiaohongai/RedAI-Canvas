@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
title RedAI-Canvas
cd /d "%~dp0"

echo ========================================
echo   RedAI-Canvas 正在启动...
echo   访问地址: http://localhost:8777
echo   请勿关闭此窗口
echo ========================================
echo.

set "PY="
if exist "venv\python.exe" set "PY=venv\python.exe"
if not defined PY if exist "venv\Scripts\python.exe" set "PY=venv\Scripts\python.exe"
if not defined PY (
  where python >nul 2>&1 && set "PY=python"
)
if not defined PY (
  echo [错误] 未找到 Python。请安装 Python 3.12+，或使用完整整合包。
  pause
  exit /b 1
)

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8777/"

"%PY%" server.py
if errorlevel 1 (
  echo.
  echo [错误] 服务异常退出
  pause
  exit /b 1
)
endlocal
exit /b 0
