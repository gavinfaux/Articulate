@echo off
setlocal enabledelayedexpansion

set BUILD_CMD=build
set MARKDOWN_CMD=build

:: Check for command line arguments
if "%~1"=="/?" goto usage
if "%~1"=="-?" goto usage

:arg_loop
if "%~1"=="" goto build
if /i "%~1"=="-c" (
    set BUILD_CMD=build:copy
    set MARKDOWN_CMD=build:copy
    shift
    goto arg_loop
)
if /i "%~1"=="-r" (
    set BUILD_CMD=build:release
    set MARKDOWN_CMD=build:release
    shift
    goto arg_loop
)
shift
goto arg_loop

:build
echo Building BackOffice with command: %BUILD_CMD%
cd BackOffice
call npm run %BUILD_CMD%
cd ..

echo.
echo Building MarkdownEditor with command: %MARKDOWN_CMD%
cd MarkdownEditor
call npm run %MARKDOWN_CMD%
cd ..

echo.
echo Build completed successfully!
goto :eof

:usage
echo Usage: build.cmd [options]
echo.
echo Options:
echo   -c     Build with copy (uses build:copy script)
echo   -r     Build for release (uses build:release script)
echo   -?     Show this help