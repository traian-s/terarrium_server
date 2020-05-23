const express = require('express');
const { PythonShell } = require('python-shell');
const app = express();
const port = 3000;

app.get('/set/:module/:value', function (req, res) {
  const options = {
    args: [...Object.values(req.params)]
  };
  PythonShell.run('python_scripts/set_pins.py', options, function (err, results) {
    if (err) throw err;
    console.log('results: %j', results);
  });

  res.send(JSON.stringify(req.params))
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));