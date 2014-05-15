
var path = require('path');

var express = require('express');
var app = express();

var config = require('./config.js');
var router = require('./router.js');

app.use('/assets', express.static(path.join(__dirname, '/assets')));

var sample = router.use({
    namespace:'sample'
});
router.initialize(sample);
app.all('/sample/*',function(req, res){
    router.route(sample, req, res, 1);
});

app.listen(config.port, function(){
    console.log('Started');
});