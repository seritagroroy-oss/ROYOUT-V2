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

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
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
        os._exit(0) # Fermeture brutale pour s'assurer que tout s'arrête

    try:
        image = Image.open(resource_path('ui/logo.png'))
        menu = pystray.Menu(
            item('Afficher RoYout', on_show, default=True),
            item('Quitter', on_exit)
        )
        icon = pystray.Icon("RoYout", image, "RoYout", menu)
        threading.Thread(target=icon.run, daemon=True).start()
    except Exception as e:
        print(f"Erreur Tray: {e}")

# Fix pour afficher l'icône personnalisée dans la barre des tâches sur Windows
try:
    myappid = 'royindustrie.royout.downloader.1.0'
    ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
except:
    pass

class Api:
    def __init__(self):
        self.window = None
        self.last_update_time = 0
        self.is_downloading = False
        # Dossier par défaut : Téléchargements de l'utilisateur
        self.last_folder = os.path.join(os.path.expanduser("~"), "Downloads")
        if not os.path.exists(self.last_folder):
            self.last_folder = os.path.expanduser("~/Desktop")
        self.history_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "history.json")
        self._init_history()

    def _init_history(self):
        if not os.path.exists(self.history_file):
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump([], f)

    def _add_to_history(self, title, thumbnail, format_id, folder):
        try:
            with open(self.history_file, 'r', encoding='utf-8') as f:
                history = json.load(f)
            
            # Formatage du label MP3/MP4
            label = "MP4"
            if "mp3" in format_id.lower():
                label = "MP3"
            
            item = {
                "id": str(int(time.time())),
                "title": title,
                "thumbnail": thumbnail,
                "resolution": label,
                "folder": folder,
                "date": time.strftime("%d/%m/%Y %H:%M")
            }
            history.insert(0, item) # Le plus récent en premier
            
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(history[:50], f, indent=4, ensure_ascii=False) # On garde les 50 derniers
        except Exception as e:
            print(f"Erreur Historique: {e}")

    def get_history(self):
        try:
            with open(self.history_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []

    def delete_history_item(self, item_id):
        try:
            with open(self.history_file, 'r', encoding='utf-8') as f:
                history = json.load(f)
            history = [item for item in history if item['id'] != item_id]
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=4, ensure_ascii=False)
            return True
        except:
            return False

    def set_window(self, window):
        self.window = window

    def select_folder(self):
        if self.window:
            result = self.window.create_file_dialog(webview.FOLDER_DIALOG, directory=self.last_folder)
            if result:
                self.last_folder = result[0].replace("\\", "/")
                return self.last_folder
        return None

    def get_current_folder(self):
        return self.last_folder.replace("\\", "/")

    def open_download_folder(self, folder):
        if not folder:
            folder = self.last_folder
        try:
            os.startfile(os.path.normpath(folder))
        except:
            pass

    def open_url(self, url):
        import webbrowser
        try:
            webbrowser.open(url)
        except:
            pass

    def minimize_window(self):
        if self.window:
            self.window.minimize()

    def toggle_fullscreen(self):
        if self.window:
            self.window.toggle_fullscreen()

    def toggle_maximize(self):
        if self.window:
            # pywebview doesn't have a simple 'is_maximized' property easily accessible here
            # but we can call maximize() which handles it or use the toggle
            self.window.maximize() if not getattr(self, '_maximized', False) else self.window.restore()
            self._maximized = not getattr(self, '_maximized', False)

    def close_window(self):
        if self.window:
            self.window.destroy()

    def _js_safe(self, text):
        if not text: return ""
        return str(text).replace("'", "\\'").replace('"', '\\"').replace("\n", " ")

    def _clean_str(self, text):
        if not text: return ""
        import re
        # Supprime les codes de couleur ANSI (les symboles bizarres)
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        text = ansi_escape.sub('', str(text))
        # Nettoyage des espaces et caractères spéciaux
        return text.strip().replace('"', '').replace("'", "")

    def progress_hook(self, d):
        if d['status'] == 'downloading':
            now = time.time()
            if now - self.last_update_time < 0.2:
                return
            self.last_update_time = now
            
            try:
                downloaded = d.get('downloaded_bytes', 0)
                total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
                
                percent = 0
                if total > 0:
                    percent = round((downloaded / total * 100), 1)
                
                speed = self._clean_str(d.get('_speed_str', '0 MB/s'))
                eta = self._clean_str(d.get('_eta_str', '--:--'))
                
                # On détermine la phase (Vidéo ou Audio)
                filename = d.get('filename', '')
                phase = "Vidéo"
                if ".f" in filename or "f" in d.get('info_dict', {}).get('format_id', ''):
                    if "audio" in d.get('info_dict', {}).get('format', '').lower():
                        phase = "Audio"

                if self.window:
                    js_cmd = f"if(window.updateProgress) {{ window.updateProgress({percent}, '{speed}', '{eta}', '{phase}'); }}"
                    self.window.evaluate_js(js_cmd)
            except Exception as e:
                print(f"Erreur Hook: {e}")
        
        elif d['status'] == 'finished':
            if self.window:
                # On force les 100% pour l'esthétique avant la fusion
                self.window.evaluate_js("if(window.updateProgress) window.updateProgress(100, '', '', '');")
                self.window.evaluate_js("if(window.updateStatus) window.updateStatus('Finalisation / Fusion...');")

    def get_video_info(self, url):
        try:
            ydl_opts = {'quiet': True, 'no_warnings': True, 'no_color': True}
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                formats = []
                # Audio options
                formats.append({'id': 'mp3_320', 'label': '320 kbps', 'type': 'audio', 'desc': 'Best MP3'})
                formats.append({'id': 'mp3_128', 'label': '128 kbps', 'type': 'audio', 'desc': 'Standard'})
                
                # Video options
                seen = set()
                for f in info.get('formats', []):
                    h = f.get('height')
                    if h and h in [360, 480, 720, 1080] and h not in seen:
                        if f.get('ext') == 'mp4' or (f.get('vcodec') != 'none' and f.get('acodec') != 'none'):
                            formats.append({'id': f.get('format_id'), 'label': f'{h}p', 'type': 'video', 'desc': 'MP4 HD'})
                            seen.add(h)

                self.last_metadata = {
                    "title": info.get('title', 'Vidéo'),
                    "thumbnail": info.get('thumbnail', '')
                }

                return {
                    "status": "success",
                    "title": info.get('title', 'Video')[:60],
                    "thumbnail": info.get('thumbnail', ''),
                    "duration": f"{info.get('duration', 0) // 60}:{info.get('duration', 0) % 60:02d}",
                    "formats": formats
                }
        except Exception as e:
            return {"status": "error", "message": str(e)[:100]}

    def check_ffmpeg(self):
        import subprocess
        try:
            ffmpeg_path = resource_path('ffmpeg.exe')
            subprocess.run([ffmpeg_path, '-version'], capture_output=True, timeout=2)
            return True
        except:
            return False

    def download_video(self, url, format_id, folder):
        print(f"CLIC DÉTECTÉ : {format_id}")
        
        # Vérification FFmpeg pour les formats qui le nécessitent
        if (format_id.startswith('mp3_') or format_id in ['137', '136', '22']) and not self.check_ffmpeg():
            return {"status": "error", "message": "FFmpeg est manquant ! Installez-le pour ce format."}

        self.is_downloading = False 
        thread = threading.Thread(target=self._run_download, args=(url, format_id, folder))
        thread.daemon = True
        thread.start()
        return {"status": "success", "message": "Lancement immédiat..."}

    def _run_download(self, url, format_id, folder):
        try:
            if not folder or folder == "":
                folder = self.last_folder
            
            download_path = os.path.join(folder, "%(title)s.%(ext)s")
            
            ydl_opts = {
                'progress_hooks': [self.progress_hook],
                'outtmpl': download_path,
                'quiet': False,
                'no_warnings': False,
                'nocheckcertificate': True,
                'no_resume': True,
                'nopart': True,            # Correctif : On écrit directement le fichier
                'overwrites': True,
                'updatetime': False,        # Évite les problèmes de date de fichier
                'ffmpeg_location': resource_path('.'), # Indique que ffmpeg est à la racine
            }

            if format_id.startswith('mp3_'):
                quality = format_id.split('_')[1]
                ydl_opts.update({
                    'format': 'bestaudio/best',
                    'postprocessors': [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'mp3',
                        'preferredquality': quality,
                    }],
                })
            else:
                # Format plus robuste pour éviter les échecs de fusion
                ydl_opts['format'] = f"{format_id}+bestaudio/best"
                ydl_opts['merge_output_format'] = 'mp4'

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            
            if self.window:
                # Ajout à l'historique
                meta = getattr(self, 'last_metadata', {})
                self._add_to_history(
                    meta.get('title', 'Vidéo Inconnue'),
                    meta.get('thumbnail', ''),
                    format_id,
                    folder
                )
                self.window.evaluate_js("if(window.onDownloadComplete) onDownloadComplete('success', 'Téléchargement terminé !')")
        
        except Exception as e:
            error_msg = self._js_safe(str(e))
            print(f"ERREUR : {error_msg}")
            if self.window:
                self.window.evaluate_js(f"if(window.onDownloadComplete) onDownloadComplete('error', 'Erreur : {error_msg}')")
        
        finally:
            self.is_downloading = False

def start_app():
    api = Api()
    index_html = resource_path('ui/index.html')
    window = webview.create_window('RoYout', index_html, js_api=api, width=1100, height=800, background_color='#0f0f0f', frameless=True)
    api.set_window(window)
    
    # Configuration de l'icône dans la zone de notification
    setup_tray(window)
    
    icon_path = resource_path('ui/favicon.ico')
    webview.start(debug=False, icon=icon_path)

if __name__ == '__main__':
    start_app()
