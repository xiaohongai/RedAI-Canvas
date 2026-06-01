@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
title RedAI-Canvas - 授权系统测试
cd /d "%~dp0"

if not exist ".Advanced" (
  echo.>".Advanced"
  echo 已创建 .Advanced 标记，启用高级/授权测试模式。
) else (
  echo .Advanced 已存在，继续以高级模式启动。
)
echo.

call "%~dp0双击运行.bat"
endlocal
