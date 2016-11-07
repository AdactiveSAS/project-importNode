const XLSX = require("xlsx");
const api = require("./api.js");


const _api = new api("423-device",'0f18cb5d5b1f1cc20ac9d85b331a03bd9ef3a844a367fe8054fd3f30afe4b2dd','https://preprod-api.adsum.io',366)
//const _api = new api("312-device",'87eb7324ea507909668dcdd4def8069bf50689ee8c4db8f4f275ec805e3757f2','https://asia-api.adsum.io',302)





const _poiSheet = "POIs"
const _categorySheet = "Categories"
const _file = "data/FE/FE.xlsx"

const _obj = {};
var _count = 0;
var _mode = "normal";

process.argv.forEach(function (val, index, array) {
  if(val == "del")
  {
    _mode = "del";
  }
});



if(_mode == "del")
{
    console.log("Delete All Data")
    _api.deleteAllData();
}else{



parseXlsxSheet(_categorySheet,execCategory);
parseXlsxSheet(_poiSheet,execPoi);  


updatePoiPlaces().then(() =>
{
    console.log("Post Pois");
    postPoi();
});
/*
console.log("Post Mother Categories");
execMotherCategory().then(() =>
{
    console.log("Post NOT Mother Categories");
    execNOTMotherCategory().then(() =>
    {
        console.log("END");
    }).catch(err)
    {
        console.log(err);
    };

});
*/


}






function updatePoiPlaces()
{
    var promises = [];
    for(poi in _obj["poi"])
    {
       (function(foo){
       var place = "Ambre";//_obj["poi"][poi].place;
         console.log("foo : " + foo);
        var p = new Promise((resolve) => {
            _api.getObjectByName("place",place,(res) =>
            {
                
                if(res.length > 0 )
                {
                    _obj["poi"][foo].places = [res[0].id];
                }
                resolve();
            });

        });
       promises.push(p);
       }(poi));

    }

    return Promise.all(promises)
}



function postPoi()
{
    var promises = [];
    for(poi in _obj["poi"])
    {
        console.log("---- Post " + poi)
        var p = new Promise((resolve) => {
            var p = _obj["poi"][poi];
            p.type = "store";
            _api.postObject("poi",p,(obj) =>
            {
                if(obj)
                  console.log("---- Post OK : " +  obj.name);
                resolve();
            });
        });
        promises.push(p);
    }

    return Promise.all(promises)


// time+=1000;
// setTimeout(function(a){ postPoi(a)}, time,o);
}


function execNOTMotherCategory()
{
    var promises = [];
    for(cat in _obj["category"])
    {
       var mother = _obj["category"][cat].mother;
        if(_obj["category"][cat].mother != undefined)
        {
            var motherId = _obj["category"][mother].id;
            _obj["category"][cat].parents = [motherId];
            console.log("---- Post " + cat)
            var p = new Promise((resolve) => {
                _api.postObject("category",_obj["category"][cat],(obj) =>
                {
                    if(obj)
                      console.log("---- Post OK : " +  obj.name);
                    resolve();
                });
            });
            promises.push(p);
        }
    }

    return Promise.all(promises)
}




function execMotherCategory()
{
    var promises = [];
    for(cat in _obj["category"])
    {
        if(_obj["category"][cat].mother == undefined)
        {
            console.log("---- Post " + cat)
            var p = new Promise((resolve, reject) => {
                _api.postObject("category",_obj["category"][cat],(obj) =>
                {
                    console.log("---- Post OK : " +  obj.name);
                    resolve();
                });
            });
            promises.push(p);
        }
    }

    return Promise.all(promises)
}

function readCategories(cb)
{
    var promises = [];
    for(cat in _obj["category"])
    {
        var p3 = new Promise((resolve, reject) => {
            getCategory(cat,(objs) =>
            {
                if(objs.length > 1){
                    var catObject = objs[0];
                    _obj["category"][catObject.name].id = catObject.id;  
                    console.log(catObject.name + " OK");
                }
                resolve();
            });
        });
        promises.push(p);
    }

    return Promise.all(promises)

}


function post()
{
    for(cat in _obj["category"])
    {
        postCategory(_obj["category"][cat]);
    }
}

function execCategory(obj)
{
    var catMother = {};
    catMother.name = obj["MainCategories"];
    catMother.type = "category"
    addObject(catMother);

    var catSubMother = {};
    catSubMother.name = obj["SubCategories"];
    catSubMother.type = "category";
    catSubMother.mother = catMother.name;
    addObject(catSubMother);
}

function execPoi(obj)
{
    if(_count++ > 10)
      return;
        const poi = {};
        poi.type = 'poi';
        poi.name = obj["Shop Name"];
        poi.place = obj["Unit No"].replace(" ", "_").replace("#", "");
        poi.category = obj["Business"];
        addObject(poi);
}

function addObject(obj)
{

    if(_obj[obj.type] == undefined)
    {
        _obj[obj.type] = [];
    }

     _obj[obj.type][obj.name] = obj;

}


function parseXlsxSheet(sheet,exec){
    const workbook = XLSX.readFile(_file);

    const sheet_name_list = workbook.SheetNames;

    for (const y of sheet_name_list) {

        if(y != sheet)
        {
            continue;
        }
        var worksheet = workbook.Sheets[y];
        var headers = {};
        var data = [];

        for (const z in worksheet) {
            if (z[0] === '!') continue;
            //parse out the column, row, and value
            var col = z.substring(0, 1);
            var row = parseInt(z.substring(1));
            var value = worksheet[z].v;

            //store header names
            if (row == 1) {
                headers[col] = value;
                continue;
            }

            if (!data[row]) data[row] = {};
            data[row][headers[col]] = value;
          
        }

        for (const row in data) {
            exec(data[row]);
        }
       

    }
};


