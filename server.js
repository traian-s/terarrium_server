const express = require('express');
const { PythonShell } = require('python-shell');
const app = express();
const cors = require('cors');
const port = 3000;
const path = require('path');

app.use(cors());

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/set/:module/:value', function (req, res) {
  const options = {
    mode: 'json',
    args: [...Object.values(req.params)]
  };
  PythonShell.run('python_scripts/set_pins.py', options, function (err, results) {
    if (err) res.status(400).json(err);
    res.json(results);
 });
});

app.get('/get/status', function (req, res) {
  const options = {
    mode: 'json'
  };
  PythonShell.run('python_scripts/pins_status.py', options, function (err, results) {
    if (err) res.status(400).json(err);
    res.json(results[0]);
  });
});

app.get('/get/temperature', function (req, res) {
  const options = {
   pythonPath: '/usr/bin/python',
   mode: 'json'
  };
  PythonShell.run('python_scripts/temp.py', options, function (err, results) {
    if (err) res.status(400).json(err);
    res.json(results[0]);
  });
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
