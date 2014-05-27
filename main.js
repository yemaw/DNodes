
var path = require('path');

var express = require('express');
var app = express();

var consolidate = require('consolidate');
var swig = require('swig');

var config = require('./config.js');
var router = require('./router.js');

//static url and paths
for(var key in config.statics){
    app.use('/'+key, express.static(path.join(__dirname, config.statics[key]))); 
}

//views
app.set('views', __dirname);
app.set('view engine', 'html'); //
app.engine('html', consolidate.swig); //without consolidate-> app.engine('html', swig.renderFile);
app.engine('jade', consolidate.jade);
    

var sample = router.default_configs({
    namespace:'sample'
});
router.initialize(sample);
app.all('/sample/*',function(req, res){
    router.route(sample, req, res, 1);
});

app.listen(config.port, function(){
    console.log('Started');
});