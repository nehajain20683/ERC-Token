var express = require('express');
var app = express();
var eth = require('./eth');

app.use('/eth',eth);

module.exports = app;