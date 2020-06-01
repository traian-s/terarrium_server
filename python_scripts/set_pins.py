# python_scripts/set_pins.py
import sys
import RPi.GPIO as GPIO
from pins import OUTPUT
import json

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

module = sys.argv[1]  # read the first argument passed
value = sys.argv[2]  # read the second argument passed

if module in OUTPUT:  # if the module if one of our predefined output pins
    pin = OUTPUT[module]  # get the number of the pin

if value == 'on':
    signal = GPIO.LOW  # we send LOW to turn on the relay
if value == 'off':
    signal = GPIO.HIGH  # HIGH will turn off the input

try:
    # if both module and value exist we will apply signal to the pin
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, signal)
    print(json.dumps({"module": module, "value": value}))  # return the new status of the pin
except NameError:
    # if one of module or value does not exist then the request is wrong
    print(json.dumps({"error": True, "type": "Illegal module or pin"}))
