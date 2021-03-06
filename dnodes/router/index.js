
/* Public Functions */
exports.map = map;
exports.route = route;

/* Core Modules */
var fs  = require('fs');
var url = require('url');
var path = require('path');

var ioc = []; //IOC container for all sub applications(app)

function map(config){
    
    if(!config.app_uri || !config.app_dir){
        console.log('app_uri & app_dir must\'t empty');
        return;
    }
    
    var app = {};
    
    app = clone(config);
    
    app.app_uri   = config.app_uri;
    app.app_dir   = config.app_dir;
    
    app.namespace = app.app_uri.replace(/\//g,'').replace(/\*/g,'');
    
    app.controllers_dir = config.controllers_dir || 'controllers';
    app.views_dir       = config.views_dir || 'views';
    
    app.response_type  = config.response_type || 'json';
    app.view_extension = config.view_extension || 'html';
    
    app.total_segments = app.segments || getNumberOfSegments(app.app_uri);
    
    app.root_path = path.dirname(process.mainModule.filename);
    app.app_path  = app.root_path + '/' + app.app_dir + '/'; 
    
    app.config = config;
    
    ioc[app.namespace] = {};
    ioc[app.namespace]['controllers'] = {};
    ioc[app.namespace]['app'] = app;
    
    var controllers_path = app.app_path+app.controllers_dir+'/';
    
    fs.readdir(controllers_path, function(error, files){
        
        if(error) return;
        
        files.forEach(function(file){

            fs.stat(controllers_path+file, function(error, stats){
                if(error) return;
                if(stats.isFile()){
                    var full_file_name = file.toString();
                    if(!isJSExt(full_file_name)){
                        return;
                    }
                    var file_name = full_file_name.substring(0, file.toString().length-3); //removing '.js'
                    var vc = require(controllers_path+file);
                    
                    ioc[app.namespace]['controllers'][file_name] = vc;
                }
            });
        });
    });
    /*
    var configjs = app.app_path+'config.js';
    fs.exists(configjs, function(exists) {
        if(exists){
            var config = require(configjs);
            ioc[app.namespace]['app']['config'] = config;        
        }
    });
    */
    return app;
}

function route(req, res, next){
    
    var i,j;
    
    //finding registered request handler in ioc container for requested url
    var namespace;
    var nss = req.originalUrl.split('?')[0].split('/');
    var nss_arr = [];
    for(i=0; i<nss.length; i++){
        var ns = '';
        for(j=0; j<nss.length; j++){
            if(j<i){
                ns += nss[j];
            }
        }
        if(ns){
            nss_arr.push(ns);    
        }
    }
    nss_arr = uniqueArray(nss_arr);
    nss_arr.reverse();
    for(i=0; i<nss_arr.length; i++){
        if(ioc[nss_arr[i]]){
            namespace = nss_arr[i];
            break; 
        }    
    }
    
    if(!namespace){
        console.log('something wrong in nampspace deteting');
    }
    
    var app = ioc[namespace]['app'];
    var segments = app.total_segments;
    
    var meta = {};
    
    /*
     Example URL : http://api.data.com:3000/myapp/do_something/12345/edit?cat=3&dog=4#hash
     Assume current router is routed to http://api.data.com:3000/myapp/
     */
    
    //all config values
    meta = app; 
     
    var _uris = url.parse(req.originalUrl,true, true);
    
    //All segments(start after hostname) in an array => segments[0] = myapp, segments[1] = do_something ...
    var all_segments = _uris.pathname.substring(1).split('/');
    
    var _sub_segments = [];
    j=0;
    for(i=0; i<all_segments.length-segments; i++){
        var segment = all_segments[i+segments];
        if(!segment){ // skip for double slash blank segment => ..com/app//index
            continue;
        }
        _sub_segments[j] = segment;
        j++;
    }

    //full_url
    //Full URL of the current request => http://api.data.com:3000/myapp/do_something/12345/edit?cat=3&dog=4#hash
    app.full_url = req.protocol + "://" + req.get('host') + req.originalUrl;

    //protocol
    //Protocol => http or https
    app.protocol = req.protocol;
    
    //host
    //Hostname => api.data.com:3000
    app.host = req.get('host');

    //url_to_app
    //URL to sub application => http://api.data.com/myapp/
    app.url_to_app = '/';
    for(i=0; i<segments; i++){
        app.url_to_app += all_segments[i]+'/';
    }

    //segments
    //All sub segments(start after the url to sub application) in an array => segments[0] = do_something
    app.segments = _sub_segments;

    //first_uri//object
    //First segment after path to url => do_something
    app.first_uri  = app.object = _sub_segments[0];

    //second_uri//id
    //Second segment after path to url => 12345
    app.second_uri = app.id = _sub_segments[1];
    
    //third_uri//command
    //Third segment after path to url => edit
    app.third_uri  = app.command = _sub_segments[2];

    //query
    //All quires after question mark => query.cat=3 , query.dog=4
    app.query = _uris.query;

    //response_type
    //Client is allowed to override the default response type
    app.response_type = app.query.response_type || app.config.response_type;
    
    //user
    //Current user object
    app.user = req.user ? req.user : {};

    //default view file name
    app.view_file = app.app_path+app.views_dir+'/'+app.segments[0]+'.'+app.view_extension;
    
    app.send = function (meta, status, data){
    
        if (meta.response_type == 'html'){
            var code = parseInt(status.code) || 200;
            switch (code){
                default:
                case 200:
                    res.render(meta.view_file, {meta:meta, data:data});
                    break;
                case 404:
                    res.render("404.html");
                    break;
                case 504:
                    //meta.add_flash('danger', status.message+'');
                    res.redirect(meta.url_to_app);
                    break;
            }
        }
        else if(meta.response_type == 'json'){
            var json = {};
            json.status = status;
            json.data = data;
            res.send(json);
        }
    };
    
    req.dnodes = app;
    
    /* Calling Request Handler Method from Controllers */
    _sub_segments[0] = _sub_segments[0] ? _sub_segments[0] : 'index'; //set default object as index, currently view file fail
    
    var vc = ioc[app.namespace]['controllers'][_sub_segments[0]];
    if(!vc){
        res.render('pages/404.html');
        return;
    }
    switch (req.method){
        case 'GET' :
            vc.onGet(req, res, next, app);
            break;
        case 'POST' :
            vc.onPost(req, res, next, app);
            break;
        case 'PUT' :
            vc.onPut(req, res, next, app);
            break;
        case 'DELETE' :
            vc.onDelete(req, res, next, app);
            break;
    }
    
};


/* Internal Helpers */

function getNumberOfSegments(uri){
    var parts = uri.split('/');
    var count = 0;
    parts.forEach(function(segment){
        if(segment && segment !== '*'){
            count++;
        }
    });
    return count;
}

function uniqueArray(arr){
    return arr.reverse().filter(function (e, i, arr) {
        return arr.indexOf(e, i+1) === -1;
    }).reverse();    
}

function isJSExt(full_file_name){

    var parts = full_file_name.split('.');
    return (parts[parts.length-1] != 'js') ? false : true;
}

function clone(obj) {
    if (null === obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}
