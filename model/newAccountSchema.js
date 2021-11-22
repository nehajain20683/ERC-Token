const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// add did as count
const newAccount = new Schema({
    publicKey : {type : String},
    privateKey : {type : String},
    DID : {type : Number}
})

module.exports = mongoose.model('newAccount' , newAccount); 