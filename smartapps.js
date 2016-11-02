

var restify = require('restify');
var client = restify.createJsonClient({url: 'https://api.adsum.io'});
var fs = require('fs');
var tab = [];
launch(0);


function launch(count)
{

	client.get('/api/1.1/customobject?site=284&start='+count+'&count=100', function(err,a,b,c) {

		for(var i =0;i < c.length;i++)
		{

			console.log("parse "+ c[i].id);
			if(c[i].type == "label")
			{
				var obj = new Object();
				obj.poi = c[i].poi;
				obj.place = c[i].place;
				obj.label = c[i].id;

				obj.de = c[i].translations.de == undefined ? "" : c[i].translations.de.label;
				obj.es = c[i].translations.es == undefined ? "" : c[i].translations.es.label;
				obj.fr = c[i].translations.fr == undefined ? "" : c[i].translations.fr.label;
				obj.it = c[i].translations.it == undefined ? "" : c[i].translations.it.label;
				obj.ja = c[i].translations.ja == undefined ? "" : c[i].translations.ja.label;
				obj.ko = c[i].translations.ko == undefined ? "" : c[i].translations.ko.label;

				tab.push(obj);
	
			}
			
		}
		if(c.length ==0)
		{
			fs.writeFile('hey.json',JSON.stringify(tab));

		}else{
			count +=100;
			launch(count);
		}
	});

}

