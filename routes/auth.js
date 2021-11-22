var config = require('./config.json');

module.exports = function () {
	return function(req, res, next) {
		var parsed_url = req.url.split('/');
			var auth = req.headers['authorization'];
			if(req.url == "/api-docs" || req.url == "/api-docs/swagger-ui.css" || req.url ==  "/api-docs/swagger-ui-bundle.js" || req.url == "/api-docs/swagger-ui-standalone-preset.js" || req.url == "/api-docs.json" || req.url == "/ripple/account" || req.url == "/ripple/account/generate" || req.url == "/ripple/balance" || req.url == "/ripple/transaction" || req.url == "/ripple/transaction/hash" ){
				next();
			}
			else if(!auth) {
				res.end('Auth Fail. Invalid UserName or Password');
			} else {
				var tmp = auth.split(' ');
				var buf = new Buffer(tmp[1], 'base64');
				var plain_auth = buf.toString(); 
				var creds = plain_auth.split(':');
				var username = creds[0];
				var password = creds[1];

				if((username == config.auth.user) && (password == config.auth.pass)) {
					next();
				}
				else {
					res.end('Auth Fail. Invalid UserName or Password');
				}
			}
	}
};