'use strict';



Request.prototype.fireRequest = function (config, callback) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState != XMLHttpRequest.DONE) {
			return;
		}
		if (xmlhttp.status != 200) {
			var err;
			if (xmlhttp.statusText) {
				err = xmlhttp.statusText;
			}
			else if (xmlhttp.response) {
				err = xmlhttp.response;
			}
			else {
				err = 'unknown ajax error' + String(xmlhttp.status)
			}

			err += 'config = ' + JSON.stringify(config)

			console.log('error, bad code recievied', xmlhttp.status, err, config)

			return callback(err);
		}

		var response = JSON.parse(xmlhttp.response)

		if (response.error) {
			console.log("ERROR networking error bad reqeust?", config);
		}

		callback(null, response)
	}.bind(this);

	xmlhttp.open(config.method, config.url, true);
	xmlhttp.send();
}



fireRequest('/data.json', function (err, data) {
	$(document).ready(function () {
		





	}.bind(this));
}.bind(this))
