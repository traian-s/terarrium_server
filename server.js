const express = require('express');
const { PythonShell } = require('python-shell');
const cors = require('cors');
const path = require('path');
const moment = require('moment');
const redis = require('async-redis');
const bodyParser = require('body-parser')

const port = 3000;
const app = express();
const client = redis.createClient();


client.on('error', (error) => {
  console.error(error);
});

setInterval(async () => {
  const startHour = await client.get('lightStartHours');
  const startMinutes = await client.get('lightStartMinutes');
  const duration = await client.get('lightDuration');

  if (!startHour || !startMinutes || !duration) return;

  const start = moment().hours(startHour).minutes(startMinutes).seconds(0)
    .milliseconds(0);

  const stop = moment(start).add(duration, 'minutes');
  const now = moment();

  if (start.valueOf() <= now.valueOf() && now.valueOf() <= stop.valueOf()) {
    const options = {
      args: ['lights', 'on'], // turn lights on
    };
    PythonShell.run('python_scripts/set_pins.py', options, (err) => console.log(err));
  } else {
    const options = {
      args: ['lights', 'off'], // turn lights off
    };
    PythonShell.run('python_scripts/set_pins.py', options, (err) => console.log(err));
  }
}, 60000);

app.use(cors());
app.use(bodyParser.urlencoded({
  extended: true,
}));

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

app.get('/get/daily/lights', async (req, res) => {
  const startHour = await client.get('lightStartHours');
  const startMinutes = await client.get('lightStartMinutes');
  const duration = await client.get('lightDuration');
  res.json({ startHour, startMinutes, duration });
});

app.post('/set/daily/lights/', async (req, res) => {
  const { lightStartHours, lightStartMinutes, lightDuration } = req.body;
  const errorArray = [];

  if (!(Number.isInteger(Number(lightStartHours)) && lightStartHours >= 0 && lightStartHours < 24)) {
    errorArray.push('Hour must be between 0-24');
  }
  if (!(Number.isInteger(Number(lightStartMinutes)) && lightStartMinutes >= 0 && lightStartMinutes < 59)) {
    errorArray.push('Minutes must be between 0-60');
  }
  if (!(Number.isInteger(Number(lightDuration)) && lightDuration > 0 && lightDuration < 1440)) {
    errorArray.push('Duration must be over a minute and less than a day');
  }
  if (errorArray.length) {
    res.json({ error: true, data: errorArray.join() });
  } else {
    await client.set('lightStartHours', lightStartHours);
    await client.set('lightStartMinutes', lightStartMinutes);
    await client.set('lightDuration', lightDuration);
    res.sendStatus(200);
  }
});

app.post('/clear/daily/:task', (req, res) => {
  const { task } = req.body;
  if (task === 'lights') {
    client.del('lightStartHours');
    client.del('lightStartMinutes');
    client.del('lightDuration');
  }
  res.send(200);
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
