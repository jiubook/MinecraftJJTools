@echo off
chcp 65001 >nul
title Minecraft 新闻翻译工具

echo ============================================================
echo    Minecraft 新闻翻译工具 - 快速启动
echo ============================================================
echo.

:main_loop
:: 运行主程序
python JBAiGNN_JiuBookAiGetNewestNews.py

:: 询问是否重新运行
echo.
echo ============================================================
set /p "input=是否重新运行？(Y/N): "

if /i "%input%"=="Y" (
    echo.
    goto :main_loop
) else (
    echo.
    echo 程序结束，感谢使用！
    pause
    exit
)
