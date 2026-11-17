import os
from datetime import datetime

from flask import Flask, jsonify
from flask_cors import CORS

HOST = os.environ.get("PESANDULU_HOST", "127.0.0.1")
PORT = int(os.environ.get("PESANDULU_PORT", "5000"))
ALLOWED_ORIGINS = [
    asal.strip()
    for asal in os.environ.get(
        "PESANDULU_ALLOWED_ORIGINS",
        "http://127.0.0.1:5500,http://localhost:5500",
    ).split(",")
    if asal.strip()
]

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})


@app.get("/api/status")
def status():
    return jsonify(
        {
            "aplikasi": "PesanDulu",
            "status": "ok",
            "waktu_server": datetime.now().isoformat(timespec="seconds"),
        }
    )


if __name__ == "__main__":
    app.run(host=HOST, port=PORT)
