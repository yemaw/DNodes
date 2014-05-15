var fs  = require('fs');
var url = require('url');

exports.use = use;
exports.initialize = initialize;
exports.route = route;

var controllers = [];

function use(configs){
    
    var app = {};
    app.namespace = configs.namespace;
    app.root_dir  = configs.root_dir || app.namespace;
    app.controllers_dir = configs.controllers_dir || 'controllers';
    app.views_dir = configs.views_dir || 'views';
    app.view_extension = configs.view_extension || 'html';
    app.response_type = configs.response_type || 'html';
    
    app.root_path = __dirname + '/' + app.root_dir + '/'; 
    
    return app;
}

function initialize(app){
    
    controllers[app.namespace] = {};
    
    var controllers_path = app.root_path+app.controllers_dir+'/';
    
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
    
    var meta = [];

    /*
     Example URL : http://api.data.com:3000/myapp/do_something/12345?cat=3&dog=4#hash
     Assume current router is routed to http://api.data.com:3000/myapp/
     */
     
    var _uris = url.parse(req.url,true, true);

    //Data type(file extension) to return => html, json.
    meta.response_type = app.response_type;

    //All segments(start after hostname) in an array => segments[0] = myapp, segments[1] = do_something ...
    var all_segments = _uris.pathname.substring(1).split('/');

    var _sub_segments = [];
    for(var i=0; i<all_segments.length-segments; i++){
        _sub_segments[i] = all_segments[i+segments]; //#TODO:there is one more blank segment: needt to filter
    }

    //Full URL of the current request => http://api.data.com:3000/myapp/do_something/12345?cat=3&dog=4#hash
    meta.full_url = req.protocol + "://" + req.get('host') + req.url;

    //Protocol => http or https
    meta.protocol = req.protocol;

    //Hostname => api.data.com:3000
    meta.host = req.get('host');

    //URL to sub application => http://api.data.com/myapp/
    meta.url_to_app = '/';
    for(var i=0; i<segments; i++){
        meta.url_to_app += all_segments[i]+'/';
    }

    //All sub segments(start after the url to sub application) in an array => segments[0] = do_something
    meta.segments = _sub_segments;

    //First segment after path to url => do
    meta.first_uri  = _sub_segments[0]+'/';

    //Second segment after path to url => do
    meta.id = _sub_segments[1];

    //All quires after question mark => queries.cat=3 , queries.dog=4
    meta.query = _uris.query;

    //File system path to current application that is used in initialization => /Users/Me/NodeJS/myapp
    meta.root_path = app.root_path;

    meta.user = req.user ? req.user : {};

    //TODO: middleware pattern
    //--meta.flashes = req.flash("flashes");
    
    //Original Request and Response objects from ExpressJS
    meta.request = req;
    meta.response = res;
    
    //default view file name
    meta.view_file = app.root_path+app.views_dir+'/'+meta.segments[0]+'.'+app.view_extension;

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
    _sub_segments[0] = _sub_segments[0] ? _sub_segments[0] : 'index';
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

/* */
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
                meta.add_flash('danger', status.message+'');
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
