'use strict';

function fireRequest(config, callback) {
	if (!callback) {
		callback = function () {}
	}
	if (typeof config == 'string') {
		config = {
			url: config,
			method: 'GET'
		}
	}
	if (!config.method) {
		if (config.body) {
			config.method = 'POST'
		}
		else {
			config.method = 'GET'
		}
	}
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

			err += 'url = ' + JSON.stringify(config.url)

			console.log('error, bad code recievied', xmlhttp.status, err, config.url)

			return callback(err);
		}

		var response = JSON.parse(xmlhttp.response)

		callback(null, response)
	}.bind(this);

	xmlhttp.open(config.method, config.url, true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(config.body);
}


function onError() {
	var args = [];
	for (var i = 0; i < arguments.length; i++) {
		args[i] = arguments[i];
	}

	console.log.apply(console, ['ELOG'].concat(args));
	console.trace();

	var outputString = []

	args.forEach(function (arg) {

		var str;
		try {
			str = JSON.stringify(arg)
		}
		catch (e) {
			str = 'circular data'
		}
		outputString.push(str)
	}.bind(this))

	//use a separate calls stack in case this throws an error, it will not affect code that calls this
	setTimeout(function () {
		fireRequest({
			url: 'https://coursepro.io/log',
			body: JSON.stringify({
				value: outputString.join(''),
				type: 'employee_error'
			})
		}, function (err, response) {
			if (err) {
				console.log("error logging error... lol");
			};
		}.bind(this))
	}.bind(this), 0)
}



window.addEventListener('error', function (evt) {
	var primaryMessage;
	var secondaryMessage;
	if (evt.error) {
		primaryMessage = evt.error.stack
		secondaryMessage = evt.error.name
	}
	else {
		primaryMessage = evt.message
	}

	onError('uncaught_error:', primaryMessage, secondaryMessage, evt.filename)
});



var resultsContainer;
var searchElement;
var tableElement;

var searchConfig;
var peopleMap;
var searchIndex;
var rowTemplate;

async.parallel([
	function (callback) {
		fireRequest('map.json', function (err, map) {
			if (err) {
				onError(err)
				return callback(err);
			}
			peopleMap = map;
			callback(null, map)
		}.bind(this))
	}.bind(this),
	function (callback) {
		fireRequest('searchIndex.json', function (err, index) {
			if (err) {
				onError(err)
				return callback(err);
			}

			searchIndex = elasticlunr.Index.load(index);

			searchConfig = {
				expand: true
			}
			searchIndex.getFields().forEach(function (field) {
				searchConfig[field] = {
					boost: 1,
					bool: "OR",
					expand: true
				};
			});

			callback()

		}.bind(this))
	}.bind(this),
	function (callback) {
		$(document).ready(function () {


			rowTemplate = document.getElementsByClassName('template_class_name')[0];
			resultsContainer = rowTemplate.parentElement;
			rowTemplate.remove();
			searchElement = document.getElementById('seach_id');
			tableElement = document.getElementById('main_results_table_id');

			searchElement.focus();

			searchElement.onkeyup = onSeach;

			callback()
		}.bind(this));
	}.bind(this)
], function (err) {
	if (err) {
		onError(err)
		return;
	}


}.bind(this))


var resultsCount = 0;


function logSearch() {
	fireRequest({
		url: 'https://coursepro.io/log',
		body: JSON.stringify({
			type: 'employee_search',
			value: searchElement.value,
			count: resultsCount
		})
	})
}


var searchTimeout;



function onSeach() {
	if (searchElement.value.length === 0) {
		resultsCount = 0;
		tableElement.style.display = 'none';
		return;
	}


	if (searchTimeout) {
		clearTimeout(searchTimeout);
		searchTimeout = null;
	}

	searchTimeout = setTimeout(logSearch, 2000);



	while (resultsContainer.lastChild) {
		resultsContainer.removeChild(resultsContainer.lastChild)
	}

	var results = searchIndex.search(searchElement.value, searchConfig).slice(0, 100)
	resultsCount = results.length

	if (results.length === 0) {
		tableElement.style.display = 'none';
	}
	else {
		tableElement.style.display = ''
	}

	results.forEach(function (personId) {
		var person = peopleMap[personId.ref]

		if (!person.element) {
			person.element = rowTemplate.cloneNode(true);
			person.element.querySelector('.name').innerText = person.name;
			if (person.phone) {
				person.element.querySelector('.phone').innerText = person.phone;
			}
			person.element.querySelector('.email').innerText = person.email;
			person.element.querySelector('.primaryappointment').innerText = he.decode(person.primaryappointment);
			person.element.querySelector('.primarydepartment').innerText = he.decode(person.primarydepartment);
			person.element.style.display = ''
		}

		resultsContainer.appendChild(person.element);
	}.bind(this))
}
