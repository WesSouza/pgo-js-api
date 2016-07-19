'use strict';

const ptc = require('./auth-ptc');

function login (options = {}, callback) {
	if (options.provider == 'ptc') {
		ptc.login(options, callback);
	}

	else {
		throw new Error(`Auth provider ${options.provider} not supported`)
	}
}

exports.login = login;