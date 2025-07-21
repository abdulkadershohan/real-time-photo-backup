@echo off

cd /d "%~dp0backend"
start cmd /k "node index"

cd /d "%~dp0multi-file-uploader"
start cmd /k "npm start"

exit
