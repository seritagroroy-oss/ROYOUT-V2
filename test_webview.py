import webview
try:
    window = webview.create_window('Test', 'https://www.google.com')
    webview.start()
    print("Success")
except Exception as e:
    print(f"Error: {e}")
