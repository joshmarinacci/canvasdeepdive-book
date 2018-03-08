
$(document).ready(function() {

        
$("#fchapter").text($("h1").text());
console.log("h1 = " + $("h1").text());

/* add the glossary */
	$(document).click(function() {
		var pop = $("#glossary_popup");
		pop.hide();
	});
	$("#glossary_popup").hide();
	console.log('adding glossary');
	$(".glossary").click(function(e) {
		//e.preventDefault();
		e.stopPropagation();
		var th = $(this);
		var pop = $("#glossary_popup");
		$("#glossary_popup h4").text(th.text());
		$("#glossary_popup p").text(th.attr("title"));
	    var scrolltop = $("body").scrollTop();
	    
	    var yoff = th.offset().top-scrolltop;
		yoff += th.height();
		yoff += 20;

	    var xoff = th.offset().left;
	    xoff += th.width()/2;
		xoff = xoff - pop.width()/2;
		
		pop.toggle();
		pop.css("top",yoff+"px");
		pop.css("left",xoff+"px");
	});


/* restyle the pre code */

	// $("pre code").each(function(){
	// 	var text = $(this).text();
	// 	var lines = text.split("\n"); 
	// 	var newText = "";
	// 	for(var i=0; i<lines.length; i++) {
	// 		var line = lines[i];
	// 		line = line.replace(/</g,'&lt;');
	// 		line = line.replace(/>/g,'&gt;');
	// 		newText += "<span>"+line+" </span>";
	// 	}
	// 	$(this).html(newText);
	// });



    
    

});


