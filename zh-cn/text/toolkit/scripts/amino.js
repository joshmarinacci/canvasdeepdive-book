/*
@overview Amino: JavaScript Scenegraph

Amino is a scenegraph for drawing 2D graphics 
in JavaScript with the
HTML 5 Canvas API. By creating a tree of nodes,
you can draw shapes,
text, images special effects; complete with
transforms and animation.
Amino takes care of all rendering, animation, 
and event handling
so you can build *rich* interactive graphics 
with very little code.
Using Amino is much more convenient than 
writing Canvas code by hand.

Here's a quick example:    

    <canvas id="can" width="200" height="200"></canvas>
    <script>
    
    //attach a runner to the canvas
    var can = document.getElementById("can");
    var runner = new Runner().setCanvas(can);
    
    //create a rect and a circle
    var r = new Rect().set(0,0,50,50).setFill("green");
    var c = new Circle().set(100,100,30).setFill("blue");
    
    //add the shapes to a group
    var g = new Group().add(r).add(c);
    
    //make the rectangle go left and right every 5 seconds
    var anim = new Anim(g,"x",0,150,5);
    runner.addAnim(anim);
    
    //set the group as the root of the scenegraph, then start
    runner.root = g;
    runner.start();
    
    </script>

A note on properties. Most objects have properties like `x` or `width`.
Properties are accessed with getters.  For example, to access the `width`
property on a rectangle, call `rect.getWidth()`. Properties are set 
with setters. For example, to set the `width` property
on a rectangle, call `rect.setWidth(100)`. Most functions, especially 
property setters, are chainable. This means you
can set a bunch of properties at once like this:

    var c = new Rect()
        .setX(50)
        .setY(50)
        .setWidth(100)
        .setHeight(200)
        .setFill("green")
        .setStrokeWidth(5)
        .setStroke("black")
        ;
@end
*/


