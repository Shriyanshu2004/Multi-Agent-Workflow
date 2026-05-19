@echo off
cd /d "%~dp0backend"
if exist ".venv313\Scripts\python.exe" (
    .venv313\Scripts\python.exe main.py
) else if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe main.py
) else (
    python main.py
)
