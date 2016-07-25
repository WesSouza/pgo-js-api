'use strict';

const needle = require('needle');
const url = require('url');
const querystring = require('querystring');

const LOGIN_URL = 'https://sso.pokemon.com/sso/login?service=https%3A%2F%2Fsso.pokemon.com%2Fsso%2Foauth2.0%2FcallbackAuthorize';
const OAUTH_URL = 'https://sso.pokemon.com/sso/oauth2.0/accessToken';

const CLIENT_ID = 'mobile-app_pokemon-go';
const CLIENT_SECRET = 'w8ScCUXJQc6kXKw8FiOhd8Fixzht18Dq3PEVkUCP5ZPxtgyWsbTvWHFLm2wNY0JR';
const REDIRECT_URI = 'https://www.nianticlabs.com/pokemongo/error';

needle.defaults({
	user_agent: 'Niantic App',
	parse_response: false
});

function login (options = {}, callback) {
	let requestOptions = {};

	const receiveLT = (err, res) => {
		if (err || res.statusCode != '200') {
			callback(err || new Error('unavailable'), null);
			return;
		}

		let body = JSON.parse(res.body);
		requestOptions.cookies = res.cookies;

		needle.post(
			LOGIN_URL,
			{
				'lt': body.lt,
				'execution': body.execution,
				'_eventId': 'submit',
				'username': options.username,
				'password': options.password
			},
			requestOptions,
			receiveTicket);
	};

	const receiveTicket = (err, res) => {
		if (!err && res.statusCode == '200') {
			let body = JSON.parse(res.body);
			callback(new Error('PTC login error: '+ (body.errors ? body.errors[0] : 'unknown')), null);
			return;
		}

		if (err || res.statusCode != '302') {
			callback(err || new Error('unavailable'), null);
			return;
		}

		if (!res.headers.location || res.headers.location.indexOf('ticket=') == -1) {
			callback(new Error('unavailable'), null);
			return;
		}

		let ticket = url.parse(res.headers.location, true).query.ticket;

		//Object.assign(requestOptions.cookies, res.cookies);
		requestOptions.cookies = res.cookies;

		needle.post(
			OAUTH_URL,
			{
				'client_id': CLIENT_ID,
				'redirect_uri': REDIRECT_URI,
				'client_secret': CLIENT_SECRET,
				'grant_type': 'refresh_token',
				'code': ticket
			},
			requestOptions,
			receiveToken);
	};

	const receiveToken = (err, res) => {
		if (err || res.statusCode != '200') {
			callback(err || new Error('unavailable'), null);
			return;
		}

		if (res.body.indexOf('access_token=') == -1) {
			callback(new Error('unavailable'), null);
			return;
		}

		let accessToken = querystring.parse(res.body).access_token;

		callback(null, { accessToken });
	};

	needle.get(LOGIN_URL, requestOptions, receiveLT);
}

exports.login = login;