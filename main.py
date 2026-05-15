import webview
import yt_dlp
import os
import threading
import time
import json
import ctypes
import sys
from PIL import Image
import pystray
from pystray import MenuItem as item

# Augmentation de la limite de récursion pour éviter les crashs liés à l'AccessibilityObject sur Windows
sys.setrecursionlimit(10000)
# Désactiver l'accélération matérielle et l'accessibilité pour éviter les crashs et les boucles infinies sur Windows
os.environ['PYWEBVIEW_GPU'] = '0'
os.environ['WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS'] = '--disable-features=Accessibility,RendererAccessibility --disable-renderer-accessibility'

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

def setup_tray(window):
    def on_show(icon, item):
        window.show()
        window.restore()

    def on_exit(icon, item):
        icon.stop()
        os._exit(0)

    try:
        image = Image.open(resource_path('ui/logo.png'))
        menu = pystray.Menu(
            item('Afficher RoYout', on_show),
            item('Quitter', on_exit)
        )
        icon = pystray.Icon("RoYout", image, "RoYout", menu)
        threading.Thread(target=icon.run, daemon=True).start()
    except Exception as e:
        # On ne peut pas loguer ici car l'instance Api n'est pas forcément accessible facilement
        print(f"Erreur Tray: {e}")

try:
    myappid = 'royindustrie.royout.downloader.1.0'
    ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
except:
    pass

