
module.exports = exports = function(mongoose){
    
    var Schema = mongoose.Schema;

    var UserSchema = new Schema({
        username: String,
        email   : String,
        isActive: String,
        password: String,
        resetPasswordToken : String,
        roles :{}
    },
    {
        collection : 'Users',
        versionKey: false
    });
    
    return mongoose.model('user',UserSchema);   
}