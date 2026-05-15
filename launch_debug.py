
import sys
import traceback
import os

try:
    print("Démarrage du test de lancement...")
    import main
    print("Import main OK")
    main.start_app()
    print("App lancée (webview.start terminée)")
except Exception as e:
    print("ERREUR DÉTECTÉE :")
    traceback.print_exc()
    with open("crash_report.txt", "w") as f:
        traceback.print_exc(file=f)
