const express = require('express');
const { PythonShell } = require('python-shell');
const cors = require('cors');
const path = require('path');
const moment = require('moment');
const redis = require('async-redis');
const bodyParser = require('body-parser');

const port = 3000;
const app = express();
const client = redis.createClient();

const possibleTasks = ['lights', 'water'];


client.on('error', (error) => {
  console.error(error);
});

setInterval(() => {
  possibleTasks.map(async (task) => {
    const startHour = await client.get(`${task}_startHour`);
    const startMinutes = await client.get(`${task}_startMinute`);
    const duration = await client.get(`${task}_duration`);

    if (!startHour || !startMinutes || !duration) return;

    const start = moment().hours(startHour).minutes(startMinutes).seconds(0)
      .milliseconds(0);

    const stop = moment(start).add(duration, 'minutes');
    const now = moment();

    if (start.valueOf() <= now.valueOf() && now.valueOf() <= stop.valueOf()) {
      const options = {
        args: [task, 'on'], // turn lights on
      };
      PythonShell.run('python_scripts/set_pins.py', options, (err) => console.log(err));
    } else {
      const options = {
        args: [task, 'off'], // turn lights off
      };
      PythonShell.run('python_scripts/set_pins.py', options, (err) => console.log(err));
    }
  });
}, 10 * 1000);

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
    else res.json(results[0]); // if the script ran send the results as json
  });
});

app.get('/get/status', (req, res) => {
  const options = {
    mode: 'json', // way of communication between node & python
    pythonPath: '/usr/bin/python', // we must tell python shell what the path to python is
  };
  PythonShell.run('python_scripts/pins_status.py', options, (err, results) => {
    if (err) res.status(400).json(err); // if script failed send status code 400
    else res.json(results[0]); // if the script ran send the results as json
  });
});

app.get('/get/temperature', (req, res) => {
  const options = {
    mode: 'json', // way of communication between node & python
    pythonPath: '/usr/bin/python', // we must tell python shell what the path to python is
  };
  PythonShell.run('python_scripts/temp.py', options, (err, results) => {
    if (err) res.status(400).json(err); // if script failed send status code 400
    else res.json(results[0]); // if the script ran send the results as json
  });
});

app.get('/get/task/:task', async (req, res, next) => {
  const { task } = req.params;

  if (!possibleTasks.includes(task)) {
    res.sendStatus(400);
    next();
  }

  const startHour = await client.get(`${task}_startHour`);
  const startMinutes = await client.get(`${task}_startMinute`);
  const duration = await client.get(`${task}_duration`);
  res.json({ startHour, startMinutes, duration });
});

app.post('/set/task/', async (req, res) => {
  const {
    startHour, startMinute, duration, task,
  } = req.body;
  const errorArray = [];

  if (!possibleTasks.includes(task)) {
    errorArray.push(`Task must be one of ${possibleTasks.join()}`);
  }
  if (!(Number.isInteger(Number(startHour)) && startHour >= 0 && startHour < 24)) {
    errorArray.push('Hour must be between 0-24');
  }
  if (!(Number.isInteger(Number(startMinute)) && startMinute >= 0 && startMinute < 59)) {
    errorArray.push('Minutes must be between 0-60');
  }
  if (!(Number.isInteger(Number(duration)) && duration > 0 && duration < 1440)) {
    errorArray.push('Duration must be over a minute and less than a day');
  }
  if (errorArray.length) {
    res.json({ error: true, data: errorArray.join() });
  } else {
    await client.set(`${task}_startHour`, startHour);
    await client.set(`${task}_startMinute`, startMinute);
    await client.set(`${task}_duration`, duration);
    res.sendStatus(200);
  }
});

app.post('/clear/task/', (req, res, next) => {
  const { task } = req.body;

  if (!possibleTasks.includes(task)) {
    res.sendStatus(400);
    next();
  }

  client.del(`${task}_startHour`);
  client.del(`${task}_startMinute`);
  client.del(`${task}_duration`);
  res.send(200);
});


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
