; Branding for the electron-builder NSIS installer.
; customWelcomePage runs before the first MUI page (where MUI fixes its colours); customHeader runs after the pages.
!macro customHeader
  BrandingText "Vateko.fun"
!macroend

!macro customWelcomePage
  !define MUI_BGCOLOR 000000
  !define MUI_TEXTCOLOR FFFFFF
  !define MUI_INSTFILESPAGE_COLORS "FFFFFF 000000"
  !define MUI_INSTFILESPAGE_PROGRESSBAR colored
  !define MUI_WELCOMEPAGE_TITLE "Vateko.fun"
  !define MUI_WELCOMEPAGE_TEXT "Music without limits.$\r$\n$\r$\nThis wizard installs Vateko.fun on your computer.$\r$\n$\r$\nClick Next to continue."
  !insertmacro MUI_PAGE_WELCOME
!macroend

; after every install / update: tell Explorer to reload icons, otherwise the desktop shortcut can show a blank page icon
!macro customInstall
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend
