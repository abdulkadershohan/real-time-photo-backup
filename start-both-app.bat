@echo off

cd /d "%~dp0backend"
start "" /b node index

cd /d "%~dp0multi-file-uploader"
start "" /b npm start

exit
