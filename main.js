

var config = require('./config.js');

//nodetime performance analysis
if(config.nodetime.accountKey && config.nodetime.appName){
    require('nodetime').profile(config.nodetime);
}

var path = require('path');
var fs  = require('fs');

var express = require('express');
var app = express();

var bodyParser  = require('body-parser');
var flash = require('express-flash');
var session = require('express-session');
var cookieParser = require('cookie-parser');


var consolidate = require('consolidate');
var swig = require('swig');

var dnodes = require('./dnodes');

//static url and paths
for(var key in config.statics){
    app.use('/'+key, express.static(path.join(__dirname, config.statics[key]))); 
}

//views and template engines
app.set('views', __dirname);
app.set('view engine', 'html');
app.engine('html', consolidate.swig);
app.engine('jade', consolidate.jade);

app.use(cookieParser('keyboard cat'));
app.use(session({ cookie: { maxAge: 60000 }}));
  
  
//middlewares
app.use(bodyParser());
app.use(flash());

app.use(dnodes.multiFlash());

require('./applications.js')(app);
    
var sampleapp = dnodes.router.map({
    app_dir:'sampleapp',
    app_uri:'/api/sampleapp/*',
    response_type:'html'
});
app.use(sampleapp.app_uri, dnodes.router.route);

//Handling 404 
app.use(function(req,res,next){
    res.status(404);
    // respond with html page
    if (req.accepts('html')) {
        res.render('./pages/404.html', { url: req.url });
        return;
    }
    // respond with json
    if (req.accepts('json')) {
        res.send({ error: 'Not found' });
        return;
    }
    // default to plain-text. send()
    res.type('txt').send('Not found');
});

app.listen(config.port, function(){
    console.log('Started...');
});



/*


var authenticator = require('./dnodes/authenticator/');
app.post('/login', function(req,res,next){
    authenticator.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: false });
});








*/



