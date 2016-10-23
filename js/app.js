'use strict';

function fireRequest(url, callback) {
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

			err += 'url = ' + JSON.stringify(url)

			console.log('error, bad code recievied', xmlhttp.status, err, url)

			return callback(err);
		}

		var response = JSON.parse(xmlhttp.response)

		if (response.error) {
			console.log("ERROR networking error bad reqeust?", url);
		}

		callback(null, response)
	}.bind(this);

	xmlhttp.open('GET', url, true);
	xmlhttp.send();
}

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
				alert(err)
				return callback(err);
			}
			peopleMap = map;
			callback(null, map)
		}.bind(this))
	}.bind(this),
	function (callback) {
		fireRequest('searchIndex.json', function (err, index) {
			if (err) {
				alert(err)
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
			searchElement = document.getElementById('seach_id');
			tableElement = document.getElementById('main_results_table_id');

			searchElement.focus();

			searchElement.onkeyup = onSeach;

			callback()
		}.bind(this));
	}.bind(this)
], function (err) {
	if (err) {
		return;
	}




}.bind(this))







function onSeach() {
	if (searchElement.value.length === 0) {
		tableElement.style.display = 'none';
		return;
	}

	while (resultsContainer.lastChild) {
		resultsContainer.removeChild(resultsContainer.lastChild)
	}

	var results = searchIndex.search(searchElement.value, searchConfig).slice(0,100)

	if (results.length === 0) {
		tableElement.style.display = 'none';
	}
	else 
	{
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


	// console.log(searchElement.value)
}
