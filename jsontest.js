var ometajs = require('ometa-js');
var fs = require('fs');
var text = fs.readFileSync('test.json').toString();
var json = require('./markdown2.ometajs').JSONish;
var out = json.matchAll(text,'start');
console.log(text);
console.log(JSON.stringify(out,null,'  '));
