
import sys
import os
import time

# On ajoute le dossier actuel au path pour pouvoir importer main
sys.path.append(os.getcwd())

import main

# Simulation : On force une version locale très basse pour déclencher l'alerte
main.Api.VERSION = "0.1.0"

# On surcharge la méthode de vérification pour simuler une réponse positive immédiate
def mocked_check_version(self):
    print("[SIMULATION] Simulation d'une mise à jour détectée...")
    time.sleep(3) # On attend un peu après le splash screen
    if self._window:
        print("[SIMULATION] Envoi du signal showUpdateModal au frontend...")
        self._window.evaluate_js("showUpdateModal('1.5.0');")

main.Api._check_app_version = mocked_check_version

if __name__ == "__main__":
    print("Démarrage de la simulation de mise à jour...")
    main.start_app()
