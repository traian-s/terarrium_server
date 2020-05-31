import sys
import RPi.GPIO as GPIO
from pins import OUTPUT
import json

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

module = sys.argv[1]
value = sys.argv[2]

if module in OUTPUT:
    pin = OUTPUT[module]

if value == 'on':
    signal = GPIO.LOW
if value == 'off':
    signal = GPIO.HIGH

try:
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, signal)
    print(json.dumps({"module":module, "value": value}))
except NameError:
    print(json.dumps({"error": True, "type": "Illegal module or pin"}))
