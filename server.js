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
  possibleTasks.map(async (task) => { // Loop through all possible tasks
    // Fetch all the info about the task from Redis
    const startHour = await client.get(`${task}_startHour`);
    const startMinutes = await client.get(`${task}_startMinute`);
    const duration = await client.get(`${task}_duration`);
    const status = await client.get(`${task}_status`);

    // If info is missing or task status is set to off do nothing
    if (!startHour || !startMinutes || !duration || status !== 'on') return;

    // Create a moment() Date object from the start time
    const start = moment().hours(startHour).minutes(startMinutes).seconds(0)
      .milliseconds(0);

    // Create a moment() Date object from the start time + duration
    const stop = moment(start).add(duration, 'minutes');
    // Get the current time
    const now = moment();

    // If now is between start and stop
    if (start.valueOf() <= now.valueOf() && now.valueOf() <= stop.valueOf()) {
      const options = {
        args: [task, 'on'], // turn lights on
      };
      PythonShell.run('python_scripts/set_pins.py', options, (err) => console.log(err));
    } else { // We are outside the task schedule
      const options = {
        args: [task, 'off'], // turn lights off
      };
      PythonShell.run('python_scripts/set_pins.py', options, (err) => console.log(err));
    }
  });
}, 10 * 1000);

app.use(cors());
app.use(bodyParser.urlencoded({ // Use the body parser middleware
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

  if (!possibleTasks.includes(task)) { // If it's not a valid task
    res.sendStatus(400); // Status 400
    return next(); // Exit this route and move to next one
  }

  // Fetch all the task data from redis
  const status = await client.get(`${task}_status`);
  const startHour = await client.get(`${task}_startHour`);
  const startMinutes = await client.get(`${task}_startMinute`);
  const duration = await client.get(`${task}_duration`);
  res.json({ // Send the data as JSON
    task, status, startHour, startMinutes, duration,
  });
});

app.post('/set/task/', async (req, res) => {
  const {
    startHour, startMinute, duration, task,
  } = req.body; // Extract the posted parameters
  const errorArray = []; // Build an error array

  if (!possibleTasks.includes(task)) { // Must be one of the predefined tasks
    errorArray.push(`Task must be one of ${possibleTasks.join()}`);
  }
  // Do some validations for the parameters
  if (!(Number.isInteger(Number(startHour)) && startHour >= 0 && startHour < 24)) {
    errorArray.push('Hour must be between 0-24');
  }
  if (!(Number.isInteger(Number(startMinute)) && startMinute >= 0 && startMinute < 59)) {
    errorArray.push('Minutes must be between 0-60');
  }
  if (!(Number.isInteger(Number(duration)) && duration > 0 && duration < 1440)) {
    errorArray.push('Duration must be over a minute and less than a day');
  }
  // If there was any error end the request and send back the error message
  if (errorArray.length) {
    res.json({ error: true, data: errorArray.join() });
  } else {
    // Otherwise save the requested task in redis
    await client.set(`${task}_startHour`, startHour);
    await client.set(`${task}_startMinute`, startMinute);
    await client.set(`${task}_duration`, duration);
    res.sendStatus(200); // 200 OK status
  }
});

app.post('/clear/task/', (req, res, next) => {
  const { task } = req.body; // get the post parameters

  if (!possibleTasks.includes(task)) { // validate the parameters
    res.sendStatus(400);
    return next();
  }
  // Delete the key-value pairs from Redis
  client.del(`${task}_startHour`);
  client.del(`${task}_startMinute`);
  client.del(`${task}_duration`);
  res.sendStatus(200);
});

app.post('/toggle/task/', (req, res, next) => {
  const { task, status } = req.body; // get the post parameters

  if (!possibleTasks.includes(task) || !['on', 'off'].includes(status)) { // validate the parameters
    res.sendStatus(400);
    return next();
  }
  // store the task status in Redis
  client.set(`${task}_status`, status);
  res.sendStatus(200);
});


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
