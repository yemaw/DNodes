
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var connection = require('./connection.js');


module.exports = exports = function(config, app){
    
    var User = require('./models/user.js')(connection);
    
    
    
    app.use(passport.initialize());
    app.use(passport.session());    
    
    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });    
    
    passport.use(new LocalStrategy({usernameField:'username',passwordField:'password'},
        function(username, password, done) {
            
            return done(null, {});
      }
    ));

    return passport;
}