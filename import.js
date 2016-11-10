const XLSX = require("xlsx");
const api = require("./api.js");


//const _api = new api("423-device",'0f18cb5d5b1f1cc20ac9d85b331a03bd9ef3a844a367fe8054fd3f30afe4b2dd','https://preprod-api.adsum.io',366)
const _api = new api("312-device",'87eb7324ea507909668dcdd4def8069bf50689ee8c4db8f4f275ec805e3757f2','https://asia-api.adsum.io',302)





const _poiSheet = "POIs"
const _categorySheet = "Categories"
const _file = "data/FE/FE.xlsx"

const _obj = {};
var _count = 0;
var _mode = process.argv[2];



parseXlsxSheet(_categorySheet,parseCategory);
parseXlsxSheet(_poiSheet,parsePoi);  



if(_mode == "del")
{
    console.log("Delete All Data")
    _api.deleteAllEntities("poi");
    _api.deleteAllEntities("category");
    return;
}else if(_mode == "dev"){
 
   _api.getAllObjects("customobject",function(objs)
   {
       var cos = [];
        for(var i=0;i<objs.length;i++)
        {
            if(objs[i].poi== 106414)
            {
                var coo = objs[i];
                coo.priority=1;
                coo.orientation_mode = 'STATIC';
                cos.push(coo);
            }
        }
        _api.postObjects("customobject",cos,function()
        {
            console.log("end");
        })
   });
  return;
}else if(_mode == ""){

return;

}




updateLocalData(() =>
{
execMotherCategory(() => 
{
updateLocalData(() =>
{
execNOMotherCategory(() =>
{
updateLocalData(() =>
{
updatePoiPlaces(() =>
{
    execPoi(() =>
    {
        console.log("END");

    });
});
});
});
});
});
});



function deletePoiWithoutCategory()
{
    var pois  =[];
    _api.getAllObjects("poi",(objs) =>
    {
        for(var i=0;i<objs.length;i++)
        {
            if(objs[i].categories.length ==0)
            {
                _api.deleteObject("poi",objs[i].id,()=>
                    {

                    });
            }
        }
    });

}



function extractUnassociatedPois()
{

    _api.getAllObjects("poi",(objs) =>
    {
        for(var i=0;i<objs.length;i++)
        {
            if(objs[i].places.length !=0)
            {
                var p =  getObjectByName("poi",objs[i].name);
                var place = p ==  undefined ? "" : p.place;
                console.log(objs[i].name+";"+place);
            }
        }
    });

}


function movePoisFromCatToCat(fromId, toId)
{
    var poisToMove = [];
    _api.getAllObjects("poi",(objs) =>
    {
        for(var i=0;i<objs.length;i++)
        {
            var poi = objs[i]; 
            if(poi.categories.length !=0)
            {
                if(poi.categories[0] == fromId)
                {
                    var newPoi = {};
                    newPoi.name = poi.name;
                    newPoi.type = "store";
                    newPoi.places = poi.places;
                    newPoi.categories = [toId];
                    poisToMove.push(newPoi);
                }
            }
        }
        console.log(poisToMove);
        _api.postObjects("poi",poisToMove,function(){
            console.log("end");
        });
    });
}


function execMotherCategory(callback)
{
    var categories = [];
    for(var i=0;i<_obj["category"].length;i++)
    {
        if(_obj["category"][i].mother == undefined && _obj["category"][i].id == undefined ){
            categories.push(_obj["category"][i]);
        }
    }
    _api.postObjects("category",categories,() =>
    {
        console.log("---- Post OK Categories mother done");
        callback();
    });
}

function execNOMotherCategory(callback)
{
    var categories = [];
    for(var i=0;i<_obj["category"].length;i++)
    {
        var cat = _obj["category"][i];
        var mother = cat.mother;

        if(mother && cat.id == undefined){
            var motherObj = getObjectByName("category",mother);
            if(motherObj == undefined || motherObj.id == undefined)
            {
                console.log("ERR : Can't find category mother " + mother +" of " + cat.name);
                continue;
            }
            cat.parents = [motherObj.id];
            categories.push(cat);
        }
    }
    _api.postObjects("category",categories,() =>
    {
        console.log("---- Post OK Categories mother done");
        callback();
    });
}




function updatePoiPlaces(callback)
{
    _api.getAllObjects("place",(objs) =>
    {
        for(var i=0; i<_obj["poi"].length;i++)
        {  
            for(var j=0; j<objs.length;j++)
            {  
                if(objs[j].name == _obj["poi"][i].place)
                {
                    _obj["poi"][i].places = [objs[j].id];
                }
            }
        }
       
        callback();
    });
}



function execPoi(callback)
{
    var pois = [];
    for(var i=0;i<_obj["poi"].length;i++)
    {
        var poi = _obj["poi"][i];
        if(poi.id == undefined){
            var catObject = getObjectByName("category",poi.category);
            if(catObject){
                poi.categories = [catObject.id];
            }
            poi.type = "store";
            pois.push(poi);
         }

    }
    _api.postObjects("poi",_obj["poi"],() =>
    {
        console.log("---- Post POI done");
        callback();
    });
}



function readCategories(cb)
{
    var promises = [];
    for(var i =0;i<_obj["category"].length;i++)
    {
        (function(index)
        {
            var p3 = new Promise((resolve, reject) => {
                getCategory(cat,(objs) =>
                {
                    if(objs.length > 1){
                        var catObject = objs[0];
                        _obj["category"][index].id = catObject.id;  
                        console.log(catObject.name + " OK");
                    }
                    resolve();
                });
            });
            promises.push(p);
        })(i);
    }

    return Promise.all(promises)

}












function parseCategory(obj)
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

function parsePoi(obj)
{
    const poi = {};
    poi.type = 'poi';
    poi.name = obj["Shop Name"];
    poi.place = obj["Unit No"].replace(" ", "_").replace("#", "");
    poi.category = obj["Business"];
    addObject(poi);
}



function updateLocalData(callback)
{
    console.log("update");

    _api.getAllObjects("category",(objs) =>{
        for(var i=0;i < objs.length;i++)
        {
            console.log("Object " + objs[i].name+" found");
            obj = getObjectByName("category",objs[i].name);
            if(obj)
            {
                obj.id = objs[i].id;
            }
        }
        callback();
    });

}


//DATAMANAGER
function addObject(obj)
{

    if(_obj[obj.type] == undefined)
    {
        _obj[obj.type] = [];
    }

    for(var i=0; i<_obj[obj.type].length;i++)
    {
        if(_obj[obj.type][i].name == obj.name)
        {
            return;
        }
    }
     _obj[obj.type].push(obj);
}

function getObjectByName(type,name)
{
    if(_obj[type] == undefined)
    {
          console.log("ERR : can't find type : "+type)
          return
    }
      

    for(var i=0; i<_obj[type].length;i++)
    {
        if(_obj[type][i].name == name)
        {
            return _obj[type][i];
        }
    }
    return ;
}
//DATAMANAGER


//XML
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
//XML

