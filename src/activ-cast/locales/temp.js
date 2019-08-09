var fs = require('fs');
var xmlParser = require('fast-xml-parser');
var baseDir = "../_locales";
var baseFile = baseDir + "/en/messages.json"
var transDir = "Structured delivery 3_2207805_ActivCast Strings EN July04 json files/values-"

// fs.writeFileSync("test.json", JSON.stringify(msg, undefined, "\t"))

function translate(local) {    
    var transFile = baseDir + "/" + local + "/messages.json"    
    if (!fs.existsSync(transFile)) {
        console.error("***翻译资源不存在：" + transFile);
        return;
    }
    var transMsg = JSON.parse(fs.readFileSync(transFile));
    console.log("======正在翻译：", local, "======")
    Object.keys(transMsg).forEach((key) => {
        var value = transMsg[key];
        switch(key) {
            case "manifest_name":
            case "manifest_description":
            case "manifest_short_name":
            case "manifest_default_title":
            case "Activ_Cast":
                value["message"] = "Promethean® Screen Share"
                break;
        }
    })

    var toFile = transFile;

    fs.writeFileSync(toFile, JSON.stringify(transMsg, undefined, "\t"));

    console.log("======翻译结束，保存至：", toFile, "======")

}

function start() {
    ["ar", "cs", "da", "de", "es", "fi", "fr", "hu", "id", "it", "ja", "kk", "lt", 
    "lv", "ms", "nb", "nl", "pl", "pt", "ru", "sv", "th", "tr", "vi", "zh", "zh_TW"]
    .forEach((key) => {
        translate(key)
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

start();