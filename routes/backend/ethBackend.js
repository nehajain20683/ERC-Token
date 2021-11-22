const newAccountModel = require('../../model/newAccountSchema');

// Save NewAccount Details to MonogoDB
exports.saveNewAccount = function(account){

    const accountData = new newAccountModel();
    accountData.publicKey = account.address;
    accountData.privateKey = account.privateKey;
    accountData.DID = 0;
    accountData.save();

}

// Search for the address exist in DB or not, If yes, fetch the balance
exports.addressExistOrNot = function(address){
    newAccountModel.find({publicKey : address}, function(err, result){
        if(!err){
            console.log(result);
        } else {
            console.log("Not Found!");
        }
    })

}