const CryptoJS = require("crypto-js");
const XLSX = require("xlsx");
const restify = require("restify-clients");

const username = '473-device';
const key = 'c43de14913b4173c07cd7229fbbc45913129078ee9babbfc81dc341c49b15f24';
const endpoint = 'https://preprod-api.adsum.io';

const _client = restify.createJsonClient(endpoint);
const _obj = {};

const createWSSEHeader = () => {
    let now = new Date();
    let created = parseInt(now.getTime() / 1000); // Timestamp in seconds
    let nonce = CryptoJS.MD5(parseInt(Math.random() * 100000).toString());

    let digest = CryptoJS.SHA1(nonce + created + key);

    return 'UsernameToken Username="' + username + '", PasswordDigest="' + digest + '", Nonce="' + nonce + '", Created="' + created + '"';
};

const postData = (path, data, callback) => {
    _client.post({
            path: path,
            headers: {
                "AUTHORIZATION": 'WSSE profile="UsernameToken"',
                "X-WSSE": createWSSEHeader()
            }
        }, data,
        callback
    );
};

const postPoi = (obj) => {
    postData('/2.1/poi', obj, (err, req, res) => {
            if (err) {
                console.log("POST KO : " + err)
            } else {
                console.log("POST OK " + obj.name)
            }
        }
    );
};

const postCategory = (obj) => {
    postData('/2.1/category', obj, (err, req, res) => {
            if (err) {
                console.log("POST KO : " + err)
            } else {
                console.log("POST OK " + obj.name)
            }
        }
    );
};

const execLine = (obj) => {
    if (obj["Business"] != undefined) {
        const cat = {};
        cat.type = 'category';
        cat.name = obj["Business"];
        postCategory(cat);
    }
    if (obj["Shop Name"] != undefined) {
        const poi = {};
        poi.type = 'poi';
        poi.name = obj["Shop Name"];
        poi.place = obj["Unit No"];
        poi.category = obj["Business"];
        postPoi(poi);
    }
};

const parseXlsx = () => {
    const workbook = XLSX.readFile('data/FE/FE.xlsx');

    const sheet_name_list = workbook.SheetNames;

    for (const y of sheet_name_list) {
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
            execLine(data[row]);
        }
    }
};

parseXlsx();