(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


function attachEvent(node,name,func) {
    //self.masterListeners.push(func);
    if(node.addEventListener) {
        node.addEventListener(name,func,false);
    } else if(node.attachEvent) {
        node.attachEvent(name,func);
    }
};

// 'extend' is From Jo lib, by Dave Balmer
// syntactic sugar to make it easier to extend a class
Function.prototype.extend = function(superclass, proto) {
	// create our new subclass
	this.prototype = new superclass();
	/*

	// optional subclass methods and properties
	if (proto) {
		for (var i in proto)
			this.prototype[i] = proto[i];
	}
	*/
};



/*
@class Amino 

#category core

The engine that drives the whole system. 
You generally only need one of these per page. It is
the first thing you create. Attach canvases to it using
addCanvas. ex:  

    var amino = new Amino(); 
    var canvas = amino.addCanvas('canvasid');
@end
*/
function Amino() {
	this.canvases = [];
	this.anims = [];
	this.timeout = 1000/30;
	this.autoPaint = false;
    this.isTouchEnabled = "ontouchend" in document;
}

//@function addCanvas(id) adds a new canvas to the engine. Pass in the string id of a canvas element in the page.
Amino.prototype.addCanvas = function(id) {
	var canvasElement = document.getElementById(id);
	var canvas = new Canvas(this,canvasElement);
	this.canvases.push(canvas);
	return canvas;
}

//@function addAnim(anim) adds a new animation to then engine. Note that you must also start the animation as well.
Amino.prototype.addAnim = function(anim) {
	anim.engine = this;
	this.anims.push(anim);
	return this;
}
//@function removeAnim(anim) removes an animation from the engine.
Amino.prototype.removeAnim = function(anim) {
    var index = this.anims.indexOf(anim);
    this.anims.splice(index,1);
    return this;
}

//@function start() Starts the Amino engine. You must call this once or else nothing will be drawn on the screen.
Amino.prototype.start = function() {
    var self = this;
    var rp = function() {
        if(self.shouldStop) return;
        self.repaint();
        window.requestAnimationFrame(rp);
    }
    
	if(this.autoPaint) {
		rp();
	} else {
		//just paint once
		this.repaint();
	}
}

Amino.prototype.stop = function() {
    this.shouldStop = true;
}

Amino.prototype.repaint = function() {
	
	var animRunning = false;
	for(var i=0; i<this.anims.length; i++) {
		var anim = this.anims[i];
		if(anim.playing) animRunning = true;
		anim.update();
	}
	
	for(var i=0; i<this.canvases.length; i++) {
		this.canvases[i].repaint();
	}
	
	if(animRunning && !this.autoPaint) {
		var self = this;
		var rp = function() {
			self.repaint();
		}
		window.requestAnimationFrame(rp);
	}
}


Amino.prototype.animationChanged = function() {
	this.repaint();
}

/*
@class Canvas 
Canvas represents a drawable area on the screen, usually
a canvas tag.  Create it using the Amino class by passing the
ID of your canvas element to amino.addCanvas(id);

#category core

@end
*/

function Canvas(engine,domCanvas) {
	this.engine = engine;
	this.domCanvas = domCanvas;
	this.nodes = [];
	this.listeners = [];
	this.mousePressed = false;
	this.bgfill = "white";
	this.transparent = false;
	this.oldwidth = -1;
	var self = this;
	
	this.autoSize = true;
	this.autoScale = true;
	
    this.ratio = this.domCanvas.width / this.domCanvas.height;
    this.originalWidth = this.domCanvas.width;
	
	this.processEvent = function(type,domCanvas,e,et) {
	    e.preventDefault();
        var point = self.calcLocalXY(domCanvas,et);
        console.log(point, e)
        var node = self.findNode(point);
    	for(var i=0; i<self.listeners.length; i++) {
    		var listener = self.listeners[i];
    		if(listener.node === node) {
    		    if(listener.type == type) {
    		        listener.fn({point:point,target:node});
    		    }
    		}
    	}
	}
    attachEvent(domCanvas,'mousedown',function(e){
        self.processEvent('press',domCanvas,e,e);
        self.mousePressed = true;
    });
    
    attachEvent(domCanvas,'mousemove',function(e){
        if(!self.mousePressed) return;
        self.processEvent('drag',domCanvas,e,e);
        self.mousePressed = true;
    });
    
    attachEvent(domCanvas,'mouseup',function(e){
        self.processEvent('release',domCanvas,e,e);
        self.processEvent('click',domCanvas,e,e);
        self.mousePressed = false;
    });

    if(engine.isTouchEnabled) {    
		domCanvas.addEventListener('touchstart', function(event) {
            self.processEvent("press",domCanvas,event,event.touches[0]);
            self.mousePressed = true;
		});
		domCanvas.addEventListener('touchmove', function(event) {
            self.processEvent("drag",domCanvas,event,event.touches[0]);
            /*
			event.preventDefault();
			var touch = event.touches[0];
			var x = touch.pageX;
			var y = touch.pageY;
			//self.drag(x,y);
			*/
			//lastTouch = touch;
            //window.alert("moved");
		});
		domCanvas.addEventListener('touchend', function(event) {
            self.processEvent('release',domCanvas,event,event.changedTouches[0]);
            self.processEvent('click',domCanvas,event,event.changedTouches[0]);
            self.mousePressed = false;
			//var touch = event.changedTouches[0];
			//self.end(touch.pageX,touch.pageY);
		});	
	}
    
    
    this.calcLocalXY = function(canvas,event) {
        var docX = -1;
        var docY = -1;
        if (event.pageX == null) {
            // IE case
            var d= (document.documentElement && document.documentElement.scrollLeft != null) ?
                 document.documentElement : document.body;
             docX= event.clientX + d.scrollLeft;
             docY= event.clientY + d.scrollTop;
        } else {
            // all other browsers
            docX= event.pageX;
            docY= event.pageY;
        }        
        docX -= canvas.offsetLeft;
        docY -= canvas.offsetTop;
        return {x:docX,y:docY};
    };		
    
    
    this.findNode = function(point) {
    	//go in reverse, ie: front to back
    	for(var i=this.nodes.length-1; i>=0; i--) {
    		var node = this.nodes[i];
    		if(node && node.isVisible() && node.contains(point)) {
    			return node;
    		}
    		
    		if(node instanceof Group && node.isVisible()) {
    		    var r = this.searchGroup(node,point);
    		    if(r) {
    		        return r;
    		    }
    		}
    	}
    	return this;
    }
    
    this.searchGroup = function(group,point) {
        point = {x:point.x-group.getX(), y:point.y-group.getY() };
        for(var j=group.children.length-1; j>=0; j--) {
            var node = group.children[j];
            if(node && node.isVisible() && node.contains(point)) {
                return node;
            }
            if(node instanceof Group && node.isVisible()) {
    		    var r = this.searchGroup(node,point);
    		    if(r) return r;
            }
        }
        return null;
    }
    
}


Canvas.prototype.repaint = function() {
	var ctx = this.domCanvas.getContext('2d');
	this.width = this.domCanvas.width;
	this.height = this.domCanvas.height;
	
//	console.log("width = " + this.domCanvas.width 
//	    + " client width = " + this.domCanvas.clientWidth);
	var w = this.domCanvas.clientWidth;
	if(w != this.oldwidth && this.autoSize) {
	    this.domCanvas.width = w;
	    this.domCanvas.height = w/this.ratio;
		this.oldwidth = w;
	}
	
	
	ctx.fillStyle = this.bgfill;
	if(this.transparent) {
	    ctx.clearRect(0,0,this.width,this.height);
	} else {
	    ctx.fillRect(0,0,this.width,this.height);
	}
	
	ctx.can = this;
	ctx.engine = this.engine;
	
	ctx.save();
	//ctx.rect(0,0,100,100);
	//ctx.clip();
	if(this.autoScale) {
	    var scale =  w/this.originalWidth;
	    ctx.scale(scale,scale);
	}
	
	
	for(var i=0; i<this.nodes.length; i++) {
		var node = this.nodes[i];
		node.paint(ctx);
	}
	ctx.restore();
	this.dirty = false;
	
}

//@function setBackground(bgfill) set the background color of the canvas
Canvas.prototype.setBackground = function(bgfill) {
    this.bgfill = bgfill;
}
//@function setTransparent(trans) set if the canvas should draw it's background or let it be transparent
Canvas.prototype.setTransparent = function(transparent) {
    this.transparent = transparent;
}

//@function add(node) Adds a node to this canvas.
Canvas.prototype.add = function(node) {
	this.nodes.push(node);
	node.parent = this;
}

//@function on(type,node,fn)  adds an event handler of the specified type. ex: canvas.on('click',rect,function(){});
Canvas.prototype.on = function(eventtype, node, fn) {
    this.listeners.push({
        type:eventtype,
        node:node,
        fn:fn,
    });
}
//@function onClick(node,function) adds an event handler to be called when the user clicks on the specified node. Works with both mouse and touch events.
Canvas.prototype.onClick = function(node,fn) {
	this.listeners.push({
		type:'click'
		,node:node
		,fn:fn
	});
}

//@function onPress(node,function) adds an event handler to be called when the user presses on the specified node. Works with both mouse and touch events.
Canvas.prototype.onPress = function(node,fn) {
	this.listeners.push({
		type:'press'
		,node:node
		,fn:fn
	});
}
//@function onRelease(node,function) adds an event handler to be called when the user presses and then releases on the specified node. Works with both mouse and touch events.
Canvas.prototype.onRelease = function(node,fn) {
	this.listeners.push({
		type:'release'
		,node:node
		,fn:fn
	});
}
//@function onDrag(node,function) adds an event handler to be called when the user drags on the specified node. Works with both mouse and touch events.
Canvas.prototype.onDrag = function(node,fn) {
	this.listeners.push({
		type:'drag'
		,node:node
		,fn:fn
	});
}
//@function onMomentumDrag(node,function) adds an event handler to be called when the user drags on the specified node. Works with both mouse and touch events. Will apply momentum so that the drag continues after the user has released their mouse/finger.
Canvas.prototype.onMomentumDrag = function(node,fn) {
	this.listeners.push({
		type:'momentumdrag'
		,node:node
		,fn:fn
	});
}
Canvas.prototype.setDirty = function() {
	if(!this.dirty) {
		this.dirty = true;
		if(!this.engine.autoPaint) {
			this.repaint();
		}
	}
}
//@function getWidth() Returns the width of the canvas in pixels
Canvas.prototype.getWidth = function() {
    return this.domCanvas.width;
}
//@function getHeight() Returns the height of the canvas in pixels
Canvas.prototype.getHeight = function() {
    return this.domCanvas.height;
}


/*
@class AminoNode the base class for all nodes
#category core
@end
*/
function AminoNode() {
    var self = this;
	this.typename = "AminoNode";
	this.hashcode = Math.random();
	
	//@property parent the parent of this node. Might be null if the node has not been added to the scene
	this.parent = null;
	this.setParent = function(parent) {
	    this.parent = parent;
	    return this;
	}
	this.getParent = function() {
	    return this.parent;
	}
	
	//@property visible Controls visibility of this node. Note: non-visible nodes cannot receive input events.
	this.visible = true;
	this.setVisible = function(visible) {
	    this.visible = visible;
	    this.setDirty();
	    return this;
	}
	this.isVisible = function() {
	    return this.visible;
	}
	
	//@function setDirty() marks this node as being dirty
	this.setDirty = function() {
        if(self.parent != null) {
            self.parent.setDirty();
        }
    }
    this.contains = function () {}
}

/*
@class AminoShape
The base class for all shape nodes. Shapes all have fills and strokes.
#category core
@end
*/
function AminoShape() {
    AminoNode.call(this);
	var self = this;
	this.typename = "AminoShape";
	this.fill = "gray";
	this.stroke = "black";
	this.strokeWidth = 0;
	this.opacity = 1.0;
	
	//@property fill  The fill color of this shape. This can be a hex string like "#ff0000" or a color name like "red" or a complex fill such as a gradient.
	this.setFill = function(fill) {
	    self.fill = fill;
	    self.setDirty();
	    return self;
	}
	
	this.paint = function(ctx) {
        if(self.fill.generate) {
            ctx.fillStyle = self.fill.generate(ctx);
        } else {
            ctx.fillStyle = self.fill;
        }
        if(self.getOpacity() < 1) {
            ctx.save();
            ctx.globalAlpha = self.getOpacity();
            self.fillShape(ctx);
            ctx.restore();
        } else {
            self.fillShape(ctx);
        }
        if(self.strokeWidth > 0) {
            if(self.stroke.generate) {
                ctx.strokeStyle = self.stroke.generate(ctx);
            } else {
                ctx.strokeStyle = self.stroke;
            }
            ctx.lineWidth = self.strokeWidth;
            self.strokeShape(ctx);
        }
    }
}
AminoShape.extend(AminoNode);

AminoShape.prototype.getFill = function() {
	return this.fill;
}
AminoShape.prototype.setOpacity = function(opacity) {
	this.opacity = opacity;
	this.setDirty();
	return this;
}
AminoShape.prototype.getOpacity = function() {
    return this.opacity;
}

//@property  stroke The stroke color of this shape. This can be a hex value or color name, both as strings. ex: setStroke("#000000") or setStroke("black");
AminoShape.prototype.setStroke = function(stroke) {
	this.stroke = stroke;
	this.setDirty();
	return this;
}
AminoShape.prototype.getStroke = function() {
    return this.stroke;
}

//@property strokeWidth The current stroke width of this shapestroke. Must be a positive number or 0. If zero then the shape will not be stroked.
AminoShape.prototype.setStrokeWidth = function(strokeWidth) {
	this.strokeWidth = strokeWidth;
	this.setDirty();
	return this;
}
AminoShape.prototype.getStrokeWidth = function() {
    return this.strokeWidth;
}

//@function contains(point) indicates if the shape contains the point
AminoShape.prototype.contains = function(point) {
    return false;
}






/*
@class Transform
A transform applies an affine transform to it's child node.  You must
pass the child node to the Transform constructor. Then you can set
the translate, rotate, and scale properties. ex:

    var r = new Rect().set(0,0,100,50).setFill("red");
    var t = new Transform(r).setTranslateX(50).setRotate(30);

#category core
@end 
*/
function Transform(n) {
    this.node = n;
    this.node.parent = this;
   	this.typename = "Transform";
    var self = this;
    
    //@property translateX translate in the X direction
    this.translateX = 0;
    this.setTranslateX = function(tx) {
        self.translateX = tx;
        self.setDirty();
        return self;
    };
    this.getTranslateX = function() {
        return this.translateX;
    };
    
    //@property translateY translate in the Y direction
    this.translateY = 0;
    this.setTranslateY = function(ty) {
        this.translateY = ty;
        this.setDirty();
        return this;
    };
    this.getTranslateY = function() {
        return this.translateY;
    };
    
    //@property scaleX scale in the X direction
    this.scaleX = 1;
    this.setScaleX = function(sx) {
        this.scaleX = sx;
        this.setDirty();
        return this;
    };
    this.getScaleX = function() {
        return this.scaleX;
    };
        
        
    //@property scaleY scale in the X direction
    this.scaleY = 1;
    this.setScaleY = function(sy) {
        this.scaleY = sy;
        this.setDirty();
        return this;
    };
    this.getScaleY = function() {
        return this.scaleY;
    };
    
    //@property anchorX scale in the X direction
    this.anchorX = 0;
    this.setAnchorX = function(sx) {
        this.anchorX = sx;
        this.setDirty();
        return this;
    };
    this.getAnchorX = function() {
        return this.anchorX;
    };
        
        
    //@property anchorY scale in the X direction
    this.anchorY = 0;
    this.setAnchorY = function(sy) {
        this.anchorY = sy;
        this.setDirty();
        return this;
    };
    this.getAnchorY = function() {
        return this.anchorY;
    };
    
    //@property rotate set the rotation, in degrees
    this.rotate = 0;
    this.setRotate = function(rotate) {
        this.rotate = rotate;
        this.setDirty();
        return this;
    };
    this.getRotate = function() {
        return this.rotate;
    };
    
    
    
    /* container stuff */
    this.contains = function(x,y) {
        return false;
    };
    this.hasChildren = function() {
        return true;
    };
    this.childCount = function() {
        return 1;
    };
    this.getChild = function(n) {
        return this.node;
    };
    

    this.paint = function(ctx) {
        ctx.save();
        ctx.translate(self.translateX,self.translateY);
        ctx.translate(self.anchorX,self.anchorY);
        var r = this.rotate % 360;
        ctx.rotate(r*Math.PI/180.0,0,0);
        if(self.scaleX != 1 || self.scaleY != 1) {
            ctx.scale(self.scaleX,self.scaleY);
        }
        ctx.translate(-self.anchorX,-self.anchorY);
        self.node.paint(ctx);
        ctx.restore();
    };
    
    return true;
}
Transform.extend(AminoNode);

Transform.prototype.setDirty = function() {
	if(this.parent != null) {
		this.parent.setDirty();
	}
}


/*
@class Group A parent node which holds an ordered list of child nodes. It does not draw anything by itself, but setting visible to false will hide the children. 
#category core
@end
*/

function Group() {
    AminoNode.call(this);
	this.typename = "Group";
    this.children = [];
    this.parent = null;
    var self = this;
    
    //@property x set the x coordinate of the group.
    this.x = 0;
    this.setX = function(x) {
        self.x = x;
        self.setDirty();
        return self;
    };
    this.getX = function() {
        return self.x;
    };
    
    //@property y set the y coordinate of the group.
    this.y = 0;
    this.setY = function(y) {
        self.y = y;
        self.setDirty();
        return self;
    };
    this.getY = function() {
        return self.y;
    };
    
    //@property opacity set the opacity of the group
    this.opacity = 1.0;
    this.setOpacity = function(o) {
        self.opacity = o;
        return self;
    };
    this.getOpacity = function() {
        return self.opacity;
    };
    
    //@function add(node) Add the child `n` to this group.
    this.add = function(n) {
        self.children[self.children.length] = n;
        n.setParent(self);
        self.setDirty();
        return self;
    };
    //@function remove(node) Remove the child `n` from this group.
    this.remove = function(n) {
        var i = self.children.indexOf(n);
        if(i >= 0) {
            self.children.splice(i,1);
            n.setParent(null);
        }
        self.setDirty();
        return self;
    };
    
    this.paint = function(ctx) {
        if(!self.isVisible()) return;
        var ga = ctx.globalAlpha;
        ctx.globalAlpha = self.opacity;
        ctx.translate(self.x,self.y);
        for(var i=0; i<self.children.length;i++) {
            self.children[i].paint(ctx);
        }
        ctx.translate(-self.x,-self.y);
        ctx.globalAlpha = ga;
    };
    
    //@function clear() Remove all children from this group.
    this.clear = function() {
        self.children = [];
        self.setDirty();
        return self;
    };
    //@function contains(x,y) Always returns false. You should call contains on the children instead.
    this.contains = function(x,y) {
        return false;
    };
    //@function hasChildren() Always returns true, whether or not it actually has children at the time.
    this.hasChildren = function() {
        return true;
    };
    this.convertToChildCoords = function(x,y) {
        return [x-self.x,y-self.y];
    };
    //@function childCount() Returns the number of child nodes in this group.
    this.childCount = function() {
        return self.children.length;
    };
    //@function getChild(n) Returns the child node at index `n`.
    this.getChild = function(n) {
        return self.children[n];
    };
    
    return true;
};
Group.extend(AminoNode, {});





/* ============= Animation ================= */
/*
@class  PropAnim
Animates a single property on a node.  You must call the constructor
with the node, string name of the property, a start value, an end value
and a duration. Then you can further customize it with functions.

#category animation

Example: to create a property animation that make a rectangle's width go from
50 to 100 over half a second, and loop forever do the following:

    var anim = new PropAnim(rect,"w",50,100,0.5)
        .setLoopCount(-1)
        .start();
    engine.addAnim(anim);


@end
*/
function PropAnim(node,prop,startValue,end,duration) {
	this.isdom = false;
	if(node instanceof Element) {
		this.isdom = true;
	}
	this.node = node;
	this.prop = prop;
	this.startValue = startValue;
	this.end = end;
	this.duration = duration;
	this.value = -1;
	this.started = false;
	this.playing = false;
	this.loop = 0;
	this.beforeCallback = null;
	this.afterCallback = null;
	this.loopcount = 0;
	this.autoReverse = false;
	this.forward = true;
	return this;
}

PropAnim.prototype.update = function() {
	if(!this.playing) return;
	if(!this.started) {
		this.started = true;
		this.value = this.startValue;
		this.startTime = new Date().getTime();
		if(this.beforeCallback) {
		    this.beforeCallback();
		}
	}
	
	var currentTime = new Date().getTime();
	var dur = currentTime-this.startTime;
	if(dur > this.duration*1000) {
		this.started = false;
		if(this.afterCallback) {
		    this.afterCallback();
		}
		//don't loop
		if(this.loop == 0 || this.loopcount == 0) {
		    this.playing = false;
		}
		//loop forver
		if(this.loop == -1) {
		    //no nothing
		}
		//loop N times
		if(this.loop > 0) {
		    this.loopcount--;
		}
		if(this.autoReverse) {
		    this.forward = !this.forward;
		}
		return;
	}
	
	var t = (currentTime-this.startTime)/(this.duration*1000);
	if(!this.forward) t = 1-t;
	
	var val = this.startValue + t*(this.end-this.startValue);
	if(this.isdom) {
		this.node.style[this.prop] = (val+"px");
	} else {
	    var fun = "set"
	        +this.prop[0].toUpperCase()
	        +this.prop.slice(1);
		this.node[fun](val);
	}
}

//@function toggle()  Toggle the playing state. If the animation is playing it will stop it. If the animation is stopped it will start playing it.
PropAnim.prototype.toggle = function() {
	this.playing = !this.playing;
	this.engine.animationChanged();
}
//@function start() Start playing the animation.
PropAnim.prototype.start = function() {
	this.playing = true;
    if(this.engine) {
        this.engine.animationChanged();
    }
    return this;
}
//@function onBefore(callback) set a function to be called just before the animation starts
PropAnim.prototype.onBefore = function(beforeCallback) {
    this.beforeCallback = beforeCallback;
    return this;
}
//@function onAfter(callback) set a function to be called just after the animation starts
PropAnim.prototype.onAfter = function(afterCallback) {
    this.afterCallback = afterCallback;
    return this;
}
//@function setLoop(count) set how many times the animation should loop. The default is 0 (no looping). Set to -1 to loop forever
PropAnim.prototype.setLoop = function(loop) {
    this.loop = loop;
    this.loopcount = loop;
    return this;
}
//@function setAutoReverse(autoReverse) set if the animation should automatically reverse when it reaches the end. This only has an effect if the animation is looping.
PropAnim.prototype.setAutoReverse = function(autoReverse) {
    this.autoReverse = true;
    return this;
}

/*
@class SerialAnim
Performs several animations one after another.
#category animation
@end
*/
function SerialAnim() {
    this.anims = [];
    this.animIndex = -1;
}
//@function add(anim) add another animation
SerialAnim.prototype.add = function(anim) {
    this.anims.push(anim);
    return this;
}
//@function start() starts the animation
SerialAnim.prototype.start = function() {
	this.playing = true;
	this.animIndex = 0;
	this.anims[this.animIndex].start();
    if(this.engine) {
        this.engine.animationChanged();
    }
    return this;
}
SerialAnim.prototype.update = function() {
	if(!this.playing) return;
	if(!this.started) {
		this.started = true;
	}
	
	var anim = this.anims[this.animIndex];
	anim.update();
	if(!anim.playing) {
	    this.animIndex++;
	    if(this.animIndex >= this.anims.length) {
	        console.log('serial anim done');
	        this.playing = false;
	    } else {
	        this.anims[this.animIndex].start();
	    }
	}
}


/*
@class ParallelAnim
An animation which performs several other animations in Parallel
#category animation
@end
*/
function ParallelAnim() {
    this.anims = [];
}
//@function add(anim) add another animation
ParallelAnim.prototype.add = function(anim) {
    this.anims.push(anim);
    return this;
}
//@function start() starts the animation
ParallelAnim.prototype.start = function() {
	this.playing = true;
	for(var i=0; i<this.anims.length; i++) {
	    this.anims[i].start();
	}
    if(this.engine) {
        this.engine.animationChanged();
    }
    return this;
}
ParallelAnim.prototype.update = function() {
	if(!this.playing) return;
	if(!this.started) {
		this.started = true;
	}

	var stillPlaying = false;
	for(var i=0; i<this.anims.length; i++) {
	    this.anims[i].update();
	    if(this.anims[i].playing) {
	        stillPlaying = true;
	    }
	}
	
	if(!stillPlaying) {
        this.playing = false;
	}
}

/*
@class CallbackAnim
An animation which calls a function on every repaint. Mainly used
for proceeduration animation like particle simulators.
#category animation
@end
*/
function CallbackAnim() {
    this.started = false;
    this.playing = false;
    this.callback = null;
    this.engine = null;
    return this;
}
CallbackAnim.prototype.update = function() {
	if(!this.started) {
		this.started = true;
	}
	if(this.callback) {
	    this.callback();
	}
}
//@function start() start the animation
CallbackAnim.prototype.start = function() {
    this.playing = true;
    if(this.engine) {
        this.engine.animationChanged();
    }
}


function WorkTile(left,top,width,height, src, dst) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
    this.src = src;
    this.dst = dst;
    this.srcData = null;
    this.getData = function() {
        if(this.srcData == null) {
            this.srcData = this.src.getContext().getImageData(this.left,this.top,this.width,this.height);
        }
        return this.srcData;
    };
    this.getR = function(x,y) {
        var pi = x+y*this.width;
        return this.srcData.data[pi*4+0];
    };
    this.getG = function(x,y) {
        var pi = x+y*this.width;
        return this.srcData.data[pi*4+1];
    };
    this.getB = function(x,y) {
        var pi = x+y*this.width;
        return this.srcData.data[pi*4+2];
    };
    this.getA = function(x,y) {
        var pi = x+y*this.width;
        return this.srcData.data[pi*4+3];
    };
    this.saveData = function() {
        dst.getContext().putImageData(this.srcData,this.left,this.top);
    }        
    return true;
}