class Api:
    VERSION = "1.1.0"

    def __init__(self):
        self._window = None
        self.last_update_time = 0
        self.is_downloading = False
        self.download_queue = []
        self.current_task = None
        self.queue_lock = threading.Lock()
        
        self.last_folder = os.path.join(os.path.expanduser("~"), "Downloads")
        
        # Gestion de l'argument (clic droit Windows)
        if len(sys.argv) > 1:
            potential_path = sys.argv[1]
            if os.path.isdir(potential_path):
                self.last_folder = potential_path
                self._log(f"Démarrage via menu contextuel dans : {potential_path}")

        if not os.path.exists(self.last_folder):
            self.last_folder = os.path.expanduser("~/Desktop")
        
        self.app_data_dir = os.path.join(os.getenv('APPDATA'), 'RoYout')
        if not os.path.exists(self.app_data_dir):
            try:
                os.makedirs(self.app_data_dir)
            except Exception:
                self.app_data_dir = os.path.expanduser("~")
        
        self.history_file = os.path.join(self.app_data_dir, "history.json")
        self.favorites_file = os.path.join(self.app_data_dir, "favorites.json")
        self.settings_file = os.path.join(self.app_data_dir, "settings.json")
        self.log_file = os.path.join(self.app_data_dir, "debug.log")
        self._init_history()
        self._init_favorites()
        self._init_settings()
        self._log(f"--- Démarrage de RoYout v{self.VERSION} ---")
        
        # Tâches de fond (Réactivées après stabilisation)
        threading.Thread(target=self._check_updates_ytdlp, daemon=True).start()
        threading.Thread(target=self._check_app_version, daemon=True).start()
        threading.Thread(target=self._check_ffmpeg, daemon=True).start()
        # threading.Thread(target=self._clipboard_monitor, daemon=True).start()
        # self._warmup_ytdlp() # Désactivé pour la stabilité
        self.monitor_clipboard = True
        self.last_clipboard = ""
        self.scheduled_tasks = []
        self.ydl_search = None
        self.ydl_info = None
        self.ydl_discovery = None
        self._lock_search = threading.Lock()
        self._lock_info = threading.Lock()
        self._lock_discovery = threading.Lock()
        self._analyzing_urls = set()
        self._lock_analyzing = threading.Lock()
        self.current_search_id = 0

    def schedule_download(self, url, format_id, folder, delay_seconds, language=None):
        """Planifie un téléchargement pour plus tard"""
        try:
            delay = int(delay_seconds)
            meta = getattr(self, 'last_metadata', {})
            title = meta.get('title', 'Vidéo planifiée')
            
            def trigger():
                self._log(f"Déclenchement de la tâche planifiée : {title}")
                self.download_video(url, format_id, folder, language)
                # Retirer de la liste des planifiés
                self.scheduled_tasks = [t for t in self.scheduled_tasks if t['url'] != url]
            
            timer = threading.Timer(delay, trigger)
            timer.start()
            
            self.scheduled_tasks.append({
                'url': url,
                'title': "Planifié",
                'thumbnail': "logo.png",
                'time': time.strftime('%H:%M:%S', time.localtime(time.time() + delay)),
                'timer': timer
            })
            return {"status": "success", "message": f"Téléchargement planifié dans {delay_seconds} secondes"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def check_for_updates(self):
        """Déclenche manuellement la vérification des mises à jour"""
        self._log("Vérification manuelle des mises à jour demandée.")
        threading.Thread(target=self._check_app_version, daemon=True).start()
        return {"status": "success", "message": "Recherche de mise à jour lancée..."}

    def _notify(self, title, message):
        """Affiche une notification système de manière sécurisée"""
        try:
            # On log d'abord pour être sûr d'avoir une trace
            self._log(f"NOTIFICATION: {title} - {message}")
            
            # On tente la notification plyer dans un thread séparé pour ne pas bloquer
            def run_notify():
                try:
                    notification.notify(
                        title=title,
                        message=message,
                        app_name="RoYout",
                        timeout=5
                    )
                except: pass
            
            threading.Thread(target=run_notify, daemon=True).start()
        except:
            pass

    def view_logs(self):
        """Ouvre le fichier de log avec l'éditeur par défaut"""
        try:
            if os.path.exists(self.log_file):
                os.startfile(self.log_file)
                return {"status": "success", "message": "Ouverture des logs..."}
            else:
                return {"status": "error", "message": "Fichier log introuvable."}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def install_context_menu(self):
        """Ajoute RoYout au menu contextuel (clic droit) de Windows"""
        if sys.platform != 'win32': return {"status": "error", "message": "Windows uniquement."}
        
        try:
            import winreg
            # Chemin de l'exécutable
            exe_path = sys.executable if not getattr(sys, 'frozen', False) else sys.executable
            
            # 1. Clic droit sur le fond d'un dossier
            key_path = r"Software\Classes\Directory\Background\shell\RoYout"
            with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path) as key:
                winreg.SetValue(key, "", winreg.REG_SZ, "Ouvrir avec RoYout")
                winreg.SetValueEx(key, "Icon", 0, winreg.REG_SZ, exe_path)
                with winreg.CreateKey(key, "command") as cmd_key:
                    winreg.SetValue(cmd_key, "", winreg.REG_SZ, f'"{exe_path}" "%V"')

            # 2. Clic droit sur un dossier lui-même
            key_path_folder = r"Software\Classes\Directory\shell\RoYout"
            with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path_folder) as key:
                winreg.SetValue(key, "", winreg.REG_SZ, "Ouvrir avec RoYout")
                winreg.SetValueEx(key, "Icon", 0, winreg.REG_SZ, exe_path)
                with winreg.CreateKey(key, "command") as cmd_key:
                    winreg.SetValue(cmd_key, "", winreg.REG_SZ, f'"{exe_path}" "%1"')

            self._notify("Système", "Intégration Windows activée !")
            return {"status": "success", "message": "Intégration Windows activée !"}
        except Exception as e:
            self._log(f"Erreur intégration : {e}")
            return {"status": "error", "message": "Échec de l'intégration."}

    def _clipboard_monitor(self):
        """Surveille le presse-papiers pour détecter des liens YouTube (Version stable Windows)"""
        if sys.platform != 'win32': return
        
        self._log("Surveillance du presse-papiers (Native) activée.")
        import ctypes
        from ctypes import wintypes

        user32 = ctypes.windll.user32
        kernel32 = ctypes.windll.kernel32
        
        while True:
            try:
                if not self.monitor_clipboard:
                    time.sleep(2)
                    continue
                
                # Accès natif au presse-papiers Windows pour éviter les crashs Tkinter
                if user32.OpenClipboard(None):
                    if user32.IsClipboardFormatAvailable(1): # 1 = CF_TEXT
                        h_clip_mem = user32.GetClipboardData(1)
                        if h_clip_mem:
                            p_clip_mem = kernel32.GlobalLock(h_clip_mem)
                            if p_clip_mem:
                                text = ctypes.c_char_p(p_clip_mem).value.decode('utf-8', 'ignore')
                                kernel32.GlobalUnlock(h_clip_mem)
                                
                                if text and text != self.last_clipboard and ("youtube.com/" in text or "youtu.be/" in text):
                                    self.last_clipboard = text
                                    self._log(f"Lien détecté : {text}")
                                    if self._window:
                                        self._window.evaluate_js(f"if(window.onClipboardLink) window.onClipboardLink('{text}');")
                    user32.CloseClipboard()
            except Exception:
                pass
            time.sleep(2)

    def _get_ydl_search_options(self):
        """Retourne les options de base pour la recherche"""
        return {
            'quiet': True, 
            'extract_flat': True, 
            'skip_download': True, 
            'check_update': False, 
            'socket_timeout': 15, # Plus de temps pour la première connexion
            'no_warnings': True,
            'nocheckcertificate': True,
            'cachedir': False,
            'no_color': True,
            'proxy': None,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'referer': 'https://www.youtube.com/',
            'ignoreerrors': True, # Ne pas s'arrêter si une vidéo pose problème
            'headers': {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        }

    def _get_ydl_info(self):
        """Moteur persistant pour l'analyse d'URL"""
        with self._lock_info:
            if self.ydl_info is None:
                self.ydl_info = yt_dlp.YoutubeDL({'quiet': True, 'no_warnings': True, 'check_update': False, 'socket_timeout': 15})
            return self.ydl_info

    def _get_ydl_discovery(self):
        """Moteur persistant pour la découverte automatique"""
        with self._lock_discovery:
            if self.ydl_discovery is None:
                self.ydl_discovery = yt_dlp.YoutubeDL({
                    'quiet': True, 
                    'extract_flat': True, 
                    'skip_download': True, 
                    'check_update': False, 
                    'socket_timeout': 10,
                    'lazy_playlist': True,
                    'no_warnings': True
                })
            return self.ydl_discovery

    def _warmup_ytdlp(self):
        """Lancement des moteurs en arrière-plan"""
        # On ne préchauffe plus search car c'est une instance fraîche, mais on garde discovery et info
        threading.Thread(target=self._get_ydl_discovery, daemon=True).start()
        threading.Thread(target=self._get_ydl_info, daemon=True).start()

    def _check_ffmpeg(self):
        """Vérifie si FFmpeg est présent, sinon tente de proposer une solution"""
        import shutil
        ffmpeg_found = shutil.which("ffmpeg") or os.path.exists(resource_path("ffmpeg.exe"))
        ffprobe_found = shutil.which("ffprobe") or os.path.exists(resource_path("ffprobe.exe"))

        if not ffmpeg_found or not ffprobe_found:
            self._log("ATTENTION : FFmpeg ou FFprobe manquant !")
            if self._window:
                time.sleep(6) # Attendre que l'UI soit stable
                self._window.evaluate_js("if(window.showToast) window.showToast('FFmpeg est manquant. Certains téléchargements HD/MP3 peuvent échouer.');")
        else:
            self._log("FFmpeg et FFprobe détectés avec succès.")

    def _check_app_version(self):
        """Vérifie si une nouvelle version est disponible (Version Blindée)"""
        try:
            import urllib.request
            import ssl
            # On ignore les erreurs de certificat SSL qui sont fréquentes sur Windows
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            
            url = "https://raw.githubusercontent.com/seritagroroy-oss/ROYOUT-V2/main/version.txt"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            
            with urllib.request.urlopen(req, timeout=10, context=ctx) as response:
                remote_version = response.read().decode('utf-8').strip()
                
                if remote_version > self.VERSION:
                    settings = self._get_settings()
                    last_notify = settings.get("last_update_notification", 0)
                    now = time.time()
                    
                    if (now - last_notify) > 604800:
                        self._log(f"Mise à jour détectée : {remote_version}")
                        time.sleep(2)
                        if self._window:
                            self._window.evaluate_js(f"if(window.showUpdateModal) window.showUpdateModal('{remote_version}');")
                else:
                    if self._window:
                        self._window.evaluate_js("if(window.showToast) window.showToast('Votre version est à jour (v' + '" + self.VERSION + "' + ')');")
        except Exception as e:
            err_msg = str(e)
            self._log(f"Erreur vérification version : {err_msg}")
            if self._window:
                # On affiche l'erreur réelle pour diagnostiquer
                self._window.evaluate_js(f"if(window.showToast) window.showToast('Erreur mise à jour : {self._js_safe(err_msg)}');")

    def mark_update_as_ignored(self):
        """Enregistre la date actuelle pour ne pas réafficher l'alerte avant 7 jours"""
        settings = self._get_settings()
        settings["last_update_notification"] = time.time()
        self._save_settings(settings)
        self._log("Mise à jour ignorée pour 7 jours.")
        return True

    def _init_settings(self):
        if not os.path.exists(self.settings_file):
            default_settings = {
                "last_update_notification": 0,
                "theme": "dark"
            }
            with open(self.settings_file, 'w', encoding='utf-8') as f:
                json.dump(default_settings, f, indent=4)

    def _get_settings(self):
        try:
            if os.path.exists(self.settings_file):
                with open(self.settings_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except: pass
        return {"last_update_notification": 0}

    def _save_settings(self, settings):
        try:
            with open(self.settings_file, 'w', encoding='utf-8') as f:
                json.dump(settings, f, indent=4)
        except: pass

    def _log(self, message):
        """Écrit dans la console et dans le fichier de log"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        try:
            # On imprime en UTF-8 si possible, sinon on replie sur l'encodage du système
            print(log_entry)
        except:
            try:
                print(log_entry.encode(sys.stdout.encoding, errors='replace').decode(sys.stdout.encoding))
            except:
                pass
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(log_entry + "\n")
        except:
            pass

    def set_window(self, window):
        self._window = window
        # if sys.platform == 'win32':
        #    threading.Thread(target=self._apply_window_style, daemon=True).start()

    def _apply_window_style(self):
        """Applique le Dark Mode et tente de masquer l'icône (Boucle forcée)"""
        try:
            import ctypes
            import time
            for _ in range(20): # 10 secondes de surveillance
                time.sleep(0.5)
                hwnd = ctypes.windll.user32.FindWindowW(None, '')
                if not hwnd: hwnd = ctypes.windll.user32.GetActiveWindow()
                
                if hwnd:
                    # 1. Dark Mode
                    ctypes.windll.dwmapi.DwmSetWindowAttribute(hwnd, 20, ctypes.byref(ctypes.c_int(1)), 4)
                    # 2. Bordure Rouge
                    ctypes.windll.dwmapi.DwmSetWindowAttribute(hwnd, 34, ctypes.byref(ctypes.c_int(0x003333FF)), 4)
                    
                    # 3. Masquage icône désactivé (on veut l'icône)
                    # style = ctypes.windll.user32.GetWindowLongW(hwnd, -20)
                    # ctypes.windll.user32.SetWindowLongW(hwnd, -20, (style & ~0x00000080) | 0x00000001)
                    
                    # 4. Rafraîchir le cadre
                    ctypes.windll.user32.SetWindowPos(hwnd, 0, 0, 0, 0, 0, 0x0027)
        except:
            pass

    def get_queue(self):
        with self.queue_lock:
            return {"current": self.current_task, "queue": self.download_queue}

    def _check_updates_ytdlp(self):
        try:
            import subprocess
            # Sur Windows, on utilise STARTUPINFO pour cacher totalement la fenêtre CMD de pip
            si = None
            if sys.platform == 'win32':
                si = subprocess.STARTUPINFO()
                si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                si.wShowWindow = 0 # SW_HIDE

            subprocess.run([sys.executable, "-m", "pip", "install", "-U", "yt-dlp"], 
                           capture_output=True, startupinfo=si, timeout=120)
            self._log("Vérification yt-dlp terminée.")
        except Exception as e: 
            self._log(f"Erreur update yt-dlp : {e}")

    def _notify(self, title, message):
        try:
            import winsound
            winsound.MessageBeep()
            if self._window:
                self._window.evaluate_js(f"if(window.showToast) window.showToast('{self._js_safe(message)}');")
            from plyer import notification
            notification.notify(title=title, message=message, app_name='RoYout', timeout=5)
        except: pass

    def _init_history(self):
        if not os.path.exists(self.history_file):
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump([], f)

    def _add_to_history(self, title, thumbnail, format_id, folder):
        try:
            with open(self.history_file, 'r', encoding='utf-8') as f:
                history = json.load(f)
            label = "MP3" if "mp3" in format_id.lower() else "MP4"
            item = {
                "id": str(int(time.time())),
                "title": title,
                "thumbnail": thumbnail,
                "resolution": label,
                "folder": folder,
                "date": time.strftime("%d/%m/%Y %H:%M")
            }
            history.insert(0, item)
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(history[:500], f, indent=4, ensure_ascii=False)
        except: pass

    def get_history(self):
        try:
            with open(self.history_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except: return []

    def delete_history_item(self, item_id):
        try:
            with open(self.history_file, 'r', encoding='utf-8') as f:
                history = json.load(f)
            history = [item for item in history if item['id'] != item_id]
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=4, ensure_ascii=False)
            return True
        except: return False

    def _init_favorites(self):
        if not os.path.exists(self.favorites_file):
            with open(self.favorites_file, 'w', encoding='utf-8') as f:
                json.dump([], f)

    def get_favorites(self):
        try:
            if os.path.exists(self.favorites_file):
                with open(self.favorites_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except: pass
        return []

    def toggle_favorite(self, video_data):
        """Ajoute ou retire une vidéo des favoris"""
        try:
            favs = self.get_favorites()
            video_url = video_data.get('url')
            
            # Vérifier si déjà présent
            index = -1
            for i, f in enumerate(favs):
                if f.get('url') == video_url:
                    index = i
                    break
            
            if index >= 0:
                favs.pop(index)
                action = "removed"
            else:
                favs.insert(0, video_data)
                action = "added"
                
            with open(self.favorites_file, 'w', encoding='utf-8') as f:
                json.dump(favs, f, indent=4, ensure_ascii=False)
            
            return {"status": "success", "action": action, "favorites": favs}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def toggle_fullscreen(self):
        if self._window:
            self._window.toggle_fullscreen()
        return True

    def select_folder(self):
        result = self._window.create_file_dialog(webview.FOLDER_DIALOG)
        if result:
            self.last_folder = result[0]
            return result[0]
        return None

    def clear_history(self):
        try:
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump([], f)
            return True
        except: return False

    def get_current_folder(self):
        return self.last_folder.replace("\\", "/")

    def open_download_folder(self, folder):
        try: os.startfile(os.path.normpath(folder or self.last_folder))
        except: pass

    def open_external_link(self, url):
        import webbrowser
        try: webbrowser.open(url)
        except: pass

    def set_theme(self, theme):
        """Reçoit le thème de l'UI (peut être étendu pour persistance)"""
        self._log(f"Changement de thème vers : {theme}")
        if self._window:
            self._window.evaluate_js(f"if(window.applyTheme) window.applyTheme('{theme}');")
        return True

    def minimize_window(self):
        if self._window: self._window.minimize()

    def toggle_maximize(self):
        if self._window:
            if not getattr(self, '_maximized', False): self._window.maximize()
            else: self._window.restore()
            self._maximized = not getattr(self, '_maximized', False)

    def close_window(self):
        if self._window: self._window.destroy()

    def _js_safe(self, text):
        if not text: return ""
        return str(text).replace("'", "\\'").replace('"', '\\"').replace("\n", " ")

    def _clean_str(self, text):
        import re
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        return ansi_escape.sub('', str(text or "")).strip().replace('"', '').replace("'", "")

    def progress_hook(self, d):
        if d['status'] == 'downloading':
            now = time.time()
            if now - self.last_update_time < 0.2: return
            self.last_update_time = now
            try:
                downloaded = d.get('downloaded_bytes', 0)
                total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
                percent = round((downloaded / total * 100), 1) if total > 0 else 0
                speed = self._clean_str(d.get('_speed_str', '0 MB/s'))
                eta = self._clean_str(d.get('_eta_str', '--:--'))
                phase = "Audio" if "audio" in d.get('info_dict', {}).get('format', '').lower() else "Vidéo"
                if self._window:
                    self._window.evaluate_js(f"if(window.updateProgress) window.updateProgress({percent}, '{speed}', '{eta}', '{phase}');")
            except: pass
        elif d['status'] == 'finished':
            if self._window:
                self._window.evaluate_js("if(window.updateProgress) window.updateProgress(100, '', '', '');")
                self._window.evaluate_js("if(window.updateStatus) window.updateStatus('Finalisation...');")

    def get_video_info(self, url):
        with self._lock_analyzing:
            if url in self._analyzing_urls:
                self._log(f"Analyse déjà en cours pour : {url}")
                return {"status": "error", "message": "Analyse déjà en cours..."}
            self._analyzing_urls.add(url)

        try:
            self._log(f"Analyse de l'URL : {url}")
            # Options robustes pour l'extraction
            # Détection intelligente : si c'est un lien watch?v= avec un &list=, 
            # on force l'analyse de la vidéo seule SAUF si l'utilisateur a cliqué sur une playlist explicitement.
            # Dans le doute, on laisse yt-dlp décider mais on ajoute une sécurité.
            is_playlist_url = 'list=' in url and 'watch?v=' not in url
            
            ydl_opts = {
                'quiet': True, 
                'no_warnings': True, 
                'nocheckcertificate': True,
                'cachedir': False,
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'referer': 'https://www.youtube.com/',
                'socket_timeout': 30,
                'ignore_no_formats_error': True,
                'noplaylist': not is_playlist_url, # On ne charge la playlist que si c'est un lien playlist pur
                'extract_flat': 'in_playlist' if is_playlist_url else False
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                if not info:
                    raise Exception("Impossible de récupérer les informations.")

                # Cas 1 : C'est une Playlist
                if 'entries' in info:
                    entries = list(info['entries'])
                    processed_entries = []
                    for e in entries:
                        if not e: continue
                        # Récupération ID vidéo
                        v_id = e.get('id') or e.get('video_id')
                        v_url = e.get('url') or (f"https://www.youtube.com/watch?v={v_id}" if v_id else "")
                        v_title = e.get('title') or "Vidéo sans titre"
                        
                        # Récupération miniature avec fallback agressif
                        v_thumb = e.get('thumbnail')
                        if not v_thumb and v_id:
                            v_thumb = f"https://i.ytimg.com/vi/{v_id}/mqdefault.jpg"
                            
                        processed_entries.append({
                            "url": v_url,
                            "title": v_title,
                            "thumbnail": v_thumb or ""
                        })

                    self._log(f"Playlist détectée : {info.get('title')} ({len(processed_entries)} vidéos)")
                    return {
                        "status": "playlist",
                        "title": info.get('title', 'Playlist'),
                        "count": len(processed_entries),
                        "entries": processed_entries
                    }

                # Cas 2 : C'est une vidéo seule
                formats = [{'id': 'mp3_320', 'label': '320 kbps', 'type': 'audio', 'desc': 'Best MP3'},
                           {'id': 'mp3_128', 'label': '128 kbps', 'type': 'audio', 'desc': 'Standard'}]
                
                # Détection des langues audio (MrBeast, etc.)
                languages = []
                seen_langs = set()
                for f in info.get('formats', []):
                    lang = f.get('language')
                    if lang and lang not in seen_langs:
                        languages.append({"id": lang, "label": lang.upper()})
                        seen_langs.add(lang)

                seen = set()
                # On trie pour avoir les meilleurs formats mp4 d'abord
                for f in sorted(info.get('formats', []), key=lambda x: (x.get('height') or 0, x.get('tbr') or 0), reverse=True):
                    h = f.get('height')
                    if h and h >= 144 and h not in seen and f.get('vcodec') != 'none' and f.get('acodec') == 'none':
                        # On privilégie les formats mp4/webm classiques
                        label = f"{h}p"
                        if f.get('fps'): label += f" {int(f['fps'])}fps"
                        formats.append({'id': f.get('format_id'), 'label': label, 'type': 'video', 'desc': f.get('ext', 'mp4').upper()})
                        seen.add(h)
                
                self.last_metadata = {
                    "title": info.get('title', 'Vidéo'), 
                    "thumbnail": info.get('thumbnail', ''),
                    "formats_map": {f['id']: f['label'] for f in formats},
                    "info": info 
                }
                
                self._log(f"Vidéo détectée : {info.get('title')} ({len(languages)} langues)")
                return {
                    "status": "success", 
                    "title": info.get('title', 'Video')[:60], 
                    "thumbnail": info.get('thumbnail', ''),
                    "duration": self._format_duration(info.get('duration')), 
                    "formats": formats,
                    "languages": languages
                }
        except Exception as e:
            error_msg = str(e).lower()
            self._log(f"Erreur analyse URL : {e}")
            
            # Traduction intelligente des erreurs courantes
            friendly_msg = None
            if "incomplete youtube id" in error_msg or "unsupported url" in error_msg:
                friendly_msg = "Le lien YouTube semble incorrect ou incomplet."
            elif "not available" in error_msg or "unavailable" in error_msg or "private" in error_msg:
                friendly_msg = "Cette vidéo est privée ou n'est plus disponible sur YouTube."
            elif "sign in" in error_msg or "confirm your age" in error_msg:
                friendly_msg = "Cette vidéo nécessite une connexion (limite d'âge). Essayez une autre vidéo."
            elif "geo-restricted" in error_msg or "region" in error_msg:
                friendly_msg = "Cette vidéo n'est pas disponible dans votre région."
            elif "timeout" in error_msg:
                friendly_msg = "Le serveur a mis trop de temps à répondre. Réessayez."
            
            final_msg = friendly_msg if friendly_msg else f"Erreur YouTube : {str(e)[:100]}"
            return {"status": "error", "message": final_msg}
        finally:
            with self._lock_analyzing:
                if url in self._analyzing_urls:
                    self._analyzing_urls.remove(url)

    def download_playlist(self, entries, format_id, folder):
        """Ajoute toutes les vidéos d'une playlist à la file d'attente"""
        with self.queue_lock:
            for entry in entries:
                if entry.get('url'):
                    self.download_queue.append({
                        "url": entry['url'], 
                        "format_id": format_id, 
                        "folder": folder,
                        "title": entry.get('title', 'Vidéo'), 
                        "thumbnail": entry.get('thumbnail', ''), 
                        "resolution": format_id,
                        "options": {}
                    })
            self._log(f"Ajout de {len(entries)} vidéos de la playlist à la file.")
            if self._window: 
                self._window.evaluate_js(f"if(window.updateQueueUI) window.updateQueueUI({len(self.download_queue)});")
        
        if not self.is_downloading: 
            threading.Thread(target=self._process_queue, daemon=True).start()
        
        return {"status": "success", "message": f"{len(entries)} vidéos ajoutées."}

    def download_video(self, url, format_id, folder, language=None, options=None):
        with self.queue_lock:
            meta = getattr(self, 'last_metadata', {})
            label = meta.get('formats_map', {}).get(format_id, format_id)
            self.download_queue.append({
                "url": url, 
                "format_id": format_id, 
                "folder": folder,
                "language": language,
                "options": options or {},
                "title": meta.get('title', 'Vidéo'), 
                "thumbnail": meta.get('thumbnail', ''), 
                "resolution": label
            })
            if self._window: self._window.evaluate_js(f"if(window.updateQueueUI) window.updateQueueUI({len(self.download_queue)});")
        if not self.is_downloading: threading.Thread(target=self._process_queue, daemon=True).start()
        return {"status": "success", "message": "Ajouté à la file."}

    def _process_queue(self):
        # Empêcher la mise en veille du PC pendant le téléchargement
        if sys.platform == 'win32':
            try:
                # ES_CONTINUOUS | ES_SYSTEM_REQUIRED
                ctypes.windll.kernel32.SetThreadExecutionState(0x80000000 | 0x00000001)
            except: pass

        while True:
            task = None
            with self.queue_lock:
                if self.download_queue:
                    task = self.download_queue.pop(0)
                    if self._window: self._window.evaluate_js(f"if(window.updateQueueUI) window.updateQueueUI({len(self.download_queue)});")
                    self.current_task = task
                    self.is_downloading = True
                else:
                    self.is_downloading = False
                    self.current_task = None
                    if self._window: 
                        self._window.set_title("")
                        self._window.evaluate_js("if(window.updateQueueUI) window.updateQueueUI(0);")
                    
                    # Autoriser à nouveau la mise en veille
                    if sys.platform == 'win32':
                        try:
                            ctypes.windll.kernel32.SetThreadExecutionState(0x80000000)
                        except: pass
                    break
            if task:
                if self._window: 
                    js_call = f"if(window.resetProgress) window.resetProgress('{task['format_id']}', '{self._js_safe(task.get('title'))}', '{task.get('thumbnail') or ''}');"
                    self._window.evaluate_js(js_call)
                self._run_download(task['url'], task['format_id'], task['folder'], task.get('language'), task.get('options', {}))

    def _run_download(self, url, format_id, folder, language=None, options=None):
        try:
            options = options or {}
            target_folder = folder or self.last_folder
            ydl_opts = {
                'progress_hooks': [self.progress_hook], 
                'outtmpl': os.path.join(target_folder, "%(title)s.%(ext)s"),
                'quiet': False, 
                'overwrites': True, 
                'ffmpeg_location': resource_path('.'), 
                'writethumbnail': True,
                'writesubtitles': options.get('subtitles', False),
                'writeautomaticsub': options.get('subtitles', False),
                'subtitleslangs': ['fr', 'en', '.*'],
            }

            # Gestion du découpage (Trim)
            start_time = options.get('trim_start')
            end_time = options.get('trim_end')
            if start_time or end_time:
                # On utilise download_ranges pour le découpage efficace
                def range_func(info, self_ydl):
                    return [{'start_time': self._parse_time(start_time), 'end_time': self._parse_time(end_time)}]
                ydl_opts['download_ranges'] = range_func
                ydl_opts['force_keyframes_at_cuts'] = True

            # Si une langue est spécifiée, on force la piste audio
            if language:
                self._log(f"Forçage de la langue audio : {language}")
                # format_id + audio en langue spécifique
                # yt-dlp syntax: [language=...]
                if format_id.startswith('mp3_'):
                    ydl_opts['format'] = f"bestaudio[language={language}]/bestaudio"
                else:
                    ydl_opts['format'] = f"{format_id}+bestaudio[language={language}]/bestaudio"
            
            if format_id.startswith('mp3_'):
                quality = format_id.split('_')[1]
                ydl_opts.update({'format': 'bestaudio/best', 'postprocessors': [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3', 'preferredquality': quality},
                                 {'key': 'EmbedThumbnail'}, {'key': 'FFmpegMetadata'}]})
            else:
                ydl_opts.update({'format': f"{format_id}+bestaudio/best", 'merge_output_format': 'mp4',
                                 'postprocessors': [{'key': 'EmbedThumbnail'}, {'key': 'FFmpegMetadata'}]})
            self._log(f"Démarrage téléchargement: {url}")
            with yt_dlp.YoutubeDL(ydl_opts) as ydl: ydl.download([url])
            meta = getattr(self, 'last_metadata', {})
            self._notify("Succès !", f"Terminé : {meta.get('title', 'Vidéo')}")
            self._log(f"Succès téléchargement: {meta.get('title', 'Vidéo')}")
            if self._window:
                self._add_to_history(meta.get('title', 'Vidéo'), meta.get('thumbnail', ''), format_id, target_folder)
                self._window.set_title("")
                self._window.evaluate_js("if(window.onDownloadComplete) onDownloadComplete('success', 'Terminé !')")
        except Exception as e:
            self._log(f"ÉCHEC téléchargement: {e}")
            if self._window: self._window.evaluate_js(f"if(window.onDownloadComplete) onDownloadComplete('error', 'Erreur')")
        finally: self.is_downloading = False

    def _parse_time(self, time_str):
        """Convertit MM:SS ou HH:MM:SS en secondes"""
        if not time_str: return None
        try:
            parts = str(time_str).split(':')
            if len(parts) == 1: return int(parts[0])
            if len(parts) == 2: return int(parts[0]) * 60 + int(parts[1])
            if len(parts) == 3: return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
            return None
        except: return None

    def _format_duration(self, duration):
        """Formate la durée en secondes en format MM:SS"""
        if not duration: return "--:--"
        try:
            d = int(duration)
            return f"{d // 60}:{d % 60:02d}"
        except:
            return "--:--"

    def search_videos(self, query, offset=1, limit=20, request_id=0, search_type='mixed'):
        """Recherche des vidéos et/ou playlists ultra-rapide avec pagination intelligente"""
        try:
            self._log(f"Backend: Recherche {search_type} [ID:{request_id}] -> {query} (Offset: {offset})")
            
            # Options optimisées pour la vitesse de recherche
            search_opts = self._get_ydl_search_options()
            search_opts.update({
                'playlist_items': f'{offset}-{offset+limit-1}', # ON NE CHARGE QUE LA TRANCHE VOULUE
                'lazy_playlist': True, # Chargement paresseux pour l'instantanéité
            })
            
            video_results = []
            playlist_results = []
            
            def fetch_videos():
                nonlocal video_results
                if search_type in ['mixed', 'video']:
                    try:
                        with yt_dlp.YoutubeDL(search_opts) as ydl:
                            # On force ytsearch à chercher assez de vidéos pour que playlist_items puisse piocher dedans
                            search_limit = offset + limit + 10
                            v_info = ydl.extract_info(f"ytsearch{search_limit}:{query}", download=False)
                            if v_info and 'entries' in v_info:
                                for entry in v_info['entries']:
                                    if not entry: continue
                                    thumb = entry.get('thumbnail')
                                    if not thumb and entry.get('thumbnails'): thumb = entry['thumbnails'][-1].get('url')
                                    video_results.append({
                                        "type": "video",
                                        "url": entry.get('url') or f"https://www.youtube.com/watch?v={entry.get('id')}",
                                        "title": entry.get('title', 'Sans titre'),
                                        "thumbnail": thumb or '',
                                        "duration": self._format_duration(entry.get("duration")),
                                        "uploader": entry.get('uploader', 'Chaîne inconnue')
                                    })
                    except Exception as e:
                        self._log(f"Erreur recherche vidéos : {e}")

            def fetch_playlists():
                nonlocal playlist_results
                if search_type in ['mixed', 'playlist']:
                    try:
                        # Pour les playlists, on utilise l'URL filtrée
                        p_search_url = f"https://www.youtube.com/results?search_query={query}&sp=EgIQAw%3D%3D"
                        with yt_dlp.YoutubeDL(search_opts) as ydl:
                            p_info = ydl.extract_info(p_search_url, download=False)
                            if p_info and 'entries' in p_info:
                                for entry in p_info['entries']:
                                    if not entry: continue
                                    thumb = entry.get('thumbnail')
                                    if not thumb and entry.get('thumbnails'): thumb = entry['thumbnails'][-1].get('url')
                                    playlist_results.append({
                                        "type": "playlist",
                                        "url": entry.get('url') or f"https://www.youtube.com/playlist?list={entry.get('id')}",
                                        "title": entry.get('title', 'Playlist'),
                                        "thumbnail": thumb or '',
                                        "duration": f"{entry.get('video_count', '?')} vidéos",
                                        "uploader": entry.get('uploader', 'Playlist YouTube')
                                    })
                    except Exception as e:
                        self._log(f"Erreur recherche playlists : {e}")

            # Parallélisation
            t1 = threading.Thread(target=fetch_videos)
            t2 = threading.Thread(target=fetch_playlists)
            t1.start(); t2.start()
            t1.join(); t2.join()
            
            # Fusion
            results = []
            if search_type == 'video': results = video_results
            elif search_type == 'playlist': results = playlist_results
            else:
                results = video_results
                for i, p in enumerate(playlist_results[:5]):
                    results.insert(min(i * 4 + 1, len(results)), p)
            
            return {"status": "success", "results": results}
        except Exception as e:
            self._log(f"Backend: ERREUR RECHERCHE -> {str(e)}")
            return {"status": "error", "message": str(e)}

    def get_home_videos(self):
        """Retourne les vidéos de la page d'accueil (Tendances/Populaires)"""
        try:
            ydl = self._get_ydl_discovery()
            info = ydl.extract_info("ytsearch24:Tendances Musique Gaming", download=False)
            results = []
            for entry in info.get('entries', []):
                if entry:
                    thumb = entry.get('thumbnail')
                    if not thumb and entry.get('thumbnails'): thumb = entry['thumbnails'][-1].get('url')
                    results.append({
                        "url": entry.get('url') or f"https://www.youtube.com/watch?v={entry.get('id')}",
                        "title": entry.get('title', 'Sans titre'),
                        "thumbnail": thumb or '',
                        "duration": f"{int(entry.get('duration', 0)) // 60}:{int(entry.get('duration', 0)) % 60:02d}" if entry.get('duration') else "--:--",
                        "uploader": entry.get('uploader', 'Chaîne inconnue')
                    })
            return {"status": "success", "results": results}
        except:
            return self.search_videos("Musique", offset=1, limit=24)

    def get_stream_url(self, url):
        """Récupère l'URL de streaming directe pour le lecteur interne (avec audio forcé)"""
        try:
            self._log(f"Récupération flux direct : {url}")
            # On cherche un format qui a obligatoirement l'audio ET la vidéo (muxed)
            # Sinon le navigateur ne jouera que l'un des deux.
            ydl_opts = {
                'format': 'best[vcodec!=none][acodec!=none]/best',
                'quiet': True,
                'no_warnings': True,
                'nocheckcertificate': True,
                'cachedir': False,
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'referer': 'https://www.youtube.com/',
                'socket_timeout': 10
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return {"status": "success", "url": info.get('url')}
        except Exception as e:
            self._log(f"Erreur flux : {e}")
            return {"status": "error", "message": str(e)}

def start_app():
    api = Api()
    
    # --- MIGRATION REACT ---
    # Désactivez DEV_MODE pour charger les fichiers locaux compilés
    DEV_MODE = False 
    
    if DEV_MODE:
        index_html = 'http://localhost:5173'
    else:
        # On cherche d'abord dans le dossier dist de React
        react_dist = os.path.join(os.getcwd(), 'frontend-react', 'dist', 'index.html')
        if os.path.exists(react_dist):
            index_html = react_dist
        else:
            # Fallback sur l'ancien dossier UI si React n'est pas compilé
            index_html = resource_path('ui/index.html')
    # -----------------------

    window = webview.create_window("RoYout (React Edition)", index_html, js_api=api, width=1200, height=850, background_color='#0f0f0f', frameless=False)
    api.set_window(window)
    # On lance le tray avec un petit délai pour laisser l'interface s'initialiser
    # threading.Timer(2.0, lambda: setup_tray(window)).start()
    icon_path = resource_path('ui/favicon.ico')
    if not os.path.exists(icon_path):
        icon_path = None

    try:
        # Lancement avec icône mais sans GPU pour la stabilité
        # debug=True pour permettre d'inspecter l'élément (clic droit) et voir les erreurs JS
        webview.start(debug=True, icon=icon_path, http_server=True)
    except Exception as e:
        api._log(f"ERREUR FATALE: {e}")

if __name__ == '__main__':
    start_app()
