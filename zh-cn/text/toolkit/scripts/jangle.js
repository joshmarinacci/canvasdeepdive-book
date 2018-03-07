

function Jangle() {
    this.vars = {novar:0};
    this.startX = 0;
    this.startValue = 0;
    this.drawfun = null;
    this.code = null;
    this.down = false;
    this.ai = -1;
    this.exampleid = null;
    var self = this;
    
    this.clear = function(ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0,0,self.canvas.width,self.canvas.height);
    }

    this.invokeFunction = function() {
        var ctx = self.canvas.getContext('2d');
        self.clear(ctx);
        ctx.save();
        ctx.strokeStyle = 'black';
        var values = [ctx];
        for(var id in self.vars) {
            values.push(self.vars[id]);
        }
        self.drawfun.apply(this,values);
        ctx.restore();
    }
    this.setup = function(exampleid) {
        self.exampleid = exampleid;
        var newvars = {};
        for(var id in self.vars) {
            var newid=exampleid+"_"+id;
            newvars[newid] = self.vars[id];
        }
        self.canvas = $("#"+exampleid+" canvas")[0];
        self.code = $("#"+exampleid+" pre")[0];
        self.invokeFunction();
        
        var src = self.drawfun.toString().split("\n");
        var val = "";
        for(var i=0; i<src.length; i++) {
            if(i==0) continue;
            if(i == src.length-1) continue;
            val += src[i];
            val += "\n";
        }
        
        val = val.replace("<","&lt;");
        for(var id in self.vars) {
            var newid=exampleid+"_"+id;
            val = val.replace(new RegExp(id),"<b id='"+newid+"'>"+self.vars[id]+"</b>");
        }
        self.vars = newvars;
        self.code.innerHTML = val;
        $("#"+exampleid+" .popup").hide();
        
        for(var id in self.vars) {
            var varx = document.getElementById(""+id);
            $(varx).bind('mousedown',function(e){
                var popup = $("#"+exampleid+" .popup");
                var id = $(this).attr("id");
                e.preventDefault();
                self.startX = e.clientX;
                self.startValue = self.vars[id];
                self.down = true;
                self.addListeners();
                self.activeID = id;
                popup.show();
                var ppos = $("#"+exampleid).offset();
                var tpos = $(this).offset();
                popup.css("top",(tpos.top-ppos.top-80)+"px");
                popup.css("left",(e.pageX-ppos.left-30)+"px");
            });
            varx.addEventListener('touchstart', function(e) {
                var popup = $("#"+exampleid+" .popup");
                var id = $(this).attr("id");
                e.preventDefault();
                var touch = e.touches[0];
                var x = touch.pageX;
                var y = touch.pageY;
                self.startX = x;
                self.startValue = self.vars[id];
                self.down = true;
                self.addListeners();
                self.activeID = id;
                popup.show();
                var ppos = $("#"+exampleid).offset();
                var tpos = $(this).offset();
                popup.css("top",(tpos.top-ppos.top-80)+"px");
                popup.css("left",(x-ppos.left-30)+"px");
                popup.text(""+self.startValue);
            });
        }
    };
    
    this.doc_mouse_move = function(e){
        if(self.down) {
            e.preventDefault();
            if(e.which == 1) {
                var newvalue = (e.clientX-self.startX) + self.startValue;
                self.vars[self.activeID] = newvalue;
                var elem = document.getElementById(self.activeID);
                elem.innerHTML = newvalue;
                self.invokeFunction();
                var popup = $("#"+self.exampleid+" .popup");
                var ppos = $("#"+self.exampleid).offset();
                var tpos = $(this).offset();
                popup.css("left",(e.pageX-ppos.left-30)+"px");
                popup.get(0).innerHTML = ""+newvalue;
            }
        }
    }; 
    this.doc_touch_move = function(e){
        var touch = e.touches[0];
        var x = touch.pageX;
        if(self.down) {
            e.preventDefault();
            var newvalue = (x-self.startX) + self.startValue;
            self.vars[self.activeID] = newvalue;
            var elem = document.getElementById(self.activeID);
            elem.innerHTML = newvalue;
            self.invokeFunction();
            var popup = $("#"+self.exampleid+" .popup");
            var ppos = $("#"+self.exampleid).offset();
            popup.css("left",(x-ppos.left-30)+"px");
            popup.get(0).innerHTML = ""+newvalue;
        }
    }; 
    
    this.doc_mouse_up = function(e){
        if(self.down) {
            e.preventDefault();
            self.down = false;
            self.removeListeners();
            var popup = $("#"+self.exampleid+" .popup");
            popup.hide();
        }
    };
    this.doc_touch_end = function(e) {
        var touch = e.changedTouches[0];
        e.preventDefault();
        self.down = false;
        self.removeListeners();
        var popup = $("#"+self.exampleid+" .popup");
        popup.hide();
        var x = touch.pageX;
    }
    
    this.addListeners = function() {
        document.addEventListener('mousemove',self.doc_mouse_move);
        document.addEventListener('touchmove',self.doc_touch_move);
        document.addEventListener('touchend',self.doc_touch_end);
        document.addEventListener('mouseup',self.doc_mouse_up);
    }
    
    this.removeListeners = function() {
        document.removeEventListener('mousemove',self.doc_mouse_move);
        document.addEventListener('touchmove',self.doc_touch_move);
        document.addEventListener('touchend',self.doc_touch_end);
        document.removeEventListener('mouseup',self.doc_mouse_up);
    }
    
}

