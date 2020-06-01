import RPi.GPIO as GPIO
from pins import OUTPUT
import json

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

pin_status = {}

for pin in OUTPUT:
    GPIO.setup(OUTPUT[pin], GPIO.OUT)
    pin_status[pin] = 'on' if GPIO.input(OUTPUT[pin]) == 0 else 'off'

print(json.dumps(pin_status))
