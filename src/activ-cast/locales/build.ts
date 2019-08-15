var fs = require('fs');
var xmlParser = require('fast-xml-parser');
var iniParser = require('ini')
var baseDir = "../_locales";
var baseFile = baseDir + "/en/messages.json"
var transDir = "../../../../temp/[14th AUG delivery]_2224640_Translation x 26 languages. Screen share"

var locals = {
    "ar" : "ar-mx",
    "cs" : "cs-cz",
    "da" : "da-dk",
    "de" : "de-de",
    "es" : "es-es",
    "fi" : "fi-fi",
    "fr" : "fr-fr",
    "hu" : "hu-hu",
    "id" : "id-id",
    "it" : "it-it",
    "ja" : "ja-jp",
    "kk" : "kk",
    "lt" : "lt-lt",
    "lv" : "lv-lv",
    "ms" : "ms-my",
    "nb" : "nb-no",
    "nl" : "nl-nl",
    "pl" : "pl-pl",
    "pt" : "pt-pt",
    "ru" : "ru-ru",
    "sv" : "sv-se",
    "th" : "th-th",
    "tr" : "tr-tr",
    "vi" : "vi-vn",
    "zh" : "zh-cn",
    "zh_TW" : "zh-tw" 
}


function start() {
    Object.keys(locals).forEach(key => {
        translate(key, false);
    })
}


var xmlBaseDir = "Structure Delivery_4_2207800_ActivCast Strings EN July04 xml files";
var xmlBaseFilename = "AC_Windows Sender_App.xml";
function getXmlId(msg) {
    var result;
    var options = {
        attrNodeName: "id",
        ignoreAttributes: false
    }
    var xmlFile = xmlBaseDir+ "/values/" + xmlBaseFilename;
    var xmlData = fs.readFileSync(xmlFile).toString();
    var parser = xmlParser;
    if( parser.validate(xmlData) === true) {
        var jsonObj = parser.parse(xmlData, options);
        var items = jsonObj.skin.String.String;        
        items.forEach((item) => {
            if ( item["#text"] === msg) {
                result = item["id"]["@_id"]
            }
        })        
    } 
    return result;
}

function getXmlValueById(local, id) {
    var result;
    var options = {
        attrNodeName: "id",
        ignoreAttributes: false
    }
    var xmlFile = xmlBaseDir+ "/values-" + local+"/" + xmlBaseFilename;
    var xmlData = fs.readFileSync(xmlFile).toString();
    var parser = xmlParser;
    if( parser.validate(xmlData) === true) {
        var jsonObj = parser.parse(xmlData, options);
        var items = jsonObj.skin.String.String;        
        items.forEach((item) => {
            var _id = item["id"]["@_id"];
            var text = item["#text"];
            if ( _id === id) {
                result = text;
            }
        })        
    } 
    return result;
}

function testXml() {
    var options = {
        attrNodeName: "id",
        ignoreAttributes: false
    }
    var parser = xmlParser;
    var xmlData = fs.readFileSync("Structure Delivery_4_2207800_ActivCast Strings EN July04 xml files/values/AC_Windows Sender_App.xml").toString()
    console.log(xmlData)
    if( parser.validate(xmlData) === true) { //optional (it'll return an object in case it's not valid)
        var jsonObj = parser.parse(xmlData, options);
        console.log("aaaaaaaa", jsonObj.skin.String.String)
    }    

    // var tObj = parser.getTraversalObj(xmlData);
    // var jsonObj = parser.convertToJson(tObj);
    // console.log(tObj, jsonObj)
}


function Uint8ArrayToString(fileData){
    var dataString = "";
    for (var i = 0; i < fileData.length; i++) {
      dataString += String.fromCharCode(fileData[i]);
    }
   
    return dataString
}  


function getTransValue(local, pkey) {
    var file = transDir + "/" + locals[local] + "/AppStoreScreenShots_Portal_DownloadURL.strings"
    var value = getTransValueByIniFile(file, pkey, 'UCS-2');
    if (!value) {
        file = transDir + "/" + locals[local] + "/Panel_and_Senders_ScreenShare.strings"
        value = getTransValueByIniFile(file, pkey, 'UCS-2');
    }
    if (!value) {
        file = transDir + "/../Structured delivery_2_ActivCast Strings EN July04 strings files/Structured delivery_2_ActivCast Strings EN July04 strings files/values-" + local + "/AC_Mac Sender_App.strings"
        value = getTransValueByIniFile(file, pkey, 'utf8');
    }
    return value;    
}

function getTransValueByIniFile(file, pkey, coding) {
    if (!fs.existsSync(file)) {
        console.error("***资源文件不存在：" + file);
        return;
    }    
    coding = coding || 'UCS-2';
    var sm = fs.readFileSync(file, coding);
    var info = iniParser.parse(sm);
    var value;
    Object.keys(info).forEach(key => {
        if (pkey.toLowerCase() == key.toLowerCase()) {
            value = info[key];
            if (value.length > 1 && value[0] == '"' && value[value.length - 1] == '"') {
                value = value.substr(1, value.length - 2);
            }
        }
    })
    return value;
}

function translate(local, onlyCheck) {
    var localFile = baseDir + "/" + local +"/messages.json";
    if (!fs.existsSync(baseFile)) {
        console.error("***基础资源不存在：" + baseFile);
        return;
    }

    if (!fs.existsSync(localFile)) {
        console.error("***本地资源不存在：" + localFile);
        return;
    }    

    var baseMsg =  JSON.parse(fs.readFileSync(baseFile));
    var localMsg = JSON.parse(fs.readFileSync(localFile));
    var newLocalMsg = {};

    console.log("======正在翻译：", local, "======")
    Object.keys(baseMsg).forEach((itemKey) => {
        var messageKey = "message";
        var itemValue = baseMsg[itemKey];
        var key = itemValue[messageKey];
        var value = getTransValue(local, key);
        if (!value) {
            var localItemValue = localMsg[itemKey];
            if (localItemValue) {
                value = localItemValue[messageKey]                     
            } else {
                console.log('*******缺少翻译资源：', itemKey, itemValue[messageKey])                           
            }
        }

        if (!value) {
            value = itemValue[messageKey];
        }

        var localItemValue;
        localItemValue = {};
        localItemValue[messageKey] = value;
        newLocalMsg[itemKey] = localItemValue;
    })

    if (!!onlyCheck) {        
        console.log("======结束翻译：", local, "======", newLocalMsg)
    } else {
        fs.writeFileSync(localFile, JSON.stringify(newLocalMsg, undefined, "\t"));
        console.log("======翻译结束，保存至：", localFile, "======")
    }



}

start();