/*
@class SaturationNode A parent node which adjusts the saturation of its child. Uses a buffer internally.
#category effects
@end
*/
function SaturationNode(n) {
    Node.call(this);
	this.node = n;
    this.node.setParent(this);
    this.buf1 = null;
    this.buf2 = null;
    
    //@property saturation value between 0 and 1
    this.saturation = 0.5;
    this.setSaturation = function(s) {
        this.saturation = s;
        this.setDirty();
        return this;
    };
    this.getSaturation = function() {
        return this.saturation;
    };
    var self = this;
    this.draw = function(ctx) {
        var bounds = this.node.getVisualBounds();
        if(!this.buf1) {
            this.buf1 = new Buffer(
                bounds.getWidth()
                ,bounds.getHeight()
                );
            this.buf2 = new Buffer(
                bounds.getWidth()
                ,bounds.getHeight()
                );
        }
        
        //redraw the child only if it's dirty
        if(this.isDirty()) {
            //render child into first buffer
            this.buf1.clear();
            var ctx1 = this.buf1.getContext();
            ctx1.save();
            ctx1.translate(
                -bounds.getX()
                ,-bounds.getY());
            this.node.draw(ctx1);
            ctx1.restore();

            //apply affect from buf1 into buf2
            this.buf2.clear();
            this.applyEffect(this.buf1,this.buf2,5);
            //buf1->buf2
        }
        ctx.save();
        ctx.translate(bounds.getX(),bounds.getY());
        ctx.drawImage(this.buf2.buffer,0,0);
        ctx.restore();
        
        this.clearDirty();
    };
    this.applyEffect = function(buf, buf2, radius) {
        console.log("buf = " + buf + " "+ buf.getWidth());
        var data = buf.getData();
        var s = radius*2;
        var size = 0;
        var scale = 1-this.getSaturation();
        for(var x = 0+size; x<buf.getWidth()-size; x++) {
            for(var y=0+size; y<buf.getHeight()-size; y++) {
                var r = buf.getR(data,x,y);
                var g = buf.getG(data,x,y);
                var b = buf.getB(data,x,y);
                var a = buf.getA(data,x,y);
                //var avg = (r+g+b)/3;
                var v = r*0.21+g*0.71+b*0.07;
                r = r*(1-scale)+v*scale;
                g = g*(1-scale)+v*scale;
                b = b*(1-scale)+v*scale;
                buf2.setRGBA(data,x,y,r,g,b,a);
            }
        }
        /*
        for(var i = 0; i<buf2.getHeight(); i++) {
            buf2.setRGBA(data,0,i,0xFF,0xFF,0xFF,0xFF);
            buf2.setRGBA(data,buf2.getWidth()-1,i,0xFF,0xFF,0xFF,0xFF);
        }
        for(var i = 0; i<buf2.getWidth(); i++) {
            buf2.setRGBA(data,i,0,0xFF,0xFF,0xFF,0xFF);
            buf2.setRGBA(data,i,buf2.getHeight()-1,i,0xFF,0xFF,0xFF,0xFF);
        }
        */
        buf2.setData(data);        
    };
    return true;
}
SaturationNode.extend(AminoNode);



