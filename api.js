"use strict"

const CryptoJS = require("crypto-js");
const restify = require("restify-clients");
var fs = require('fs');
var mkdirp = require('mkdirp');


var api = module.exports = function api(username,key,endPoint,siteId) { 
    this._username = username;
    this._key = key;
    this._endPoint = endPoint;
    this._siteId = siteId;
    this._client = restify.createJsonClient(this._endPoint);



    this._postStack = [];

    console.log("Endpoint on " + endPoint);
    console.log("Run on site " + siteId);
    console.log("Run on user  " + username);
};

api.prototype.createWSSEHeader = function() {
    let now = new Date();
    let created = parseInt(now.getTime() / 1000); // Timestamp in seconds
    let nonce = CryptoJS.MD5(parseInt(Math.random() * 100000).toString());

    let digest = CryptoJS.SHA1(nonce + created + this._key);

    return 'UsernameToken Username="' + this._username + '", PasswordDigest="' + digest + '", Nonce="' + nonce + '", Created="' + created + '"';
};



api.prototype.getAllObjects = function(type,cb,arr){
      if(arr == undefined)
      {
        var currentobjs = [];
      }else{
        var currentobjs = [].concat(arr);
      }
        

        this.getData('/2.1/'+type+'?site='+this._siteId+"&start="+(currentobjs.length),(err, req, res) => {
                    if (err) {
                        console.log("GET KO : " + err)
                    } else {
                         var objs = JSON.parse(res.body);
                         currentobjs = currentobjs.concat(objs);


                         var max = 1;
                         var header =eval(res.rawHeaders);
                         for(var i=0;i <header.length;i++)
                         {
                            if(header[i] =="Content-Range")
                            {
                                var cr = header[i+1];
                                var array = cr.split('/');
                                if(array.length >1)
                                 max = array[1];
                            }
                         }
                         if(max > currentobjs.length)
                         {

                            this.getAllObjects(type,cb,currentobjs);
                         }else{

                            cb(currentobjs);
                         }
                    }
                }
        );
    };

api.prototype.postObject = function(type, obj, callback){
       obj.site = this._siteId;

       this._client.post({
                path: '/2.1/'+type,
                headers: {
                    "AUTHORIZATION": 'WSSE profile="UsernameToken"',
                    "X-WSSE": this.createWSSEHeader()
                }
            }, obj,
            (err, req, res) => {
                if (err) {
                    console.log("POST KO : " + err)
                    callback();
                } else {
                    obj.id = JSON.parse(res.body).id;
                    callback(obj);
                }
            }
        );
    };


api.prototype.postObjects = function(type, objs, callback){
        if(objs.length >= 1)
        {
            var object = objs.pop();
            object.site = this._siteId;
            this.postObject(type,object,() =>
            {
                console.log("Post done " + object.name);
                this.postObjects(type,objs,callback);
            });
        }else{
          callback();
        }
    };



api.prototype.backup = function(){
    var dir = "./backup/"+ this._siteId;
    if (!fs.existsSync(dir)){
      mkdirp(dir);
    }
    this.getAllObjects("place",(objs) =>
    {
           fs.writeFile(dir + "/place.json", JSON.stringify(objs), function (err) {});
    })
    this.getAllObjects("poi",(objs) =>
    {
           fs.writeFile(dir + "/poi.json", JSON.stringify(objs), function (err) {});
    })
    this.getAllObjects("category",(objs) =>
    {
           fs.writeFile(dir + "/category.json", JSON.stringify(objs), function (err) {});
    })
    this.getAllObjects("tag",(objs) =>
    {
           fs.writeFile(dir + "/tag.json", JSON.stringify(objs), function (err) {});
    })
    this.getAllObjects("playlist",(objs) =>
    {
           fs.writeFile(dir + "/playlist.json", JSON.stringify(objs), function (err) {});
    })
    this.getAllObjects("media",(objs) =>
    {
           fs.writeFile(dir + "/media.json", JSON.stringify(objs), function (err) {});
    })
};





api.prototype.deleteObject = function(objectType,objectId, callback){

        this._client.del({
                path: '/2.1/'+objectType+"/"+objectId+'?site='+this._siteId,
                headers: {
                    "AUTHORIZATION": 'WSSE profile="UsernameToken"',
                    "X-WSSE": this.createWSSEHeader()
                }
            },
            (err, req, res) => {""
                if (err) {
                    console.log("DELETE KO : " + err)
                    callback(false)
                } else {
                    callback(true)
                }
        });
    };


api.prototype.getData = function(path, callback){
        console.log(path);
        this._client.get({
                path: path,
                headers: {
                    "AUTHORIZATION": 'WSSE profile="UsernameToken"',
                    "X-WSSE": this.createWSSEHeader()
                }
            },
            callback
        );
    };


api.prototype.getObjectByName = function(type,name,cb){
    this.getData('/2.1/'+type+'?name='+escape(name)+'&site='+this._siteId,(err, req, res) => {
                if (err) {
                    console.log("GET KO : " + err)
                } else {
                     cb(JSON.parse(res.body));
                }
            }
    );
};







api.prototype.deleteAllEntities = function(type)
{
    this.getAllObjects(type,(objs) =>
    {
        var scope = this;

        for(var i =0; i<objs.length;i++)
        {
           (function(foo){
               console.log('found '+type+' id : ' +foo.id);
               scope.deleteObject(type,foo.id,(tag)=>
                {
                    if(tag)
                    {
                        console.log(type + " " +foo+" deleted");
                    }
                });
            }(objs[i]));
        }
    });
}