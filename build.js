var wrench = require('wrench');

var files = [
    '01a_overview.md',
    '02a_handson_charts.md',
    '03a_advanced_drawing.md',
    '04a_animation.md',
    //'05a_gaming1.md',
    '05b_gaming2.md',
    '05c_gaming3.md',
    '12a_intro_audio.md',
    '12b_deep_audio.md',
    '12c_game_audio.md',
    '13a_gameinput.md',
    ];


// ================

var ometajs = require('ometa-js');
var fs = require('fs');
var Mustache = require('mustache');

var chapter_template = fs.readFileSync('templates/chapter.template').toString();

var MD = require('./markdown2.ometajs').Markdown;


MD.customProcessors['jangle'] = function(append, params) {
    console.log("jangle params",params);
    console.log("code block = ", MD.codeblocks[params.id]);

    params.code = MD.codeblocks[params.id];
    var htmlcode = params.code;
    var rawcode  = params.code;
    htmlcode = htmlcode.replace(/(var\d)/g,'<i class="$1"></i>');

    var dvals = [];
    var paramNames = [];
    for(var name in params.defaultValues) {
        var val = params.defaultValues[name];
        console.log("name = ",name,val);
        htmlcode = htmlcode.replace('value'+name,val);
        dvals.push(val);
        paramNames.push(name);
    }

    params.htmlcode = htmlcode;
    params.rawcode  = rawcode;
    params.drawCall = 'drawIt(ctx,'+dvals.join(',')+');';
    params.paramNames = '"'+paramNames.join('","')+'"';
    params.paramStruct = JSON.stringify(params.defaultValues);

    var template = fs.readFileSync('templates/jangle.template').toString();
    append(Mustache.render(template,params));

}


var SCREENSHOT_TEMPLATE = fs.readFileSync('templates/screenshot.template').toString();
var INTERACTIVE_TEMPLATE = fs.readFileSync('templates/interactive.template').toString();

function findTitle(obj) {
    for(var id in obj) {
        if(obj[id].level == 1) {
            return {
                id: id,
                text: obj[id].text,
            }
        }
    }
}

function findSections(obj) {
    var sections = [];
    for(var id in obj) {
        if(obj[id].level == 2) {
            sections.push({
                id: id,
                text: obj[id].text
            });
        }
    }
    return sections;
}


/*
processBook({
    files: files,
    basepath: 'chapters/',
    outdir: 'build2',
});
*/

processBook({
    files: ['lecture1.md','handson1.md','lecture2.md','handson2.md','lecture3.md'],
    basepath: '2014/',
    outdir: 'build2014',
    imagepath: '2014/',
    demopath:'2014/'
});

function copyFile(image_in, image_out) {
    try {
        fs.createReadStream(image_in)
            .on('error', function() {
                console.log("error reading file",image_in);
            })
            .pipe(fs.createWriteStream(image_out))
            .on('error', function() {
                console.log("got an error writing to ",image_out);
            });
    } catch (e) {
        console.log("error copying", image_in);
    }
}


function processBook(args) {
    if(!args.files) throw new Error();
    if(!args.basepath) throw new Error();
    if(!args.outdir) throw new Error();
    if(!args.imagepath) throw new Error();
    if(!args.demopath) throw new Error();


    wrench.rmdirSyncRecursive(args.outdir, true);

    var image_out_path = args.outdir+'/images';
    wrench.mkdirSyncRecursive(image_out_path);

    var demo_out_path = args.outdir+'/demos';
    wrench.mkdirSyncRecursive(demo_out_path);

    wrench.copyDirSyncRecursive('node_modules/bootstrap/dist/css',args.outdir+'/css');
    wrench.copyDirSyncRecursive('node_modules/bootstrap/dist/js',args.outdir+'/js');
    wrench.copyDirSyncRecursive('node_modules/bootstrap/dist/fonts',args.outdir+'/fonts');
    copyFile('templates/main.css',args.outdir+'/css/main.css');



    MD.classProcessors['screenshot'] = function(append, text, href) {
        var image_in = args.imagepath+href;
        var ext = href.substring(href.lastIndexOf('.'));
        var name = "img"+Math.round(Math.random()*10000)+ext;
        var image_out = image_out_path+'/'+name;
        console.log("copying",image_in,"to",image_out);
        copyFile(image_in,image_out);
        var data = {
            text:text,
            url:'images/'+name,
        }
        append(Mustache.render(SCREENSHOT_TEMPLATE, data));
    }

    MD.customProcessors['interactive'] = function(append, params) {
        var image_in = args.imagepath+params.image;
        var image_name = "img"+Math.round(Math.random()*10000)+".png";
        var image_out = image_out_path+'/'+image_name;
        copyFile(image_in,image_out);
        console.log("copying",image_in,"to",image_out);

        var html_in  = args.demopath+params.href;
        var html_name = "demo"+Math.round(Math.random()*10000)+".html";
        var html_out = demo_out_path+'/'+html_name;
        copyFile(html_in,html_out);
        console.log("copying",html_in,"to",html_out);

        var data = {
            href:'demos/'+html_name,
            url:'images/'+image_name,
        }
        append(Mustache.render(INTERACTIVE_TEMPLATE, data));
    }




    var results = [];
    var count = 1;
    if(!fs.existsSync(args.outdir)) fs.mkdirSync(args.outdir);

    args.files.forEach(function(filename) {
        var text = fs.readFileSync(args.basepath+filename);
        MD.reset();
        var rendered = MD.matchAll(text.toString(),'start');
        rendered.number = count;
        var text = Mustache.render(chapter_template,rendered);
        fs.writeFileSync(args.outdir+'/chapter'+count+'.html',text);
        results.push({
            title: findTitle(rendered.sections),
            sections: findSections(rendered.sections),
            filename: 'chapter'+count+'.html',
        });
        count++;
    });

    var toc_templ = fs.readFileSync('templates/toc.template').toString();
    var toc = {
        bookname: 'HTML Canvas Deep Dive',
        sections: results,
    }
    fs.writeFileSync(args.outdir+'/toc.html',Mustache.render(toc_templ,toc));

}
