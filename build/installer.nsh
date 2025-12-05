; Custom NSIS script for DALIT installer
; Installs Visual C++ Redistributable if needed

!macro customInstall
  ; Check if VC++ Redistributable is installed
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Version"
  ${If} $0 == ""
    ; Also check WOW6432Node
    ReadRegStr $0 HKLM "SOFTWARE\WOW6432Node\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Version"
  ${EndIf}
  
  ${If} $0 == ""
    DetailPrint "Installing Visual C++ Redistributable..."
    SetOutPath "$INSTDIR\resources\redist"
    
    ; Run VC++ installer silently
    nsExec::ExecToLog '"$INSTDIR\resources\redist\vc_redist.x64.exe" /install /quiet /norestart'
    Pop $0
    
    ${If} $0 != 0
      ; If silent install fails, try with UI
      DetailPrint "Silent install failed, trying with UI..."
      ExecWait '"$INSTDIR\resources\redist\vc_redist.x64.exe" /install /passive /norestart'
    ${EndIf}
    
    DetailPrint "Visual C++ Redistributable installation completed."
  ${Else}
    DetailPrint "Visual C++ Redistributable already installed (version: $0)"
  ${EndIf}
!macroend

!macro customUnInstall
  ; Nothing special needed for uninstall
!macroend
