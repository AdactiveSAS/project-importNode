
var fs = require('fs');
var XLSX = require('xlsx');
var ACA = require('./vendor/adsum-client-api.es5.js')


var restify = require('restify-clients');
var wsse = require('wsse');

var _em = null;
var _obj = {};
var _errors = [];


var _token = wsse({ username: '473-device', password: 'fc836794f5a4e2d0a3416d360e88edda2c3e1227cc6462f8c1f8b619bb51a26d' });
var _client = restify.createJsonClient({url: "http://preprod-api.adsum.io/api/1.1"});




//postPoi({name:"hello"})
parseXlsx(execLine);
for(var i in _obj["category"])
{
	
	console.log(i);

}


/*
init()
{

	var options = new ACA.Options();
	options.endpoint = "https://api.adsum.io"; // The Adsum Api Endpoint
	options.site = 369; // The site id to retrieve data from
	options.username = "473-device"; // The Adsum Api username, on format "{id}-device" with *id* the deviceId attributed to the application.
	options.key = "fc836794f5a4e2d0a3416d360e88edda2c3e1227cc6462f8c1f8b619bb51a26d"; // The Device Api Key

	var em = new ACA.EntityManager(options);

	// Load data asynchronously using Promise
	em.load().then(function(){
	    // Data loaded

	    // Get the Poi repository
	    var repository = em.getRepository("Poi");

	    // Get all Pois
	    var pois = repository.getAll();
	}, function(error){
	    // Handle the error
	});
}*/

function postPoi(obj)
{
	_client.post('/poi',obj, (err, req, res) =>{
		if(err)
		{
			console.log("POST KO : "+err)
		}else{
		  console.log("POST OK " +obj.name)
		}
	});
}



function importAdsumData()
{

	    // // Get the Poi repository
	    // var repository = em.getRepository("Poi");
	    // // Get all Pois
	    // var pois = repository.getAll();

}






function execLine(obj)
{
	  if(obj["Business"] != undefined)
	  {
		var cat =   {};
		cat.type = 'category';
		cat.name = obj["Business"];
		addObject(cat);
	  }
	  if(obj["Shop Name"] != undefined)
	  {
		var poi =   {};
		poi.type = 'poi';
		poi.name = obj["Shop Name"];
		poi.place = obj["Unit No"];
		poi.category = obj["Business"];
		addObject(poi);
	  }
}

function addObject(obj)
{
	if(_obj[obj.type] == undefined)
	{
		_obj[obj.type] = [];
	}

	_obj[obj.type][obj.name] = obj;
}

function parseXlsx()
{
	var workbook = XLSX.readFile('data/FE/FE.xlsx');

	var sheet_name_list = workbook.SheetNames;
	sheet_name_list.forEach(function(y) {
	    var worksheet = workbook.Sheets[y];
	    var headers = {};
	    var data = [];
	    for(z in worksheet) {
	        if(z[0] === '!') continue;
	        //parse out the column, row, and value
	        var col = z.substring(0,1);
	        var row = parseInt(z.substring(1));
	        var value = worksheet[z].v;

	        //store header names
	        if(row == 1) {
	            headers[col] = value;
	            continue;
	        }

	        if(!data[row]) data[row]={};
	        data[row][headers[col]] = value;
	        execLine(data[row]);
	    }
	    //drop those first two rows which are empty
  
	});
}

