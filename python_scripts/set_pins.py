import sys
import RPi.GPIO as GPIO

LIGHTS_PIN  = 17
COOLER_PIN  = 27
WATER_PIN   = 22

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

module = sys.argv[1]
value = sys.argv[2]

if module == 'lights':
    pin = LIGHTS_PIN
if module == 'cooler':
    pin = COOLER_PIN
if module == 'water':
    pin = WATER_PIN

if value == 'on':
    signal = GPIO.LOW
if value == 'off':
    signal = GPIO.HIGH


GPIO.setup(pin,GPIO.OUT)
GPIO.output(pin,signal)

