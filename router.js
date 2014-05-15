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
    app.html_dir = configs.html_dir || 'views';
    app.response_type = configs.response_type || 'html';
    
    return app;
}

function initialize(configs){
    
    var app = {};
    app.namespace = configs.namespace;
    app.root_dir  = configs.root_dir || app.namespace;
    app.controllers_dir = configs.controllers_dir || 'controllers';
    app.html_dir = configs.html_dir || 'html';
    app.response_type = configs.response_type || 'json';
    
    controllers[app.namespace] = {};
    
    var controllers_path = app.root_dir+'/'+app.controllers_dir;
    
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
    console.log(app);
}

/* */
function isJSExt(full_file_name){

    var parts = full_file_name.split('.');
    return (parts[parts.length-1] != 'js') ? false : true;
}