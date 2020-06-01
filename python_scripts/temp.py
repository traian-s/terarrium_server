# python_scripts/pins_status.py
import json
import Adafruit_DHT as dht  # import temperature & humidity sensor library
from pins import INPUT  # import the input pins mapping


def DHT22_data():  # create the sensor read data
    # reading from DHT22 and storing the temperature and humidity
    humi, temp = dht.read_retry(dht.DHT22, INPUT.get("temp"))  # read the pin assigned to temperature mapping
    return humi, temp


humi, temp = DHT22_data()  # attempt to get sensor data
# if reading is valid
if isinstance(humi, float) and isinstance(temp, float):
    humi = '%.2f' % humi
    temp = '%.2f' % temp
    result = {"temperature": temp, "humidity": humi}
    print(json.dumps(result))  # send the temperature and humidity as a json
else:
    print(json.dumps({"error": "Failed to read sensor data"}))  # send an error object
