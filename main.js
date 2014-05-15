
var path = require('path');

var express = require('express');
var app = express();

var consolidate = require('consolidate');
var swig = require('swig');

var config = require('./config.js');
var router = require('./router.js');

//static folders
app.use('/assets', express.static(path.join(__dirname, '/assets'))); 
app.use('/downloads', express.static(path.join(__dirname, '/downloads'))); 

//views
app.set('views', __dirname+'/');
app.set('view engine', 'html'); //
app.engine('html', consolidate.swig); //if without consolidate-> app.engine('html', swig.renderFile);
app.engine('jade', consolidate.jade);
    
    
    
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