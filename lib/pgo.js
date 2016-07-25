'use strict';

const needle = require('needle');
const url = require('url');
const querystring = require('querystring');
const ProtoBuf = require('protobufjs');
const geocoder = require('geocoder');

const auth = require('./auth');

const CALL_NIANTIC_AT = 'https://pgorelease.nianticlabs.com/plfe/rpc';

// TODO: fix this
const Enum = ProtoBuf.loadProtoFile('./protos/RpcEnum.proto').build().RpcEnum;
const RpcEnvelope = ProtoBuf.loadProtoFile('./protos/RpcEnvelope.proto').build();
const Req = RpcEnvelope.Request;
const Res = RpcEnvelope.Response;
const Sub = ProtoBuf.loadProtoFile('./protos/RpcSub.proto').build().RpcSub;

needle.defaults({
	user_agent: 'Niantic App',
	parse_response: false
});

class PGO {
	constructor (options) {
		this._latitude = options.latitude;
		this._longitude = options.longitude;
		this._altitude = options.altitude;
		this.options = options;
		this._endpoint = CALL_NIANTIC_AT;
	}

	connect (callback) {
		const gotToken = (err, data) => {
			if (err) {
				callback(err, null);
				return;
			}

			this._auth = new Req.AuthInfo({
				provider: this.options.provider,
				token: new Req.AuthInfo.JWT(data.accessToken, 59)
			});

			this.request(
				new Req.Requests(Enum.RequestMethod.GET_PLAYER),
				Sub.GetPlayerResponse,
				gotInitData);
		}

		const gotInitData = (err, data) => {
			if (err) {
				callback(err, null);
				return;
			}

			if (!data || !data._raw || !data._raw.api_url) {
				callback(new Error('PGO:connect:gotInitData:missing_api_url'), null);
				return;
			}

			callback(null, this);
		};

		auth.login(this.options, gotToken);
	}

	request (request, decoder, callback) {
		this.requests([request], [decoder], (err, data) => {
			if (err) {
				callback(err, null)
				return;
			}
			callback(null, { _raw: data._raw, response: data.responses[0] });
		});
	}

	requests (requests, decoders, callback) {
		if (!this._auth) {
			callback(new Error('PGO:request:missing_auth'), null);
			return;
		}

		if (!Array.isArray(decoders)) {
			callback(new Error('PGO:request:decoders_not_array'), null);
			return;
		}

		const request = new Req({
			direction: Enum.RpcDirection.REQUEST,
			rpc_id: 1469378659230941192,

			requests: requests,

			latitude: this._latitude,
			longitude: this._longitude,
			altitude: this._altitude,

			auth: this._auth,

			unknown12: 989
		});

		const gotResponse = (err, data) => {
			if (err) {
				callback(err, null);
				return;
			}

			try {
				const response = Res.decode(data.raw);
				const responses = response.responses.map((response, i) => decoders[i].decode(response));

				if (response.api_url) {
					this._endpoint = `https://${response.api_url}/rpc`
				}

				callback(null, { _raw: response, responses });
			}
			catch (e) {
				let ne = new Error('PGO:gotResponse:decode_error');
				ne.error = e;
				ne.decoded = e.decoded;
				callback(ne, null);
			}
		};

		needle.post(
			this._endpoint,
			request.encode().toBuffer(),
			gotResponse);
	}
}


const connect = (options, callback) => {
	const pgo = new PGO(options);

	const gotConnection = (err, data) => {
		if (err) {
			callback(err, null);
			return;
		}

		callback(err, pgo);
	}

	pgo.connect(gotConnection);
}

module.exports = {
	Enum,
	Req,
	Res,
	Sub,
	connect
};
