

var express = require('express');
var app = express();

var config = require('./config.js');

app.listen(config.port, function(){
    console.log('Started');
});