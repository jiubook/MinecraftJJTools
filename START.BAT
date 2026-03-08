@echo off
setlocal enabledelayedexpansion
title Minecraft 新闻翻译工具 - 启动器

:: 设置代码页为 UTF-8 以支持中文
chcp 65001 >nul

echo ============================================================
echo    Minecraft 新闻翻译工具 - 自动启动器
echo ============================================================
echo.

:: ============================================================
:: 第一步：检测 Python 是否安装
:: ============================================================
echo [1/4] 检测 Python 环境...

:: 尝试获取 Python 版本
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python！
    echo.
    echo 请选择以下操作：
    echo   1. 手动安装 Python（推荐）
    echo   2. 尝试自动安装 Python（需要管理员权限）
    echo   3. 退出程序
    echo.
    set /p "choice=请输入选项 (1/2/3): "

    if "!choice!"=="1" (
        echo.
        echo 请访问以下网址下载并安装 Python 3.8 或更高版本：
        echo https://www.python.org/downloads/
        echo.
        echo 安装时请勾选 "Add Python to PATH" 选项！
        echo.
        pause
        goto :end
    ) else if "!choice!"=="2" (
        echo.
        echo [提示] 正在尝试通过 winget 安装 Python...
        echo [提示] 这需要 Windows 10/11 和管理员权限
        echo.
        winget install Python.Python.3.12
        if !errorlevel! neq 0 (
            echo [错误] 自动安装失败，请手动安装 Python
            pause
            goto :end
        )
        echo [成功] Python 安装完成，请重新运行此脚本
        pause
        goto :end
    ) else (
        echo 程序退出
        goto :end
    )
)

:: 显示 Python 版本
for /f "tokens=*" %%v in ('python --version 2^>^&1') do set "python_version=%%v"
echo [成功] 检测到 !python_version!
echo.

:: ============================================================
:: 第二步：检测 pip 是否可用
:: ============================================================
echo [2/4] 检测 pip 包管理器...

python -m pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] pip 不可用，尝试安装 pip...
    python -m ensurepip --default-pip
    if !errorlevel! neq 0 (
        echo [错误] pip 安装失败，请手动安装
        pause
        goto :end
    )
)

echo [成功] pip 可用
echo.

:: ============================================================
:: 第三步：检测并安装依赖库
:: ============================================================
echo [3/4] 检测依赖库...

:: 检查 requirements.txt 是否存在
if not exist "requirements.txt" (
    echo [警告] requirements.txt 不存在，创建默认配置...
    (
        echo requests^>=2.31.0
        echo beautifulsoup4^>=4.12.0
        echo urllib3^>=2.0.0
    ) > requirements.txt
)

:: 检测依赖是否已安装
set "need_install=0"

python -c "import requests" >nul 2>&1
if !errorlevel! neq 0 (
    echo [提示] 缺少依赖: requests
    set "need_install=1"
)

python -c "import bs4" >nul 2>&1
if !errorlevel! neq 0 (
    echo [提示] 缺少依赖: beautifulsoup4
    set "need_install=1"
)

python -c "import urllib3" >nul 2>&1
if !errorlevel! neq 0 (
    echo [提示] 缺少依赖: urllib3
    set "need_install=1"
)

:: 如果需要安装依赖
if "!need_install!"=="1" (
    echo.
    echo [提示] 检测到缺少依赖库，正在自动安装...
    echo [提示] 这可能需要几分钟时间，请耐心等待...
    echo.

    :: 尝试使用国内镜像源加速（如果失败则使用默认源）
    python -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
    if !errorlevel! neq 0 (
        echo [警告] 使用清华镜像源失败，尝试使用默认源...
        python -m pip install -r requirements.txt
        if !errorlevel! neq 0 (
            echo [错误] 依赖安装失败！
            echo.
            echo 请尝试手动安装：
            echo   python -m pip install -r requirements.txt
            echo.
            pause
            goto :end
        )
    )

    echo [成功] 依赖库安装完成
) else (
    echo [成功] 所有依赖库已安装
)
echo.

:: ============================================================
:: 第四步：运行主程序
:: ============================================================
echo [4/4] 启动主程序...
echo ============================================================
echo.

:main_loop
:: 查找最新的 Python 文件
set "pattern=%~1"
if "%pattern%"=="" set "pattern=*.py"

set "found_file="
for /f "delims=" %%f in ('dir /b /o-d /a-d %pattern% 2^>nul') do (
    set "found_file=%%f"
    goto :run_file
)

:: 如果没找到文件
echo [错误] 未找到匹配的 Python 文件
pause
goto :end

:run_file
echo [运行] %found_file%
echo.
python "%found_file%"

:: 程序运行结束
echo.
echo ============================================================
echo 程序执行完毕
echo ============================================================
echo.

:: 等待 3 秒后询问
timeout /t 3 /nobreak >nul

:ask_again
set /p "input=是否重新运行？(Y/N): "

if /i "%input%"=="Y" (
    echo.
    echo [提示] 重新运行程序...
    echo.
    goto :main_loop
) else if /i "%input%"=="N" (
    echo.
    echo [提示] 程序结束，感谢使用！
    goto :end
) else (
    echo [错误] 无效输入，请输入 Y 或 N
    goto :ask_again
)

:end
echo.
pause
endlocal
