const CryptoJS = require("crypto-js");
const restify = require("restify-clients");




var api = module.exports = function api(username,key,endPoint,siteId) { 
    this._username = username;
    this._key = key;
    this._endPoint = endPoint;
    this._siteId = siteId;
    this._client = restify.createJsonClient(this._endPoint);


};

api.prototype.createWSSEHeader = function() {
    let now = new Date();
    let created = parseInt(now.getTime() / 1000); // Timestamp in seconds
    let nonce = CryptoJS.MD5(parseInt(Math.random() * 100000).toString());

    let digest = CryptoJS.SHA1(nonce + created + this._key);

    return 'UsernameToken Username="' + this._username + '", PasswordDigest="' + digest + '", Nonce="' + nonce + '", Created="' + created + '"';
};



api.prototype.getAllObjects = function(type,cb){
        this.getData('/2.1/'+type+'?site='+this._siteId,(err, req, res) => {
                    if (err) {
                        console.log("GET KO : " + err)
                    } else {
                         cb(JSON.parse(res.body));
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
                 //   console.log("POST OK : " +JSON.parse(res.body).id)
                    obj.id = JSON.parse(res.body).id;
                    callback(obj);
                }
            }
        );
    };


api.prototype.deleteObject = function(objectType,objectId, callback){
        this._client.del({
                path: '/2.1/'+objectType+"/"+objectId+'?site='+this._siteId,
                headers: {
                    "AUTHORIZATION": 'WSSE profile="UsernameToken"',
                    "X-WSSE": this.createWSSEHeader()
                }
            },
            (err, req, res) => {
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







api.prototype.deleteAllData = function()
{
    this.getAllObjects('category',(objs) =>
    {

        for(var i =0; i<objs.length;i++)
        {
            console.log('found category id : ' +objs[i].id);
           this.deleteObject("category",objs[i].id,(tag)=>
            {
                if(tag)
                {
                    console.log("CATEGORY DELETED");
                }
            });
        }
    });
    this.getAllObjects('poi',(objs) =>
    {

        for(var i =0; i<objs.length;i++)
        {
            console.log('found poi id : ' +objs[i].id);
            this.deleteObject("poi",objs[i].id,(tag)=>
            {
                if(tag)
                {
                    console.log("POI DELETED");
                }
            });
        }
    });
}