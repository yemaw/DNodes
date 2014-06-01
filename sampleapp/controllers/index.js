
exports.onGet = function(req, res, next, dnodes){
    //console.log(dnodes.config.port);
    dnodes.send(dnodes, {code:200}, {some_key:"some value "});    
}