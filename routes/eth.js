var express = require('express');
var router = express.Router();
var config = require('./config.json');
var RPC = require('../coin_rpc');
var Txs = require('ethereumjs-tx').Transaction;
var Web3 = require('web3');
// var web3 = new Web3(config.eth.rpc);
var web3 = new Web3(new Web3.providers.HttpProvider(config.eth.rpc));
var abi = require('../routes/abi');
var request = require("request");
const newAccountModel = require('../model/newAccountSchema');
var axios = require("axios");
const { saveNewAccount, addressExistOrNot } = require('./backend/ethBackend');

//****************************** API for Wallet Management **************************************/

/**
    * @typedef addr
    * @property {String} address.required - Add address - eg: XdAUmwtig27HBG6WfYyHAzP8n6XC9jESEw
    */
/**
 * @route GET /eth/getBalance
 * @param {addr.model} address.query
 * @group ETH
 * @security Basic Auth
 */
router.get('/getBalance', async function (req, res) {
    if (!req.query.address) {
        res.send('Invalid Address!');
    }
    try {
        addressExistOrNot(req.query.address);
        await web3.eth.getBalance(req.query.address).then(async function (value) {
            let balance = await web3.utils.fromWei(value.toString(), 'ether');
            await res.send({ status: true, balance: balance, locked_balance: 0, error: "" });
        }).catch(async function (err) {
            console.log(err)
            await res.send({ status: false, balance: "", locked_balance: "", error: err });
        });
    } catch (err) {
        console.log(err)
        res.send({ status: false, balance: "", locked_balance: "", error: err });
    }
});

/**
    * @typedef addr
    * @property {String} address.required - Add address - eg: XdAUmwtig27HBG6WfYyHAzP8n6XC9jESEw
    */
/**
 * @route GET /eth/getEtherscanBalance
 * @param {addr.model} address.query
 * @group ETH
 * @security Basic Auth
 */
router.get('/getEtherscanBalance', async function (req, res) {
    if (!req.query.address) {
        res.send('Invalid Address!');
    }
    try {
        await web3.eth.getBalance(req.query.address).then(async function (value) {
            let balance = await axios.get("https://api-ropsten.etherscan.io/api?module=account&action=balance&address="+req.query.address+"&tag=latest&apikey=YourApiKeyToken")
            await res.send({ status: true, balance: balance.data.result / 1000000000000000000, locked_balance: 0, error: "" });
        }).catch(async function (err) {
            console.log(err)
            await res.send({ status: false, balance: "", locked_balance: "", error: err });
        });
    } catch (err) {
        console.log(err)
        res.send({ status: false, balance: "", locked_balance: "", error: err });
    }
});

/**
    * @typedef eth
    */
/**
 * @route GET /eth/newAccount
 * @group ETH
 * @security Basic Auth
 */
router.get('/newAccount', async function (req, res, next) {
    try {
        let hex = randomHex();
        let account = await web3.eth.accounts.create(hex);
        saveNewAccount(account);
        res.status(200).send(account);
    }
    catch (error) {
        res.send({ status: false, error: error });
    }
});

/**
    * @typedef ethStatus
    */
/**
 * @route GET /eth/checkStatus
 * @group ETH
 * @security Basic Auth
 */
router.get('/checkStatus', async function (req, res) {
    try {
        let return_val = {
            coin: "ETH",
            network: "",
            status: false,
            block: "",
            peers: ""
        }
        let data = await web3.eth.getBlockNumber();
        let data1 = await web3.eth.net.getPeerCount();
        let data2 = await web3.eth.getBlock(0);
        let network;
        if (data2.hash == "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3") {
            network = "main"
        }
        else {
            network = "test"
        }
        console.log(data2.hash);
        return_val.status = true;
        return_val.block = data;
        return_val.peers = data1;
        return_val.network = network;
        res.send(return_val);
    }
    catch (error) {
        res.send({ status: false, error: error });
    }
});

//****************************** API for Transaction Management *********************************/

/**
    * @typedef addr
    * @property {String} from.required - Add from - eg: XdAUmwtig27HBG6WfYyHAzP8n6XC9jESEw
    * @property {String} to.required - Add to - eg: XdAUmwtig27HBG6WfYyHAzP8n6XC9jESEw
    * @property {String} value.required - Add value - eg: 10
    */
/**
 * @route GET /eth/getFee
 * @param {addr.model} from.query
 * @param {addr.model} to.query
 * @param {addr.model} value.query
 * @group ETH
 * @security Basic Auth
 */
router.get('/getFee', async function (req, res, next) {
    try {
        let gasPrice = await web3.eth.getGasPrice();
        let estimate = await web3.eth.estimateGas({
            from: req.query.from,
            to: req.query.to,
            value: toWei(req.query.value),
            gasPrice: gasPrice
        });
        let fee = (toBN(estimate) * toBN(gasPrice));
        let estimatedFee = {
            fee: fee
        }
        res.status(200).send(estimatedFee);
    }
    catch (error) {
        res.send({ status: false, error: error });
    }
});

/**
    * @typedef addr
    * @property {String} hash.required - Add hash - eg: XdAUmwtig27HBG6WfYyHAzP8n6XC9jESEw
    */
