var ometajs = require('ometa-js');
var fs = require('fs');
var Mustache = require('mustache');

var template = fs.readFileSync('templates/presentation.template').toString();
var MD = require('./markdown2.ometajs').Markdown;

var pages = [];
var currentPage = {
    buf:"",
    content:[],
};
//pages.push(currentPage);
MD.append = function(text) {
    if(text) currentPage.buf += text;
}

var oldheader = MD.header;
MD.header = function(level, text) {
    if(level == 1) {
        currentPage = { buf:''};
        pages.push(currentPage);
        currentPage.content = [];
        currentPage.content.push(text);
    }
    oldheader.call(MD,level,text);
}


if(!fs.existsSync('build')) fs.mkdirSync('build');
var input = fs.readFileSync('presentations/ble.md').toString();
MD.reset();
var out = MD.matchAll(input,'start');
console.log("output = ",out);
console.log("pages = ",pages);
console.log("=======");
pages.forEach(function(page) {
    console.log('<section>');
    console.log(page.buf);
    console.log('</section>\n\n');
});

fs.writeFileSync('build/pres.html',Mustache.render(template,pages));;
