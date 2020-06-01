# python_script/pins_status.py
import RPi.GPIO as GPIO  # import the GPIO interfacing library
from pins import OUTPUT  # mapping of pins
import json

GPIO.setmode(GPIO.BCM)  # address the pins by BCM mapping
GPIO.setwarnings(False)

pin_status = {}

for pin in OUTPUT:  # map through pins
    GPIO.setup(OUTPUT[pin], GPIO.OUT)  # declare pins as outputs
    pin_status[pin] = 'on' if GPIO.input(OUTPUT[pin]) == 0 else 'off'  # read the status and send 'on' or 'off'

print(json.dumps(pin_status))  # print a JSON response for NodeJS to read
