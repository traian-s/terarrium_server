import json
import Adafruit_DHT as dht
from pins import INPUT

def DHT22_data():
    # Reading from DHT22 and storing the temperature and humidity
    humi, temp = dht.read_retry(dht.DHT22, INPUT.get("temp"))
    return humi, temp

humi, temp = DHT22_data()
# If Reading is valid
if isinstance(humi, float) and isinstance(temp, float):
    humi = '%.2f' % humi
    temp = '%.2f' % temp
    result = {"temperature": temp, "humidity": humi}
    print(json.dumps(result))
else:
    print(json.dumps({"error": "failed to read temperature and humidity data"}))
