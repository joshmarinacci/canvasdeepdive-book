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
    		
    		if(node.isVisible() && node.hasChildren && node.hasChildren()) {
    		    var r = this.searchGroup(node,point);
    		    if(r) {
    		        return r;
    		    }
    		}
    	}
    	return this;
    }
    
    this.searchGroup = function(group,point) {
        point = group.convertToChildCoords(point);
        for(var j=group.childCount()-1; j>=0; j--) {
            var node = group.getChild(j);
            if(node && node.isVisible() && node.contains(point)) {
                return node;
            }
    		if(node.isVisible() && node.hasChildren && node.hasChildren()) {
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
	
	var w = this.domCanvas.clientWidth;
	if(window.devicePixelRatio == 2) {
	    w = w*2;
	}
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
	if(this.autoScale) {
	    var scale =  w/this.originalWidth;
	    ctx.scale(scale,scale);
	}
	
	
	for(var i=0; i<this.nodes.length; i++) {
		var node = this.nodes[i];
		if(node && node.isVisible())
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
	node.setParent(this);
	return this;
}

//@function remove(node) Remove the child `n` from this group.
Canvas.prototype.remove = function(n) {
    var i = this.nodes.indexOf(n);
    if(i >= 0) {
        this.nodes.splice(i,1);
        n.setParent(null);
    }
    this.setDirty();
    return this;
};

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

//@function findById(str) Finds a node who's ID matches the string str. Returns null if no node is found.
Canvas.prototype.findById = function(str) {
    function findIt(r,s) {
        if(r.getId) {
            if(r.getId() == s) return r;
        }
        if(r.nodes) {
            for(var i=0; i<r.nodes.length; i++) {
                var n = findIt(r.nodes[i],s);
                if(n != null) return n;
            }
        }
        if(r.children) {
            for(var i=0; i<r.children.length; i++) {
                var n = findIt(r.children[i],s);
                if(n != null) return n;
            }
        }
    }
    return findIt(this,str);
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
	
	//@property id An ID for the node. If you set this, try to make it unique to the tree.
	this.id = "";
	this.setId = function(id) {
	    this.id = id;
	    return this;
	}
	this.getId = function() {
	    return this.id;
	}

	//@function setDirty() marks this node as being dirty
	this.setDirty = function() {
        if(self.parent != null) {
            self.parent.setDirty();
        }
    }
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
        if(!self.isVisible()) return;
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
    this.contains = function(pt) {
        return false;
        //return this.node.contains(this.convertToChildCoords(pt));
        /*
            {
                x:pt.x-self.translateX,
                y:pt.y-self.translateY
            });*/
    };
    
    this.convertToChildCoords = function(pt) {
        return {
            x:pt.x-this.getTranslateX(),
            y:pt.y-this.getTranslateY()
        };
    }
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
    //@function childCount() Returns the number of child nodes in this group.
    this.childCount = function() {
        return self.children.length;
    };
    //@function getChild(n) Returns the child node at index `n`.
    this.getChild = function(n) {
        return self.children[n];
    };
    
    
    this.convertToChildCoords = function(pt) {
        return {
            x:pt.x-self.x,
            y:pt.y-self.y
        };
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
//@function onAfter(callback)  sets a function to be called when the animation finishes
SerialAnim.prototype.onAfter = function(afterCallback) {
    this.afterCallback = afterCallback;
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
	        this.playing = false;
            if(this.afterCallback) {
                this.afterCallback();
            }
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


