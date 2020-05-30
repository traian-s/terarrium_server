import RPi.GPIO as GPIO
from pins import OUTPUT
import json

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

pin_status = {}

for pin in OUTPUT:
    GPIO.setup(OUTPUT[pin], GPIO.OUT)
    pin_status[pin] = GPIO.input(OUTPUT[pin])

print(json.dumps(pin_status))
