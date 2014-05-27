var config = require('./config.js');

if(config.nodetime.accountKey && config.nodetime.appName){
    require('nodetime').profile(config.nodetime);
}

var path = require('path');

var express = require('express');
var app = express();

var consolidate = require('consolidate');
var swig = require('swig');


var dnodes = require('./dnodes/dnodes.js');
var router = require('./dnodes/router.js');

//static url and paths
for(var key in config.statics){
    app.use('/'+key, express.static(path.join(__dirname, config.statics[key]))); 
}

//views
app.set('views', __dirname);
app.set('view engine', 'html'); //
app.engine('html', consolidate.swig); //without consolidate-> app.engine('html', swig.renderFile);
app.engine('jade', consolidate.jade);
    

var sampleapp = router.default_configs({
    namespace:'sampleapp'
});
router.initialize(sampleapp);
app.all('/sampleapp/*',function(req, res){
    router.route(sampleapp, req, res, 1);
});

app.listen(config.port, function(){
    console.log('Started');
});