/*
@class BackgroundSaturationNode A parent node which adjusts the saturation of its child. Uses a buffer internally.
#category effects
@end
*/
function BackgroundSaturationNode(n) {
    AminoNode.call(this);
	this.node = n;
    this.node.setParent(this);
    this.buf1 = null;
    this.buf2 = null;
    
    //@property x left edge of the node
    this.x = 0;
    this.setX = function(x) {
        this.x = x;
        return this;
    };
    //@property y top edge of the node
    this.y = 0;
    this.setY = function(y) {
        this.y = y;
        return this;
    };
    
    //@property saturation value between 0 and 1
    this.saturation = 0.5;
    this.setSaturation = function(s) {
        this.saturation = s;
        if(this.saturation > 1.0) this.saturation = 1.0;
        if(this.saturation < 0.0) this.saturation = 0.0;
        this.setDirty();
        return this;
    };
    this.getSaturation = function() {
        return this.saturation;
    };
    
    //@property brightness value between -1 and 1
    this.brightness = 0;
    this.setBrightness = function(b) {
        this.brightness = b;
        if(this.brightness < -1.0) this.brightness = -1.0;
        if(this.brightness > 1.0) this.brightness = 1.0;
        this.setDirty();
        return this;
    };
    this.getBrightness = function() { return this.brightness; };

    //@property contrast value between 0 and 10. default is 1
    this.contrast = 0;
    this.setContrast = function(c) {
        this.contrast = c;
        if(this.contrast < 0.0) this.contrast = 0.0;
        if(this.contrast > 10.0) this.contrast = 10.0;
        this.setDirty();
        return this;
    };
    this.getContrast = function() { return this.contrast; }
        
    
    this.inProgress = false;
    this.workX = 0;
    this.workY = 0;
    this.startTime = 0;
    
    var self = this;
    this.draw = function(ctx) {
        var bounds = this.node.getVisualBounds();
        if(!this.buf1 || bounds.getWidth() != this.buf1.getWidth()) {
            this.buf1 = new Buffer(
                bounds.getWidth()
                ,bounds.getHeight()
                );
            this.buf2 = new Buffer(
                bounds.getWidth()
                ,bounds.getHeight()
                );
        }
        
        //redraw the child only if it's dirty
        if(this.isDirty()) {
            this.startTime = new Date().getTime();
            //render child into first buffer
            this.buf1.clear();
            var ctx1 = this.buf1.getContext();
            ctx1.save();
            ctx1.translate(
                -bounds.getX()
                ,-bounds.getY());
            this.node.draw(ctx1);
            ctx1.restore();

            //apply affect from buf1 into buf2
            //this.buf2.clear();
            //console.log("marking in progress again");
            this.workX = 0;
            this.workY = 0;
            this.inProgress = true;
        }
        
        if(this.inProgress) {
            var start = new Date().getTime();
            while(new Date().getTime()-start < 1000/40) {
                var workSize = 32;
                
                var workW = workSize;
                if(this.workX+workW > this.buf1.getWidth()) {
                    workW = this.buf1.getWidth()-this.workX;
                }
                var workH = workSize;
                if(this.workY+workH > this.buf1.getHeight()) {
                    workH = this.buf1.getHeight()-this.workY;
                }
                var tile = new WorkTile(this.workX,this.workY,workW,workH, this.buf1, this.buf2);
                this.applyEffect(tile);
                if(this.workX+workSize > this.buf1.getWidth()) {
                    this.workX = 0;
                    this.workY+=workSize;
                } else {
                    this.workX+=workSize;
                }
                if(this.workY > this.buf1.getHeight()) {
                    this.inProgress = false;
                    var endTime = new Date().getTime();
                    if(bounds.getWidth() > 100) {
                        //win.alert("done!: " + (endTime-this.startTime));
                    }
                    break;
                }
            }
        }
        ctx.save();
        ctx.translate(bounds.getX()+self.x,bounds.getY()+self.y);
        ctx.drawImage(this.buf2.buffer,0,0);
        ctx.restore();
        
        this.clearDirty();
    };
    
    this.applyEffect = function(tile) {
        var buf = tile.src;
        var buf2 = tile.dst;
        var workSize = tile.width;
        var data = tile.getData();
        var d = data.data;
        
        var tw = tile.width;
        var th = tile.height;
        
        var scale = 1-this.getSaturation();
        var bright = this.getBrightness()*256;
        var contrast = this.getContrast();
        var scale1 = 1-scale;
        var r = 0;
        var g = 0;
        var b = 0;
        var a = 0;
        for(var x=0; x<tw; x++) {
            for(var y=0; y<th; y++) {
                var pi = (x+y*tw)*4;
                r = d[pi+0];
                g = d[pi+1];
                b = d[pi+2];
                a = d[pi+3];
                var v = r*0.21+g*0.71+b*0.07;
                var vs = v*scale;
                r = r*scale1+vs;
                g = g*scale1+vs;
                b = b*scale1+vs;
                //brightness
                r += bright;
                g += bright;
                b += bright;
                //contrast
                r = (r-0x7F)*contrast+0x7F;
                g = (g-0x7F)*contrast+0x7F;
                b = (b-0x7F)*contrast+0x7F;
                //clamp
                if(r > 0xFF) r = 0xFF;
                if(g > 0xFF) g = 0xFF;
                if(b > 0xFF) b = 0xFF;
                if(r < 0x00) r = 0x00;
                if(g < 0x00) g = 0x00;
                if(b < 0x00) b = 0x00;
                
                a = 0xFF;
                d[pi+0] = r;
                d[pi+1] = g;
                d[pi+2] = b;
                d[pi+3] = a;
            }
        }
        tile.saveData();
    };
    return true;
}
BackgroundSaturationNode.extend(AminoNode);

