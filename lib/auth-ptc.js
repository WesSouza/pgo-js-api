'use strict';

const needle = require('needle');
const url = require('url');
const querystring = require('querystring');

const loginUrl = 'https://sso.pokemon.com/sso/login?service=https%3A%2F%2Fsso.pokemon.com%2Fsso%2Foauth2.0%2FcallbackAuthorize';
const oauthUrl = 'https://sso.pokemon.com/sso/oauth2.0/accessToken';

const oauthClientId = 'mobile-app_pokemon-go';
const oauthClientSecret = 'w8ScCUXJQc6kXKw8FiOhd8Fixzht18Dq3PEVkUCP5ZPxtgyWsbTvWHFLm2wNY0JR';
const oauthRedirectUri = 'https://www.nianticlabs.com/pokemongo/error';

function login (options = {}, callback) {
	let requestOptions = { headers: { 'User-Agent': 'Niantic App' } };
	needle.get(loginUrl, requestOptions, (err, res) => {
		if (err || res.statusCode != '200') {
			callback(err || new Error('unavailable'), null);
			return;
		}

		let body = JSON.parse(res.body);
		requestOptions.cookies = res.cookies;

		needle.post(
			loginUrl,
			{
				'lt': body.lt,
				'execution': body.execution,
				'_eventId': 'submit',
				'username': options.username,
				'password': options.password
			},
			requestOptions,
			(err, res) => {
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
					oauthUrl,
					{
						'client_id': oauthClientId,
						'redirect_uri': oauthRedirectUri,
						'client_secret': oauthClientSecret,
						'grant_type': 'refresh_token',
						'code': ticket
					},
					requestOptions,
					(err, res) => {
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
					});
			});
	})
}

exports.login = login;