/**
 * @route GET /eth/getTransactionRecieptByHash
 * @param {addr.model} hash.query
 * @group ETH
 * @security Basic Auth
 */
router.get('/getTransactionRecieptByHash', async function (req, res, next) {
    await web3.eth.getTransaction(req.query.hash).then(reciept => {
        if (reciept == null) {
            res.send({ status: false, error: "invalid or unconfirmed" })
        }
        else {
            res.send({ status: true, reciept: reciept });
        }
    }, error => {
        res.send({ status: false, error: error })
    })
});

/**
    * @typedef addr
    * @property {String} hash.required - Add hash - eg: XdAUmwtig27HBG6WfYyHAzP8n6XC9jESEw
    */
/**
 * @route GET /eth/getTransactionConfirmationStatus
 * @param {addr.model} hash.query
 * @group ETH
 * @security Basic Auth
 */
router.get('/getTransactionConfirmationStatus', async function (req, res, next) {
    await web3.eth.getTransactionReceipt(req.query.hash).then(reciept => {
        console.log(reciept)
        if (reciept.status == null) {
            res.send({ status: false, error: "not-confirmed" });
        }
        else if (reciept.status == false) {
            res.send({ status: false, error: "failed" });
        }
        else if (reciept.status == true) {
            res.send({ status: true, result: "success" });
        }
        else {
            res.send({ status: false, result: "failed" });
        }
    }, error => {
        res.send({ status: false, error: error });
    })
});

/**
 * @typedef transferETHModel
 * @property {String} from.required - Add pk - eg: 0x98A000309527D55031238457A95b80B6AdD3CcaB
 * @property {String} to.required - Add fromAddress - eg: 0xf49ddDB0019ED8b03C03e75a9329a98746847dE5
 * @property {String} value.required - Add toAddress - eg: 0.001
 * @property {String} key.required - Add amount - eg: 0x3e2b296f55b5768b0b6e28fa318e613a4c4bfa3a26142e89453eb6a89f7f5978
 */
/**
 * @route POST /eth/transferEther
 * @param {transferETHModel.model} req.body
 * @group ETH
 * @security Basic Auth
 */
router.post('/transferEther', async function (req, res, next) {
    try {
        let status = await signTransaction(req.body.from, req.body.to, req.body.value, req.body.key.toLowerCase());
        let hash;
        console.log(status);
        var transaction = await web3.eth.sendSignedTransaction(status, function (error, transactionHash) {
            if (error) {
                console.log(error)
                var error1 = { status: false, hash: "", error: error.message };
                res.send(error1);
            } else {
                hash = transactionHash;
                var response = { status: true, hash: hash, error: "" };
                res.status(200).send(response);
            }
        });
    }
    catch (error) {
        console.log(error)
        res.send({ status: false, error: error });
    }
});



//********************************* Helper Functions *************************************/

//     __  __     __
//    / / / /__  / /___  ___  __________
//   / /_/ / _ \/ / __ \/ _ \/ ___/ ___/
//  / __  /  __/ / /_/ /  __/ /  (__  )
// /_/ /_/\___/_/ .___/\___/_/  /____/
//             /_/

function randomHex() {
    let hex = web3.utils.randomHex(32);
    return hex;
}

function toWei(balance) {
    let wei = web3.utils.toWei(balance);
    return wei;
}

function fromWei(balance) {
    let wei = web3.utils.fromWei(balance);
    return wei;
}

function toHex(number) {
    let hex = web3.utils.toHex(number);
    return hex;
}

function toBN(number) {
    let bn = web3.utils.toBN(number);
    return bn;
}

function hexToNumber(hex) {
    let number = web3.utils.hexToNumberString(hex)
    return number;
}

function precision(value) {
    let result = Number.parseFloat(value).toPrecision(4)
    return result;
}

async function signTransaction(from, to, value, key) {
    let gasPrice = await web3.eth.getGasPrice();
    let estimate = await web3.eth.estimateGas({
        from: from,
        to: to,
        value: toWei(value),
        gasPrice: gasPrice
    });
    console.log("estimates", gasPrice, estimate, toWei(value))
    let signStatus = await web3.eth.accounts.signTransaction({
        to: to,
        value: toWei(value),
        gas: estimate
    }, key);
    return signStatus.rawTransaction;
}

function _getABI(contract_address) {
    let url = "https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=" + contract_address;
    request({
        uri: url,
        method: "GET",
    }, function (error, response, body) {
        if (error) {
            res.send({ message: 'Error while getting the ABI' });
        } else {
            let contractABI = null;
            if (body && body.length > 0) {
                try {
                    let json_body = JSON.parse(body);
                    if (json_body.status == 0 && json_body.result == "Invalid Address format") {
                        res.send({ message: 'Invalid contract address' });
                    } else {
                        contractABI = json_body.result;
                        if (contractABI && contractABI != '') {
                            res.send(JSON.parse(contractABI));
                        } else {
                            res.send(sERC20ABI);
                        }
                    }
                } catch (err) {
                    res.send(err);
                }
            } else {
                res.send({ message: 'Returned Empty Contract ABI!' });
            }
        }
    });
}

module.exports = router;