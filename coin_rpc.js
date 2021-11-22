const rp = require('request-promise');
const http = require('http');

var CoinRPC = function(uri, options = {}) {
    this._uri = uri
    this._options = options
}

// TODO: Support batch RPC requests
CoinRPC.prototype.call = function(procedureName, params) {
    var postParams = Array.isArray(params) || this._options.forceObject? params : [params];
    var options = {
        method: 'POST',
        uri: this._uri,
        body: {
            method: procedureName,
            params: postParams,
            id: 'jsonrpc'
        },
        agent: new http.Agent({
            keepAlive: true,
            maxSockets: 1
        }),
        json: true,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
    }

    if (this._options.auth) {
        options.auth = this._options.auth
    }

    return rp(options)
        .then(result => {
            if(result.error)
                return result.error;
            else {
                return result.result
            }
        }).catch(error => {
            throw(error);
        })
};

exports.CoinRPC = CoinRPC