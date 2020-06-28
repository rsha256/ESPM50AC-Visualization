import os

from flask import Flask, render_template, send_from_directory
from flask_gzip import *

app = Flask(__name__)


@app.route('/')
def create_map():
    return render_template('map.html')


@app.route('/static/<path:path>')
def send_file(path):
    return send_from_directory('./static', path)
