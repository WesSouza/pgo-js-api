'use strict';

const ProtoBuf = require('protobufjs');
const geocoder = require('geocoder');

const auth = require('./auth');

// TODO: fix this
const { req, res } = ProtoBuf.loadProtoFile('./protos/RpcEnvelope.proto').build();
const sub = ProtoBuf.loadProtoFile('./protos/RpcSub.proto').build();


class PGO {
	constructor (options = {}) {
		//TODO: everything :D
	}
}

module.exports = PGO;