import sys
import os

# Ensure the service root is on the Python path so `from services.X import Y` works
sys.path.insert(0, os.path.dirname(__file__))
