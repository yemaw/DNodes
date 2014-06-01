var config = require('./config.js');

if(config.nodetime.accountKey && config.nodetime.appName){
    require('nodetime').profile(config.nodetime);
}

var path = require('path');

var express = require('express');
var app = express();

var bodyParser  = require('body-parser');

var consolidate = require('consolidate');
var swig = require('swig');

//var dnodes = require('./dnodes/dnodes.js');
//var router = require('./dnodes/router/index.js');
var authenticator = require('./dnodes/authenticator/');

//middlewares
app.use(bodyParser());

var router = require('./dnodes/router');


//static url and paths
for(var key in config.statics){
    app.use('/'+key, express.static(path.join(__dirname, config.statics[key]))); 
}

//views
app.set('views', __dirname);
app.set('view engine', 'html'); //
app.engine('html', consolidate.swig); //without consolidate-> app.engine('html', swig.renderFile);
app.engine('jade', consolidate.jade);

app.post('/login', function(req,res,next){
    authenticator.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: false });
});
/*
var sampleapp = router.default_configs({
    namespace:'sampleapp'
});
router.initialize(sampleapp);
app.all('/sampleapp/*',function(req, res){
    router.route(sampleapp, req, res, 1);
});
*/

var sampleapp = router.map({
    app_dir:'sampleapp',
    app_uri:'/api/sampleapp/*'
});
app.use(sampleapp.app_uri,function(req,res,next){
    router.route(req,res,next,sampleapp);
});

app.use(function(req,res,next){
    res.send('done');
});
app.listen(config.port, function(){
    console.log('Started...');
});