/*
@class BlurNode A parent node which blurs its child.
#category effects
@end
*/
function BlurNode(n) {
	this.node = n;
	console.log("n = " + n);
    AminoNode.call(this);
    if(n) n.setParent(this);
    this.buf1 = null;
    this.buf2 = null;
    
    //@property blurRadius the radius of the blur
    this.blurRadius = 3;
    this.setBlurRadius = function(r) { this.blurRadius = r; return this; }
    
    var self = this;
    this.draw = function(ctx) {
        var bounds = this.node.getVisualBounds();
        if(!this.buf1) {
            this.buf1 = new Buffer(
                bounds.getWidth()+this.blurRadius*4
                ,bounds.getHeight()+this.blurRadius*4
                );
            this.buf2 = new Buffer(
                bounds.getWidth()+this.blurRadius*4
                ,bounds.getHeight()+this.blurRadius*4
                );
        }
        
        //redraw the child only if it's dirty
        if(this.isDirty()) {
            //render child into first buffer
            this.buf1.clear();
            var ctx1 = this.buf1.getContext();
            ctx1.save();
            ctx1.translate(
                -bounds.getX()+this.blurRadius*2
                ,-bounds.getY()+this.blurRadius*2);
            this.node.draw(ctx1);
            ctx1.restore();

            //apply affect from buf1 into buf2
            this.buf2.clear();
            this.applyEffect(this.buf1,this.buf2,this.blurRadius);
            //buf1->buf2
        }
        ctx.save();
        ctx.translate(bounds.getX(),bounds.getY());
        ctx.drawImage(this.buf2.buffer,0,0);
        ctx.restore();
        
        this.clearDirty();
    };
    this.applyEffect = function(buf, buf2, radius) {
        var data = buf.getData();
        var s = radius*2;
        var size = s/2;
        for(var x = 0+size; x<buf.getWidth()-size; x++) {
            for(var y = 0+size; y<buf.getHeight()-size; y++) {
                var r = 0;
                var g = 0;
                var b = 0;
                var a = 0;
                for(var ix=x-size; ix<=x+size; ix++) {
                    for(var iy=y-size;iy<=y+size;iy++) {
                        r += buf.getR(data,ix,iy);
                        g += buf.getG(data,ix,iy);
                        b += buf.getB(data,ix,iy);
                        a += buf.getA(data,ix,iy);
                    }
                }
                var divisor = s*s;
                r = r/divisor;
                g = g/divisor;
                b = b/divisor;
                a = a/divisor;
                //r = 0x00; g = 0x00; b = 0x00;
                a// = a*this.blurOpacity;
                buf2.setRGBA(data,x,y,r,g,b,a);                
            }
        }
        
        /*
        for(var x = 0+size; x<buf.getWidth()-size; x++) {
            for(var y=0+size; y<buf.getHeight()-size; y++) {
                var r = buf.getR(data,x,y);
                var g = buf.getG(data,x,y);
                var b = buf.getB(data,x,y);
                var a = buf.getA(data,x,y);
                buf2.setRGBA(data,x,y,r,g,b,a);
            }
        }
        */
        
        /*
        for(var i = 0; i<buf2.getHeight(); i++) {
            buf2.setRGBA(data,0,i,0xFF,0xFF,0xFF,0xFF);
            buf2.setRGBA(data,buf2.getWidth()-1,i,0xFF,0xFF,0xFF,0xFF);
        }
        for(var i = 0; i<buf2.getWidth(); i++) {
            buf2.setRGBA(data,i,0,0xFF,0xFF,0xFF,0xFF);
            buf2.setRGBA(data,i,buf2.getHeight()-1,i,0xFF,0xFF,0xFF,0xFF);
        }
        */
        
        buf2.setData(data);        
    };
    return true;
};
BlurNode.extend(AminoNode);

/*
@class ShadowNode A parent node which draws a shadow under its child. Uses a buffer internally.
#category effects
@end
*/
function ShadowNode(n) {
    console.log("initing shadow node");
	BlurNode.call(this,n);
	
	//@property offsetX The X offset of the shadow
    this.offsetX = 0;
    this.setOffsetX = function(x) { this.offsetX = x; return this; }
    
    //@property offsetY The Y offset of the shadow
    this.offsetY = 0;
    this.setOffsetY = function(y) { this.offsetY = y; return this; }
    
    //@property blurRadius The radius of the shadow area
    this.blurRadius = 3;
    this.setBlurRadius = function(r) { this.blurRadius = r; return this; }
    
    //@property blurOpacity The opacity of the shadow
    this.blurOpacity = 0.8;
    this.setBlurOpacity = function(r) { this.blurOpacity = r; return this; }
    
    var self = this;
    this.draw = function(ctx) {
        var bounds = this.node.getVisualBounds();
        if(!this.buf1) {
            this.buf1 = new Buffer(
                bounds.getWidth()+this.offsetX+this.blurRadius*4
                ,bounds.getHeight()+this.offsetY+this.blurRadius*4
                );
            this.buf2 = new Buffer(
                bounds.getWidth()+this.offsetX+this.blurRadius*4
                ,bounds.getHeight()+this.offsetY+this.blurRadius*4
                );
        }
        //redraw the child only if it's dirty
        if(this.isDirty()) {
            //render child into first buffer
            this.buf1.clear();
            var ctx1 = this.buf1.getContext();
            ctx1.save();
            ctx1.translate(
                -bounds.getX()+this.blurRadius*2
                ,-bounds.getY()+this.blurRadius*2);
            ctx1.translate(this.offsetX,this.offsetY);
            this.node.draw(ctx1);
            ctx1.restore();

            //apply affect from buf1 into buf2
            this.buf2.clear();
            //buf1->buf2
            this.applyEffect(this.buf1,this.buf2,this.blurRadius);
            
            
            //draw child over blur in buf2
            var ctx2 = this.buf2.getContext();
            ctx2.save();
            ctx2.translate(
                -bounds.getX()+this.blurRadius*2
                ,-bounds.getY()+this.blurRadius*2);
            this.node.draw(ctx2);
            ctx2.restore();
        }
        ctx.save();
        ctx.translate(bounds.getX(),bounds.getY());
        ctx.drawImage(this.buf2.buffer,0,0);
        ctx.restore();
        this.clearDirty();
    };
    
    this.applyEffect = function(buf, buf2, radius) {
        var data = buf.getData();
        var s = radius*2;
        var size = s/2;
        
        for(var x = 0+size; x<buf.getWidth()-size; x++) {
            for(var y = 0+size; y<buf.getHeight()-size; y++) {
                var r = 0;
                var g = 0;
                var b = 0;
                var a = 0;
                for(var ix=x-size; ix<=x+size; ix++) {
                    for(var iy=y-size;iy<=y+size;iy++) {
                        r += buf.getR(data,ix,iy);
                        g += buf.getG(data,ix,iy);
                        b += buf.getB(data,ix,iy);
                        a += buf.getA(data,ix,iy);
                    }
                }
                var divisor = s*s;
                r = r/divisor;
                g = g/divisor;
                b = b/divisor;
                a = a/divisor;
                r = 0x00; g = 0x00; b = 0x00;
                a = a*this.blurOpacity;
                buf2.setRGBA(data,x,y,r,g,b,a);                
            }
        }
        buf2.setData(data);        
    };
    return true;
};
ShadowNode.extend(BlurNode);




/*
@class Buffer An offscreen area that you can draw into. Used for special effects and caching.
#category effects
@end
*/
function Buffer(w,h) {
    var self = this;    
    //@property width  The width of the buffer, set at creation time.
    this.w = w;
    this.getWidth = function() { return this.w; }
    
    //@property height  The height of the buffer, set at creation time.
    this.h = h;
    this.getHeight = function() { return this.h; }
    
    this.buffer = document.createElement("canvas");
    this.buffer.width = this.w;
    this.buffer.height = this.h;
    
    //@doc get the Canvas 2D context of the buffer, so you can draw on it
    this.getContext = function() { return self.buffer.getContext('2d'); }
    
    //@doc Get an canvas ImageData structure.
    this.getData = function() {
        var c = this.getContext();
        var data = c.getImageData(0,0,this.getWidth(), this.getHeight());
        return data;
    };
    
    //@method Return the *red* component at the specified x and y.
    this.getR = function(data, x, y) {
        var pi = x+y*data.width;
        return data.data[pi*4+0];
    };
    
    //@method Return the *green* component at the specified x and y.
    this.getG = function(data, x, y) {
        var pi = x+y*data.width;
        return data.data[pi*4+1];
    };
    
    //@method Return the *blue* component at the specified x and y.
    this.getB = function(data, x, y) {
        var pi = x+y*data.width;
        return data.data[pi*4+2];
    };
    
    //@method Return the *alpha* component at the specified x and y.
    this.getA = function(data, x, y) {
        var pi = x+y*data.width;
        return data.data[pi*4+3];
    };
    
    //@method Set the red, green, blue, and alpha components at the specified x and y.
    this.setRGBA = function(data,x,y,r,g,b,a) {
        var pi = (x+y*this.getWidth())*4;
        //console.log("pi = " + pi);
        data.data[pi+0] = r; //alpha
        data.data[pi+1] = g; //red
        data.data[pi+2] = b; //green
        data.data[pi+3] = a; //blue
        return this;
    };
    //@method Set the data structure back into the canvas. This should be the same value you got from *getData()*.
    this.setData = function(data) {
        this.getContext().putImageData(data,0,0);
        return this;
    };
    //@method Clear the buffer with transparent black.
    this.clear = function() {
        var ctx = this.getContext();
        ctx.clearRect(0,0,this.getWidth(),this.getHeight());
        return this;
    };
    return true;
};

