var ometajs = require('ometa-js');
var fs = require('fs');
var Mustache = require('mustache');

var template = fs.readFileSync('templates/presentation.template').toString();
var MD = require('./markdown2.ometajs').Markdown;

var pages = [];
var currentPage = {
    buf:"",
    notes:"",
    content:[],
};
pages.push(currentPage);
var inNote = false;
MD.append = function(text) {
    if(text) {
        if(inNote) {
            //console.log('appending inside note',text);
            currentPage.notes += text;
        } else {
            currentPage.buf += text;
        }
    }
}


MD.horizontalRule = function() {
    this.append('\n');
    this.closeAll();
    inNote = false;
//    console.log('==============\nopening note = ', currentPage.notes);

    currentPage = { buf:'', notes:'', content:[] };
    pages.push(currentPage);

}

/*
var old_closeAll = MD.closeAll;
MD.closeAll = function() {
    old_closeAll.call(MD);
    inNote = false;
}
*/

/*
MD.openNoteParagraph = function() {
    console.log("opening note");
//    inNote = true;
    this.openBlock('p');
}
*/

if(!fs.existsSync('build')) fs.mkdirSync('build');
var input = fs.readFileSync('presentations/ble.md').toString();
MD.reset();
var out = MD.matchAll(input,'start');
//console.log("output = ",out);
//console.log("pages = ",pages);
//console.log("=======");
pages.forEach(function(page) {
//    console.log('<section>');
    console.log(page.notes);
//    console.log('</section>\n\n');
});

fs.writeFileSync('build/pres.html',Mustache.render(template,pages));;
