
exports.onGet = function(meta, req, res){
    meta.do_response(meta, {code:200}, {some_key:"some value"});    
}