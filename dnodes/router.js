
/* Public Functions */
exports.default_configs = default_configs;
exports.initialize = initialize;
exports.route = route;

/* Core Modules */
var fs  = require('fs');
var url = require('url');
var path = require('path');

var controllers = [];

function default_configs(configs){
    
    var app = {};
    app = configs;
    
    app.namespace = configs.namespace;
    
    app.app_dir  = configs.app_dir || app.namespace;
    app.controllers_dir = configs.controllers_dir || 'controllers';
    app.views_dir = configs.views_dir || 'views';
    app.view_extension = configs.view_extension || 'html';
    
    //Response data type(file extension) to return => html, json.
    app.response_type = configs.response_type || 'html';
    
    app.root_path = path.dirname(process.mainModule.filename);
    app.app_path = app.root_path + '/' + app.app_dir + '/'; 
    
    return app;
}

function initialize(app){
    
    controllers[app.namespace] = {};
    
    var controllers_path = app.app_path+app.controllers_dir+'/';
    
    fs.readdir(controllers_path, function(error, files){
        
        if(error) return;
        
        files.forEach(function(file){

            fs.stat(controllers_path+'/'+file, function(error, stats){
                if(error) return;
                if(stats.isFile()){
                    var full_file_name = file.toString();
                    if(!isJSExt(full_file_name)){
                        return;
                    }
                    var file_name = full_file_name.substring(0, file.toString().length-3); //removing '.js'
                    var vc = require(controllers_path+'/'+file);
                    controllers[app.namespace][file_name] = vc;
                }
            });
        });
    });
    
    return app;
}

function route(app, req, res, segments){
    
    var meta = {};
    var i,j;
    /*
     Example URL : http://api.data.com:3000/myapp/do_something/12345/edit?cat=3&dog=4#hash
     Assume current router is routed to http://api.data.com:3000/myapp/
     */
    
    //
    meta = app; //copy all app values to meta.
     
    var _uris = url.parse(req.url,true, true);
    
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
    meta.full_url = req.protocol + "://" + req.get('host') + req.url;

    //protocol
    //Protocol => http or https
    meta.protocol = req.protocol;
    
    //host
    //Hostname => api.data.com:3000
    meta.host = req.get('host');

    //url_to_app
    //URL to sub application => http://api.data.com/myapp/
    meta.url_to_app = '/';
    for(i=0; i<segments; i++){
        meta.url_to_app += all_segments[i]+'/';
    }

    //segments
    //All sub segments(start after the url to sub application) in an array => segments[0] = do_something
    meta.segments = _sub_segments;

    //first_uri//object
    //First segment after path to url => do_something
    meta.first_uri  = meta.object = _sub_segments[0]+'/';

    //second_uri//id
    //Second segment after path to url => 12345
    meta.second_uri = meta.id = _sub_segments[1];
    
    //third_uri//command
    //Third segment after path to url => edit
    meta.third_uri  = meta.command = _sub_segments[2];

    //query
    //All quires after question mark => queries.cat=3 , queries.dog=4
    meta.query = _uris.query;

    //user
    //Current user object
    meta.user = req.user ? req.user : {};

    //TODO: middleware pattern
    //--meta.flashes = req.flash("flashes");
    
    //Original Request and Response objects from ExpressJS
    meta.request = req;
    meta.response = res;
    
    //default view file name
    meta.view_file = app.app_path+app.views_dir+'/'+meta.segments[0]+'.'+app.view_extension;
    
    meta.do_response = function(meta, status, data){
        handle_response(meta, status, data);
    }

    /*
    //Flash message
    meta._flashes = [];
    meta.add_flash = function(type, message){
        meta._flashes.push({type:type, message:message});
        meta.request.flash("flashes", meta._flashes);
    }
    */
    
    /* Calling Service Method from Controllers */
    _sub_segments[0] = _sub_segments[0] ? _sub_segments[0] : 'index'; //set default object as index, currently view file fail
    
    var vc = controllers[app.namespace][_sub_segments[0]];
    
    if(!vc){
        meta.response.render('pages/404.html');
        return;
    }
    switch (req.method){
        case 'GET' :
        default:
            vc.onGet(meta, req, res);
            break;
        case 'POST' :
            vc.onPost(meta, req, res);
            break;
        case 'PUT' :
            vc.onPut(meta, req, res);
            break;
        case 'DELETE' :
            vc.onDelete(meta, req, res);
            break;
    }
}

function handle_response(meta, status, data){
    
    if (meta.response_type == 'html'){
        var code = parseInt(status.code) || 200;
        switch (code){
            default:
            case 200:
                meta.response.render(meta.view_file, {meta:meta, data:data});
                break;
            case 404:
                meta.response.render("404.html");
                break;
            case 504:
                //meta.add_flash('danger', status.message+'');
                meta.response.redirect(meta.url_to_app);
                break;
        }
    }
    else if(meta.response_type == 'json'){
        var json = {};
        json.status = status;
        json.data = data;

        meta.response.send(json);
    }
}

function isJSExt(full_file_name){

    var parts = full_file_name.split('.');
    return (parts[parts.length-1] != 'js') ? false : true;
}
