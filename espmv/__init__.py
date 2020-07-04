import os

from flask import Flask, render_template, send_from_directory
from flask_compress import Compress
from flask_cors import CORS

app = Flask(__name__)
Compress(app)
CORS(app)

@app.route('/')
def create_map():
    return render_template('map.html')


@app.route('/static/<path:path>')
def send_file(path):
    return send_from_directory('./static', path)
