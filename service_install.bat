rem C:\nssm\win64\nssm install KatoExpress "C:\Program Files\nodejs\node.exe"
rem C:\nssm\win64\nssm set KatoExpress AppDirectory "D:\WorkspaceAndroid\KatoExpress"
rem C:\nssm\win64\nssm set KatoExpress AppParameters C:\Users\alexh\AppData\Roaming\npm\node_modules\nodemon\bin\nodemon.js
rem C:\nssm\win64\nssm start KatoExpress

C:\nssm\win64\nssm install KatoExpress "C:\Program Files\nodejs\node.exe"
C:\nssm\win64\nssm set KatoExpress AppDirectory "D:\WorkspaceAndroid\KatoExpress"
C:\nssm\win64\nssm set KatoExpress AppParameters dist\server.js
C:\nssm\win64\nssm start KatoExpress