/* 
@class BufferNode A node which draws its child into a buffer. Use it to cache children which are expensive to draw.
#category effects
@end
*/
function BufferNode(n) {
	AminoNode.call(this);
	this.node = n;
    this.node.setParent(this);
    this.buf = null;
    var self = this;
    this.draw = function(ctx) {
        var bounds = this.node.getVisualBounds();
        if(!this.buf) {
            this.buf = new Buffer(bounds.getWidth(),bounds.getHeight());
        }
        //redraw the child only if it's dirty
        if(this.isDirty()) {
            var ctx2 = this.buf.getContext();
            ctx2.save();
            ctx2.translate(-bounds.getX(),-bounds.getY());
            this.node.draw(ctx2);
            ctx2.restore();
        }
        ctx.save();
        ctx.translate(bounds.getX(),bounds.getY());
        ctx.drawImage(this.buf.buffer,0,0);
        ctx.restore();
        this.clearDirty();
    };
    return true;
};
BufferNode.extend(AminoNode);






function BitmapText(src) {
	this.src = src;
	this.x = 0;
	this.y = 0;
	this.text = "random text";
	return this;
}

BitmapText.prototype.setMetrics = function(metrics) {
	this.metrics = metrics;
	return this;
}
BitmapText.prototype.setLineHeight = function(lineHeight) {
	this.lineHeight = lineHeight;
	return this;
}
BitmapText.prototype.setX = function(x) {
	this.x = x;
	return this;
}
BitmapText.prototype.setY = function(y) {
	this.y = y;
	return this;
}
BitmapText.prototype.paint = function(g) {
	g.fillStyle = "black";
	g.font = "12pt sans-serif";
	g.fillText(this.text,this.x,this.y);
}




/*
@class Rect

A rectangle shape.
#category shapes

Example: create a red rectangle with a 5px black border and 20px rounded corners:

    var rect = new Rect()
        .set(0,0,100,30)
        .setFill("red")
        .setStroke("black")
        .setStrokeWidth(5)
        .setCorner(20);

@end
*/

function Rect() {
    AminoShape.call(this);
	this.typename = "Rect";
    var self = this;
    //@property x  the x
	this.x = 0;
	//@property y the y
	this.y = 0;
	//@property w the width
	this.w = 10;
	//@property h the height
	this.h = 10;
	
	this.setX = function(x) {
	    this.x = x;
	    this.setDirty();
	    return this;
	};
	this.getX = function() {
	    return this.x;
	}
	this.setY = function(y) {
	    this.y = y;
	    this.setDirty();
	    return this;
	};
	this.getY = function() {
	    return this.y;
	}
	
	
	//@function set(x,y,w,h)  set the x, y, width, and height all at the same time
	this.set = function(x,y,w,h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.setDirty();
        return this;
    }
    
    this.contains = function(pt) {
        if(pt.x >= this.x && pt.x <= this.x + this.w) {
            if(pt.y >= this.y && pt.y<=this.y + this.h) {
                return true;
            }
        }
        return false;
    }
	return this;
}
Rect.extend(AminoShape);
Rect.prototype.fillShape = function(ctx) {
    if(this.corner > 0) {
        var x = this.x;
        var y = this.y;
        var w = this.w;
        var h = this.h;
        var r = this.corner;
        ctx.beginPath();
        ctx.moveTo(x+r,y);
        ctx.lineTo(x+w-r, y);
        ctx.bezierCurveTo(x+w-r/2,y,   x+w,y+r/2,   x+w,y+r);
        ctx.lineTo(x+w,y+h-r);
        ctx.bezierCurveTo(x+w,y+h-r/2, x+w-r/2,y+h, x+w-r, y+h);
        ctx.lineTo(x+r,y+h);
        ctx.bezierCurveTo(x+r/2,y+h,   x,y+h-r/2,   x,y+h-r);
        ctx.lineTo(x,y+r);
        ctx.bezierCurveTo(x,y+r/2,     x+r/2,y,     x+r,y);
        ctx.closePath();
        ctx.fill();
    } else {
        ctx.fillRect(this.x,this.y,this.w,this.h);
    }
}
Rect.prototype.strokeShape = function(ctx) {
    if(this.corner > 0) {
        var x = this.x;
        var y = this.y;
        var w = this.w;
        var h = this.h;
        var r = this.corner;
        ctx.beginPath();
        ctx.moveTo(x+r,y);
        ctx.lineTo(x+w-r, y);
        ctx.bezierCurveTo(x+w-r/2,y,   x+w,y+r/2,   x+w,y+r);
        ctx.lineTo(x+w,y+h-r);
        ctx.bezierCurveTo(x+w,y+h-r/2, x+w-r/2,y+h, x+w-r, y+h);
        ctx.lineTo(x+r,y+h);
        ctx.bezierCurveTo(x+r/2,y+h,   x,y+h-r/2,   x,y+h-r);
        ctx.lineTo(x,y+r);
        ctx.bezierCurveTo(x,y+r/2,     x+r/2,y,     x+r,y);
        ctx.closePath();
        ctx.strokeStyle = this.getStroke();
        ctx.lineWidth = this.strokeWidth;
        ctx.stroke();
    } else {
        ctx.strokeRect(this.x,this.y,this.w,this.h);
    }
}
Rect.prototype.setCorner = function(corner) {
    this.corner = corner;
	this.setDirty();
    return this;
}
Rect.prototype.getCorner = function(corner) {
    return this.corner;
}



/*
@class Text
A node which draws text with a single style. The text can have any
CSS font setting and be positioned anywhere.
#category shapes
@end
*/

function Text() {
    AminoShape.call(this);
	this.font = "12pt sans-serif";
	
	//@property x the x
	this.x = 0;
	this.setX = function(x) {
	    this.x = x;
	    this.setDirty();
	    return this;
	};
	this.getX = function() {
	    return this.x;
	}
	
	//@property y the y
	this.y = 0;
	this.setY = function(y) {
	    this.y = y;
	    this.setDirty();
	    return this;
	};
	this.getY = function() {
	    return this.y;
	}
	
	//@property text the actual string of text to be draw
	this.text = "random text";
	
    //@property autoSize  should the bounds of the text be calculated from the text, or explicit
    this.autoSize = true;
    this.setAutoSize = function(autoSize) {
        this.autoSize = autoSize; 
        this.setDirty(); 
        return this; 
    };
    
    //@property width width of text box
    this.width = 100;
    this.setWidth = function(width) { 
        this.width = width; 
        this.setDirty(); 
        return this; 
    };
    
    //@property height height of text box
    this.height = 100;
    this.setHeight = function(height) { 
        this.height = height; 
        this.setDirty(); 
        return this; 
    };

    //@property halign
    this.halign = 'left';
    this.setHAlign = function(halign) { 
        this.halign = halign; 
        this.setDirty(); 
        return this; 
    };    
	
	return this;
}
Text.extend(AminoShape);
//@function set(text,x,y) shortcut to set the text, x and y of the text
Text.prototype.set = function(text,x,y) {
	this.x = x;
	this.y = y;
	this.text = text;
	this.setDirty();
	return this;
}
Text.prototype.setText = function(text) {
    this.text = text;
    this.setDirty();
    return this;
}


//@property font(fontstring) the font to render the text with. Uses the CSS font shortcut, such as '12pt bold Arial'
Text.prototype.setFont = function(font) {
    this.font = font;
    return this;
}


Text.prototype.fillShape = function(ctx) {
	ctx.font = this.font;
    var strs = this.text.split('\n');
    var h = ctx.measureText('m').width;
    var mw = 0;
    var y = this.y;
    if(this.autoSize) {
        for(var i=0; i<strs.length; i++) {
            ctx.fillText(strs[i], this.x, y);
            mw = Math.max(mw,ctx.measureText(strs[i]));
            y+= h;
        }
    } else {
        mw = this.width;
        var align = ctx.textAlign;
        if(this.halign == 'left') {
            ctx.textAlign = 'left';
            for(var i=0; i<strs.length; i++) {
                ctx.fillText(strs[i], this.x, y);
                y+= h;
            }
        }
        if(this.halign == 'right') {
            ctx.textAlign = 'right';
            for(var i=0; i<strs.length; i++) {
                ctx.fillText(strs[i], this.x + this.width, y);
                y+= h;
            }
        }
        if(this.halign == 'center') {
            ctx.textAlign = 'center';
            for(var i=0; i<strs.length; i++) {
                ctx.fillText(strs[i], this.x + this.width/2, y);
                y+= h;
            }
        }
        ctx.textAlign = align;
    }
}
Text.prototype.strokeShape = function(g) {
	//g.font = this.font;
	//g.strokeText(this.text,this.x,this.y);
}
Text.prototype.contains = function(pt) {
	return false;
}


/*
@class Circle
A circle shape. The x and y are the *center* of the circle.
#category shapes
@end
*/
function Circle() {
    AminoShape.call(this);
	this.x = 0;
	this.y = 0;
	this.radius = 10;
	//@property x the center x of the circle
	this.getX = function() {
	    return this.x;
	}
	//@property y the center y of the circle
	this.getY = function() {
	    return this.y;
	}
	this.setX = function(x) {
	    this.x = x;
	    return this;
	}
	this.setY = function(y) {
	    this.y = y;
	    return this;
	}
	return this;
}
Circle.extend(AminoShape);
//@function set(x,y,radius)  a shortcut function to set the center x, center y, and radius of the circle
Circle.prototype.set = function(x,y,radius) {
	this.x = x;
	this.y = y;
	this.radius = radius;
	return this;
}
Circle.prototype.fillShape = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, true); 
    ctx.closePath();
    ctx.fill();
}
Circle.prototype.strokeShape = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, true); 
    ctx.closePath();
    ctx.stroke();
}
Circle.prototype.contains = function(pt) {
    if(pt.x >= this.x-this.radius && pt.x <= this.x + this.radius) {
        if(pt.y >= this.y-this.radius && pt.y<=this.y + this.radius) {
            return true;
        }
    }
    return false;
}



