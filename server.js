const express = require('express');
const { PythonShell } = require('python-shell');

const app = express();
const cors = require('cors');

const port = 3000;
const path = require('path');
const moment = require('moment');

const redis = require('redis');

const client = redis.createClient();
const asyncRedis = require('async-redis');

const asyncRedisClient = asyncRedis.decorate(client);

client.on('error', (error) => {
  console.error(error);
});

const lightsJob = setInterval(async () => {
  const startHour = await asyncRedisClient.get('lightStartHours');
  const startMinutes = await asyncRedisClient.get('lightStartMinutes');
  const duration = await asyncRedisClient.get('lightDuration');

  if (!startHour || !startMinutes || !duration) return;

  const start = moment().hours(startHour).minutes(startMinutes).seconds(0)
    .milliseconds(0);

  const stop = moment(start).add(duration, 'minutes');
  const now = moment();

  if (start.valueOf() <= now.valueOf() && now.valueOf() <= stop.valueOf()) {
    const options = {
      mode: 'json', // way of communication between node & python
      args: ['lights', 'on'], // turn lights on
    };
    PythonShell.run('python_scripts/set_pins.py', options);
  } else {
    const options = {
      mode: 'json', // way of communication between node & python
      args: ['lights', 'off'], // turn lights on
    };
    PythonShell.run('python_scripts/set_pins.py', options);
  }
}, 1000);

app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(path.join(`${__dirname}/index.html`));
});

app.get('/set/:module/:value', (req, res) => {
  const options = {
    mode: 'json', // way of communication between node & python
    args: [...Object.values(req.params)], // we read the request parameters and send them to python script
  };
  PythonShell.run('python_scripts/set_pins.py', options, (err, results) => {
    if (err) res.status(400).json(err); // if script failed send status code 400
    res.json(results[0]); // if the script ran send the results as json
  });
});

app.get('/get/status', (req, res) => {
  const options = {
    mode: 'json', // way of communication between node & python
    pythonPath: '/usr/bin/python', // we must tell python shell what the path to python is
  };
  PythonShell.run('python_scripts/pins_status.py', options, (err, results) => {
    if (err) res.status(400).json(err); // if script failed send status code 400
    res.json(results[0]); // if the script ran send the results as json
  });
});

app.get('/get/temperature', (req, res) => {
  const options = {
    mode: 'json', // way of communication between node & python
    pythonPath: '/usr/bin/python', // we must tell python shell what the path to python is
  };
  PythonShell.run('python_scripts/temp.py', options, (err, results) => {
    if (err) res.status(400).json(err); // if script failed send status code 400
    res.json(results[0]); // if the script ran send the results as json
  });
});

app.get('/redis/set/test/:value', (req, res) => {
  console.log('%j', req);
  client.set('test', req.params.value, redis.print);
  res.send(200);
});

app.get('/redis/get/', (req, res) => {
  console.log('%j', req);
  client.get('test', redis.print);
  res.send(200);
});

app.get('/stopinterval', (req, res) => {
  clearInterval(lightsJob);
  res.send(200);
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
