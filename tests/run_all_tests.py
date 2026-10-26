import http.server
import os
import socketserver
import subprocess
import sys
import threading
import time

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r"C:\Users\Salman\.gemini\antigravity\scratch\legalease"
PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def log_message(self, format, *args):
        pass  # Quiet logging

class ThreadedHTTPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

def main():
    print("=================================================================")
    print("STARTING SELF-CONTAINED REVISION TEST RUNNER...")
    print("=================================================================")

    # 1. Start internal server
    httpd = None
    try:
        httpd = ThreadedHTTPServer(("127.0.0.1", PORT), Handler)
        t = threading.Thread(target=httpd.serve_forever, daemon=True)
        t.start()
        print(f"[SERVER] Embedded Threaded HTTP Server active on http://127.0.0.1:{PORT}")
    except Exception as e:
        print(f"[SERVER] Note: Could not bind to port {PORT} ({e}), assuming external server is running.")

    time.sleep(1)

    tests = [
        'tests/test_demo_accounts_login.py',
        'tests/test_apk_download.py',
        'tests/test_auth_gate.py',
        'tests/test_voice_call.py',
        'tests/test_appointment_history.py',
        'tests/test_document_export.py',
        'tests/test_navbar_and_back_to_top.py',
        'tests/test_whatsapp_chat.py',
        'tests/test_theme_tokens.py',
        'tests/test_halodoc_mobile_ui.py',
        'tests/test_pwa_and_preloader.py'
    ]

    failed = []
    for test in tests:
        test_path = os.path.join(ROOT_DIR, test)
        print(f"\n>>> Running {test} ...")
        res = subprocess.run([sys.executable, test_path], cwd=ROOT_DIR, capture_output=True, text=True)
        if res.returncode == 0:
            print(f"    [PASS] {test}")
        else:
            print(f"    [FAIL] {test}")
            print("--- STDOUT ---")
            print(res.stdout[-500:])
            print("--- STDERR ---")
            print(res.stderr[-500:])
            failed.append(test)

    print("\n" + "=" * 65)
    print(f"FINAL AUDIT: {len(tests) - len(failed)} / {len(tests)} PASSED (100% SUCCESS TARGET)")
    print("=" * 65)

    if httpd:
        httpd.shutdown()
        httpd.server_close()
        print("[SERVER] Embedded test server shut down cleanly.")

    if failed:
        print(f"FAILED TESTS: {failed}")
        sys.exit(1)
    else:
        print(">>> ALL 10 TEST SUITES VERIFIED AND PASSED 100%! <<<")

if __name__ == '__main__':
    main()
