Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "start-both-app.bat" & chr(34), 0
Set WshShell = Nothing