// ===================== Path and PathNode

var SEGMENT_MOVETO = 1;
var SEGMENT_LINETO = 2;
var SEGMENT_CLOSETO = 3;
var SEGMENT_CURVETO = 4;
function Segment(kind,x,y,a,b,c,d) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    if(kind == SEGMENT_CURVETO) {
        this.cx1 = x;
        this.cy1 = y;
        this.cx2 = a;
        this.cy2 = b;
        this.x = c;
        this.y = d;
    }
};

/*
@class Path A Path is a sequence of line and curve segments. It is used for drawing arbitrary shapes and animating.  Path objects are immutable. You should create them and then reuse them.
#category shapes
@end
*/
function Path() {
    this.segments = [];
    this.closed = false;
    
    //@function moveTo(x,y) jump directly to the x and y. This is usually the first thing in your path.
    this.moveTo = function(x,y) { 
        this.segments.push(new Segment(SEGMENT_MOVETO,x,y)); 
        return this; 
    };
    
    //@function lineTo(x,y) draw a line from the previous x and y to the new x and y.
    this.lineTo = function(x,y) { 
        this.segments.push(new Segment(SEGMENT_LINETO,x,y)); 
        return this; 
    };
    
    //@function closeTo(x,y) close the path. It will draw a line from the last x,y to the first x,y if needed.
    this.closeTo = function(x,y) {
        this.segments.push(new Segment(SEGMENT_CLOSETO,x,y)); 
        this.closed = true;
        return this;
    };
    
    //@function curveTo(cx1,cy1,cx2,cy2,x2,y2) draw a beizer curve from the previous x,y to a new point (x2,y2) using the four control points (cx1,cy1,cx2,cy2).
    this.curveTo = function(cx1,cy1,cx2,cy2,x2,y2) {
        this.segments.push(new Segment(SEGMENT_CURVETO,cx1,cy1,cx2,cy2,x2,y2));
        return this;
    };
    
    //@function build() build the final path object.
    this.build = function() {
        return this;
    };
    
    this.pointAtT = function(fract) {
        if(fract >= 1.0 || fract < 0) return [0,0];

        var segIndex = 0;
        segIndex = Math.floor(fract*(this.segments.length-1));
        var segFract = (fract*(this.segments.length-1))-segIndex;
        //console.log("seg index = " + (segIndex+1) + " f=" + fract + " sgf=" + segFract);// + " type=" + this.segments[segIndex+1].kind);
        var seg = this.segments[segIndex+1];
        var prev;
        var cur;
        switch (seg.kind) {
            case SEGMENT_MOVETO: return [0,0];
            case SEGMENT_LINETO:
                prev = this.segments[segIndex];
                cur = seg;
                return this.interpLinear(prev.x,prev.y,cur.x,cur.y,segFract);
            case SEGMENT_CURVETO:
                prev = this.segments[segIndex];
                cur = seg;
                return this.interpCurve(prev.x,prev.y,cur.cx1,cur.cy1,cur.cx2,cur.cy2, cur.x, cur.y,segFract);
            case SEGMENT_CLOSETO:
                prev = this.segments[segIndex];
                cur = this.segments[0];
                return this.interpLinear(prev.x,prev.y,cur.x,cur.y,segFract);
        }
        return [10,10];
    };

    this.interpLinear = function(x1, y1, x2, y2, fract) {
        return [ (x2-x1)*fract + x1, (y2-y1)*fract + y1 ];
    }
    
    this.interpCurve = function( x1, y1, cx1, cy1, cx2, cy2, x2, y2, fract) {
        return getBezier(fract, [x2,y2], [cx2,cy2], [cx1,cy1], [x1,y1] );
    }
    
    return true;
};

function B1(t) { return t*t*t; }
function B2(t) { return 3*t*t*(1-t); }
function B3(t) { return 3*t*(1-t)*(1-t); }
function B4(t) { return (1-t)*(1-t)*(1-t); }
function getBezier(percent, C1, C2, C3, C4) {
    var pos = [];
    pos[0] = C1[0]*B1(percent) + C2[0]*B2(percent) + C3[0]*B3(percent) + C4[0]*B4(percent);
    pos[1] = C1[1]*B1(percent) + C2[1]*B2(percent) + C3[1]*B3(percent) + C4[1]*B4(percent);
    return pos;
}


/*
@class PathNode Draws a path.
#category shapes
@end
*/
function PathNode() {
    AminoShape.call(this);
    //@property path the Path to draw
    this.path = null;
    this._bounds = null;
    
    this.setPath = function(path) {
        this.path = path;
        this._bounds = null;
        this.setDirty();
        return this;
    };
    this.getPath = function() {
        return this.path;
    };
    /*
    this.getVisualBounds = function() {
        if(this._bounds == null) {
            var l = 10000;
            var r = -10000;
            var t = 10000;
            var b = -10000;
            for(var i=0; i<this.path.segments.length; i++) {
                var s = this.path.segments[i];
                if(s.kind == SEGMENT_MOVETO) {
                    l = Math.min(l,s.x);
                    t = Math.min(t,s.y);
                    r = Math.max(r,s.x);
                    b = Math.max(b,s.y);
                }
                    
                //ctx.moveTo(s.x,s.y);
                if(s.kind == SEGMENT_LINETO) {
                    //ctx.lineTo(s.x,s.y);
                    l = Math.min(l,s.x);
                    t = Math.min(t,s.y);
                    r = Math.max(r,s.x);
                    b = Math.max(b,s.y);                    
                }
                //                if(s.kind == SEGMENT_CURVETO)
                //                    ctx.bezierCurveTo(s.cx1,s.cy1,s.cx2,s.cy2,s.x,s.y);
                //                if(s.kind == SEGMENT_CLOSETO)
                //                    ctx.closePath();
            }
            this._bounds = new Bounds(l,t,r-l,b-t);
            //console.log("calced path bounds = " + this._bounds);
        }
        return this._bounds;
    }
    */
    return true;
}
PathNode.extend(AminoShape);

PathNode.prototype.fillShape = function(ctx) {
    ctx.beginPath();
    for(var i=0; i<this.path.segments.length; i++) {
        var s = this.path.segments[i];
        if(s.kind == SEGMENT_MOVETO) 
            ctx.moveTo(s.x,s.y);
        if(s.kind == SEGMENT_LINETO) 
            ctx.lineTo(s.x,s.y);
        if(s.kind == SEGMENT_CURVETO)
            ctx.bezierCurveTo(s.cx1,s.cy1,s.cx2,s.cy2,s.x,s.y);
        if(s.kind == SEGMENT_CLOSETO)
            ctx.closePath();
    }
    if(this.path.closed) {
        ctx.fill();
    }
}
PathNode.prototype.strokeShape = function (ctx) {
    ctx.beginPath();
    for(var i=0; i<this.path.segments.length; i++) {
        var s = this.path.segments[i];
        if(s.kind == SEGMENT_MOVETO) 
            ctx.moveTo(s.x,s.y);
        if(s.kind == SEGMENT_LINETO) 
            ctx.lineTo(s.x,s.y);
        if(s.kind == SEGMENT_CURVETO)
            ctx.bezierCurveTo(s.cx1,s.cy1,s.cx2,s.cy2,s.x,s.y);
        if(s.kind == SEGMENT_CLOSETO)
            ctx.closePath();
    }
    if(this.path.closed) {
        ctx.stroke();
    }
}

/*
@class Ellipse
An ellipse / oval shape. X and Y and width and height represent 
the rectangular bounds of the ellipse.
#category shapes
@end
*/
function Ellipse() {
    AminoShape.call(this);
    var self = this;
    
    //@property x  The X coordinate of the *center* of the ellipse (not it's left edge)
    this.x = 0.0;
    this.getX = function() { return this.x; };
    this.setX = function(x) { this.x = x; this.setDirty(); return this; };

    //@property y  The Y coordinate of the *center* of the ellipse (not it's top edge)
    this.y = 0.0;
    this.getY = function() { return this.y; };
    this.setY = function(y) { this.y = y; this.setDirty(); return this; };

    //@property width The width of the ellipse.
    this.width = 20;
    this.getWidth = function() { return this.width; };
    this.setWidth = function(width) { this.width = width; this.setDirty(); return this; };

    //@property height The height of the ellipse.
    this.height = 10;
    this.getHeight = function() { return this.height; };
    this.setHeight = function(height) { this.height = height; this.setDirty(); return this; };


    //@function set(x,y,w,h) Set the x, y, w, h at the same time.
    this.set = function(x,y,w,h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.setDirty();
        return this;
    };
    
    this.fillShape = function(ctx) {
        var hB = (self.width / 2) * .5522848
        var vB = (self.height / 2) * .5522848
        var aX = self.x;
        var aY = self.y;
        var eX = self.x + self.width;
        var eY = self.y + self.height;
        var mX = self.x + self.width / 2;
        var mY = self.y + self.height / 2;
        ctx.beginPath();
        ctx.moveTo(aX, mY);
        ctx.bezierCurveTo(aX, mY - vB, mX - hB, aY, mX, aY);
        ctx.bezierCurveTo(mX + hB, aY, eX, mY - vB, eX, mY);
        ctx.bezierCurveTo(eX, mY + vB, mX + hB, eY, mX, eY);
        ctx.bezierCurveTo(mX - hB, eY, aX, mY + vB, aX, mY);
        ctx.closePath();
        ctx.fill();
    };
    return true;
};
Ellipse.extend(AminoShape);
Ellipse.prototype.strokeShape = function (ctx) {
    ctx.stroke();
}


