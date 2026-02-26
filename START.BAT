@echo off
setlocal enabledelayedexpansion

:: 设置代码页为UTF-8以解决中文乱码问题
chcp 65001 >nul

:main_loop
set "pattern=%~1"
if "%pattern%"=="" set "pattern=*.py"

echo 正在查找文件...

:: 按修改时间排序，获取最新的文件
for /f "delims=" %%f in ('dir /b /o-d /a-d %pattern% 2^>nul') do (
    echo 运行最新的文件: %%f
    python "%%f"

    echo.
    echo 5秒后将询问是否重新运行...
    timeout /t 5 /nobreak >nul

    :ask_again
    echo.
    set /p "input=是否重新运行？(Y/N): "

    if /i "%input%"=="Y" (
        echo 重新运行...
        goto :main_loop
    ) else if /i "%input%"=="N" (
        echo 程序结束
        goto :end
    ) else (
        echo 无效输入，请重新输入
        goto :ask_again
    )
)

echo 未找到匹配的文件
:end
endlocal