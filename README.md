# Pokémon GO JavaScript API

This is the unofficial, totally incomplete Pokémon GO JS API.


## Sample Code

	const PGO = require('pgo-js-api');

	const options = {
		provider: 'ptc',
		username: 'username',
		password: 'password',
		latitude: 52.3579946,
		longitude: 4.8686484,
		altitude: 1
	}

	const Enum = PGO.Enum;
	const Req = PGO.Req;
	const Res = PGO.Res;
	const Sub = PGO.Sub;

	PGO.connect(options, function (err, pgo) {
		if (err) {
			console.error(err);
			return;
		}

		pgo.request(
			new Req.Requests(Enum.RequestMethod.GET_PLAYER),
			Sub.GetPlayerResponse,
			console.log);
	});


## Credits

Inspired by [Armax/Pokemon-GO-node-api](https://github.com/Armax/Pokemon-GO-node-api)

Protos from [tejado/pgoapi](https://github.com/tejado/pgoapi)