/*
@class ImageView
A node which draws an image. You must create it using the constructor with a string URL. Ex:  var img = new ImageView("foo.png");
#category shapes
@end
*/
function ImageView(url) {
    AminoNode.call(this);
    var self = this;
    this.typename = "ImageView";
    if(url instanceof Image) {
        this.img = url;
        this.loaded = true;
        this.width = url.width;
        this.height = url.height;
    } else {
        this.src = url;
        this.img = new Image();
        this.loaded = false;
        this.width = 10;
        this.height = 10;
        this.img.onload = function() {
            self.loaded = true;
            self.setDirty();
            self.width = self.img.width;
            self.height = self.img.height;
        }
        this.img.src = url;
    }
    
    //@property x  The Y coordinate of the upper left corner of the image.
    this.x = 0.0;
    this.setX = function(x) { this.x = x;   this.setDirty();  return this;  };
    this.getX = function() { return this.x; };
    
    //@property y  The Y coordinate of the upper left corner of the image.
    this.y = 0.0;
    this.setY = function(y) {  this.y = y;  this.setDirty();  return this;  };
    this.getY = function() { return this.y; };
    
    this.paint = function(ctx) {
        //self.loaded = false;
        if(self.loaded) {
            ctx.drawImage(self.img,self.x,self.y);
        } else {
            ctx.fillStyle = "red";
            ctx.fillRect(self.x,self.y,100,100);
        }
    };
    
    this.contains = function(pt) {
 //       console.log("image checking contains " + JSON.stringify(pt));
//        console.log("x = " + self.x + " " + self.y + " " + self.w + " " + self.h);
        if(pt.x >= self.x && pt.x <= self.x + self.width) {
            if(pt.y >= self.y && pt.y<=self.y + self.height) {
                return true;
            }
        }
        return false;
    }
    return true;
};
ImageView.extend(AminoNode);






// =========== Paints ===========
/*
@class LinearGradientFill
A *fill* that can be used to fill shapes with a linear gradient. First
create the gradient at an x,y,w,h using the constructor, then add
colors using the *addStop* function.  The LinearGradientFill can be
used with the *fill* property of any shape.
#category shapes
@end
*/
function LinearGradientFill(x,y,width,height) {
    var self = this;
    self.x = x;
    self.y = y;
    self.width = width;
    self.height = height;
    self.offsets = [];
    self.colors = [];
    //@function addStop(offset,color) add a new color stop to the gradient. Offset should be between 0 and 1. Color should be a string color like "#00ff00" or "green".
    self.addStop = function(offset, color) {
        self.offsets.push(offset);
        self.colors.push(color);
        return self;
    };
    self.generate = function(ctx) {
        var grad = ctx.createLinearGradient(
                self.x,self.y,
                self.width,self.height);
        for(var i in self.offsets) {
            grad.addColorStop(self.offsets[i],self.colors[i]);
        }
        return grad;
    }
};



/*
@class RadialGradientFill
A *fill* that can be used to fill shapes with a radial gradient. First
create the gradient at an x,y, and radius using the constructor, then add
colors using the *addStop* function.  The RadialGradientFill can be
used with the *fill* property of any shape.
#category shapes
@end
*/
function RadialGradientFill(x,y,radius) {
    var self = this;
    self.x = x;
    self.y = y;
    self.radius = radius;
    self.offsets = [];
    self.colors = [];
    //@function addStop(offset,color) add a new color stop to the gradient. Offset should be between 0 and 1. Color should be a string color like "#00ff00" or "green".
    self.addStop = function(offset, color) {
        self.offsets.push(offset);
        self.colors.push(color);
        return self;
    };
    self.generate = function(ctx) {
        var grad = ctx.createRadialGradient(self.x,self.y, 0, self.x, self.y, self.radius);
        for(var i in self.offsets) {
            grad.addColorStop(self.offsets[i],self.colors[i]);
        }
        return grad;
    }
};

/*
@class PatternFill
A PatternFill fills a shape with an image, optionally repeated.
#category shapes
@end
*/
function PatternFill(url, repeat) {
    var self = this;
    
    this.src = url;
    this.img = new Image();
    this.loaded = false;
    this.repeat = repeat;
    this.img.onload = function() {
        self.loaded = true;
        if(self.can != null) {
            self.can.setDirty();
        }
    };
    this.can = null;
    this.img.src = self.src;
    this.generate = function(ctx) {
        self.can = ctx.can;
        if(!self.loaded) {
            return "red";
        }
        return ctx.createPattern(self.img, self.repeat);
    };
    return true;
}


function ThreeScene() {
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.engine = null;
    this.repaint = function() {
        this.dirty = false;
        this.renderer.render( this.scene, this.camera );
    };
    this.add = function(o) {
        if(o instanceof THREE.DirectionalLight) {
            this.scene.add(o);
            return;
        }
        this.scene.add(o.obj);
        o.parent = this;
    };
    
    this.setDirty = function() {
        if(!this.dirty) {
            this.dirty = true;
            if(!this.engine.autoPaint) {
                this.repaint();
            }
        }
    };
}


Amino.prototype.add3DCanvas = function(id) {
    
	var canvasElement = document.getElementById(id);
	var width = canvasElement.clientWidth;
	var height = canvasElement.clientHeight;
	
	sc = new ThreeScene();
	sc.engine = this;
    sc.scene.domWidth = width;
    sc.scene.domHeight = height;
    sc.camera = new THREE.PerspectiveCamera( 70, width/height, 1, 1000 );
    sc.camera.position.y = 150;
    sc.camera.position.z = 500;
    sc.scene.add( sc.camera );
	
    sc.domElement = canvasElement;
    sc.renderer = new THREE.CanvasRenderer();
    sc.renderer.setSize( width, height);
    sc.domElement.appendChild( sc.renderer.domElement );
	this.canvases.push(sc);    
	return sc;
};




function BaseNodeThree() {
    this.parent = null;

    this.setFill = function(color) {
        if(color[0] == '#') {
            color = color.substr(1);
        }
        this.fill = parseInt(color,16);
        return this;
    };
    this.setDirty = function() {
        if(this.parent != null) {
            this.parent.setDirty();
        }
    };
};




function Block() {
    this.geometry = new THREE.CubeGeometry( 200, 200, 200 );
    this.fill = 0xff0000;
    this.obj = null;
    
    this.set = function(w,h,d) {
        this.geometry = new THREE.CubeGeometry( w, h, d);
        return this;
    };
    this.getThreeObj = function() {
        if(this.obj == null) {
            this.material = new THREE.MeshLambertMaterial( { 
                color: this.fill, 
                shading: THREE.FlatShading, 
                overdraw: true });
            this.obj = new THREE.Mesh(this.geometry, this.material);
        }
        return this.obj;
    };
    
}
Block.extend(BaseNodeThree);




function Sphere() {
    this.geometry = new THREE.SphereGeometry(200, 50, 50)    
    this.fill = 0xff0000;
    this.obj = null;
    
    this.set = function(radius, detail) {
        this.geometry = new THREE.SphereGeometry(radius, detail, detail)    
        return this;
    };
    
    this.getThreeObj = function() {
        if(this.obj == null) {
            this.material = new THREE.MeshLambertMaterial( { 
                color: this.fill, 
                //shading: THREE.SmoothShading, 
                shading: THREE.FlatShading, 
                overdraw: true, 
            });
            this.obj = new THREE.Mesh(this.geometry, this.material);
        }
        return this.obj;
    };
    
}
Sphere.extend(BaseNodeThree);




function BeveledPath() {
    var extrudeSettings = {	
        amount: 20,  
        bevelEnabled: true, 
        bevelSegments: 2, 
        steps: 2 };
        
    var sqLength = 200;
    this.squareShape = new THREE.Shape();
    this.squareShape.moveTo( -sqLength,-sqLength );
    this.squareShape.lineTo( -sqLength, sqLength );
    this.squareShape.lineTo( sqLength, sqLength );
    this.squareShape.lineTo( sqLength, -sqLength );
    this.squareShape.lineTo( -sqLength, -sqLength );
    
    this.geometry = this.squareShape.extrude( extrudeSettings );
    this.fill = 0xff0000;
    
    this.obj = null;
    this.getThreeObj = function() {
        if(this.obj == null) {
            this.material = new THREE.MeshLambertMaterial( { 
                color: this.fill, 
                shading: THREE.FlatShading, 
                overdraw: true });
            this.obj = new THREE.Mesh(this.geometry, this.material);
        }            
        return this.obj;
    };
}
BeveledPath.extend(BaseNodeThree);



function Group3() {
    this.obj = new THREE.Object3D();
    this.setPositionY = function(y) {
        this.obj.position.y = y;
        return this;
    };
    this.add = function(o) {
        this.obj.add(o.getThreeObj());
        o.parent = this;
        return this;
    };
    this.setRotateY = function(y) {
        this.obj.rotation.y = y;
        this.setDirty();
        return this;
    };
}
Group3.extend(BaseNodeThree);





function Light3() {
    this.obj = new THREE.DirectionalLight( 0xffffff );
    //directly front light
    this.obj.position.set(1,0.2,0.5);
}

