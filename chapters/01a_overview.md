### Basic Drawing

## Overview

Canvas is a 2D drawing API recently added to HTML  and supported by most
browsers (Internet Explorer since version 9). Canvas allows you to draw anything
you want  directly in the web browser without the use of plugins  like Flash or
Java. With its deceptively simple API, Canvas  can revolutionize how we build
web applications  for all devices, not just desktops.


These screenshots give you just a taste of what is possible with Canvas.


{{
    type: "gallery",
    title: "Apps made with HTML Canvas",
    images: [
        "images/screenshot1.png",
        "images/screenshot2.png",
        "images/screenshot3.png",
        "images/screenshot4.png",
        "images/screenshot5.png",
        "images/screenshot6.png",
    ]
}}


## What is Canvas?

Canvas is a 2D drawing API.  Essentially the browser gives you a rectanglar area
on the screen that you can draw into. You can draw lines, shapes, images, text;
pretty much anything you want.   Canvas was originally created by Apple for
its *Dashboard* widgets, but it has since been adopted by every major browser vendor
and is now part of the HTML 5 spec. Here's a quick example of what some Canvas
code looks like:

```
<html>
<body>
  <canvas width="800" height="600" id="canvas"></canvas>
  <script>
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "red";
    ctx.fillRect(100,100,400,300);
  </script>
</body>
</html>
```

![This rectangle is drawn with the context.fillRect() function](images/redrect.png).screenshot


It's important to understand that Canvas is for _drawing pixels_. It doesn't have
shapes or vectors. There are no objects to attach event handlers to. It just
draws pixels to the screen.  As we shall see this is both a strength and a
weakness.

## So where does it fit in with the rest of the web?

There are four ways to draw things on the web: Canvas, SVG, CSS, and direct DOM
manipulation. Canvas differ from the other three:

* SVG: A vector API that draws shapes. Each shape has an object that you can  attach event handlers to. If you zoom in the shape stays smooth, whereas Canvas would become pixelated.
* CSS: For styling DOM elements. Since there are no DOM objects for things you draw in Canvas you can't use CSS to style it. CSS will only affect the rectanglar area of the Canvas itself, so you can set a border and background color, but that's it.
* DOM manipulation: The DOM, or Document Object Model, defines an object for everything on the screen. DOM animation, either by using CSS or JavaScript to move objects around, can be smoother in some cases than doing it with Canvas, but it depends on your browser implementation.


## Which? What? When?

So when should you use Canvas over SVG, CSS or DOM elements?  Well,  Canvas is
lower level than those others so you can have more control over the  drawing and
use less memory, but at the cost of having to write more code.   Use SVG when
you have existing shapes that you want to render to the screen,  like a map that
came out of Adobe Illustrator. We will cover SVG in a later chapter on data
visualization. Use CSS or DOM animation when you have large static areas that
you wish to animate, or if you want to use 3D transforms.  For charts, graphs,
dynamic diagrams, and of course video games, Canvas is a great choice.  And
later on we will discuss a few libraries to let you do the more vector / object
oriented stuff using Canvas.


Before we go any further I want to clarify that when I'm talking about Canvas I
mean the 2D API. There is also a 3D API in the works called WebGL. WebGL is
still being developed and the browser support is rather poor. Also, it's
essentially OpenGL from JavaScript, making it lower level than Canvas and much
harder to use. We will cover a simplified form of WebGL in a later chapter.


## Browser Support

And lastly, before we dive into working with Canvas, let's talk about where you
can use it. Fortunately Canvas is now a stable API and most modern browsers
support it to some extent. Even Internet Explorer supports it starting with IE
9, and its implementation is very good.


<table>
<tr><th>Desktop Browser</th><th>Version</th></tr>
<tr><td>Safari</td><td>3.0+</td></tr>
<tr><td>Chrome</td><td>10+</td></tr>
<tr><td>Opera</td><td>9+</td></tr>
<tr><td>FireFox</td><td>4.0+</td></tr>
<tr><td>Internet Explorer</td><td>9.0+</td></tr>
</table>


On the mobile side all recent smartphone platforms support it because most of them are
based on WebKit, which has long had good support. I know for sure iOS, Android and Windows Phone 8
support it.

Now, not every mobile device has very complete or _fast_ support for Canvas, so
we'll look at how to optimize our code for mobile devices later in the
performance section of this book.


## Simple Drawing

As I said before, Canvas is a simple 2D API. If you've done any coding work with
Flash or Java 2D it should seem pretty familar. You get a reference to a
graphics context, set some properties like the current fill or stroke color,
then draw some shapes.  Here are a few of examples.

In this example we set the current color to red and draw a rectangle. *Drag  the
numbers in the code to change the values and see how it affects the rectangle*

``` drawrect
ctx.fillStyle = "red";
//x, y, width, height
ctx.fillRect(var1,var2,var3,var4);
```

{{
    type: "jangle",
    id: "drawrect",
    width: "300",
    height: "100",
    defaultValues: {
        var1: "25",
        var2: "25",
        var3: "100",
        var4: "50"
    }
}}

Here's another one.

``` drawpath
ctx.fillStyle = '#ccddff';
ctx.beginPath();
ctx.moveTo(50,20);
ctx.lineTo(200,50);
ctx.lineTo(var1,var2);
ctx.closePath();
ctx.fill();
ctx.strokeStyle = 'rgb(0,128,0)';
ctx.lineWidth = var3;
ctx.stroke();
```

{{
    type: "jangle",
    id: "drawpath",
    width: "300",
    height: "200",
    defaultValues: {
        var1: "150",
        var2: "80",
        var3: "5",
    }
}}

In this example we set the current fill color, create a path, then fill and
stroke it. Note that the context keeps track of the fill color and the stroke
color separately. Also notice the different forms of specifying colors.
`fillStyle` and `strokeStyle` can be any valid CSS color
notation like hex, names, or `rgb()` functions.


## Paths

Canvas only directly supports the rectangle shape. To draw any other shape  you
must draw it yourself using a _path_. Paths are shapes created by a bunch  of
straight or curved line segments. In Canvas you must first define a path with
`beginPath()`, then you can fill it, stroke it, or use it as a clip. You can
define each line segment with functions like `moveTo()`, `lineTo()`, and
`bezierCurveTo()`. This example draws a shape with a move-to, followed by a
bezier curve segment, then some lines. After creating the path it fills and
strokes it.

``` pathexample
ctx.fillStyle = 'red';
ctx.beginPath();
ctx.moveTo(10,30);
ctx.bezierCurveTo(var1,var2, var3,var4,200,30);
ctx.lineTo(200,90);
ctx.lineTo(10,90);
ctx.closePath();
ctx.fill();
ctx.lineWidth = 4;
ctx.strokeStyle = 'black';
ctx.stroke();
```


{{
    type: "jangle",
    id: "pathexample",
    width: "300",
    height: "200",
    defaultValues: {
        var1: "50",
        var2: "90",
        var3: "159",
        var4: "-30",
    }
}}


## Coordinate System

A quick word on coordinate systems. Canvas has the origin in the upper left
corner with the Y axis going down. This is the traditional orientation for
computer graphics but if you want a different origin you can change it with
transforms, which we will cover later.

Another important thing is that the Canvas spec defines coordinates at the upper
left corner of a pixel. This means that if you draw a one pixel wide vertical
line starting at 5,0 then it will actually span half of the adjacent pixels (4.5
to 5.5). To address this offset your x coordinate by 0.5. Then it will span 0.5
to the left and right of 5.5, giving you a line that goes from 5.0 to 6.0.
Alternately, you could use an even width line, such as 2 or 4.

![image coordinates](images/coords.png).screenshot

### Images

Canvas can draw images with the `drawImage` function. There are several forms of
`drawImage`. You can draw the image directly to the screen at normal
scale, or stretch and slice it how you like. Slicing and stretching images can
be very handy for special effects in games because image interpolation is often
much faster than other ways kinds of scaling.

```imageexample
var img = new Image();
img.onload = function() {
ctx.drawImage(img, 0,0); //normal drawing
ctx.drawImage(img, //draw stretched
    //source (x,y,w,h)
    0,0,66,66,
    //destination (x,y,w,h)
    100,0,var1,var2
    );
ctx.drawImage(img, //draw a slice
    //source coords (x,y,w,h)
    var3,var4,var5,var6,
    //destination coords (x,y,w,h)
    250,0,250,50
    );
}
img.src = 'images/smile.png';
```

{{
    type: "jangle",
    id: "imageexample",
    width: "300",
    height: "200",
    defaultValues: {
        var1: 100,
        var2: 100,
        var3: 20,
        var4: 10,
        var5: 20
        var6: 20
    }
}}


Try changing the variables to see how stretching and slicing works. To stretch
an image you must specify the source and destination coordinates. The source
coordinates tell drawImage where to pull the pixels from in the image. Since the
image above is 67x67 pixels, using 0,0,66,66 will pull out the entire image. The
destination coordinates tell the `drawImage` where to put the pixels on the
screen. By changing the `w` and `h` coords you can stretch and shrink the image.

Slicing is the same thing, but using source coordinates that don't cover the
entire image. When you take a slice of an image be sure you don't go outside the
source bounds or else the image will disappear. For example, if you drag the
source width past 46 it will try to access pixels beyond the right edge of
the image. Using a negative source x coordinate will do the same.

## Text

Canvas can draw text as well. The font attribute is the same as its CSS
equivalent, so you can set the style, size, and font family. Note that the
`fillText(string,x,y)` function draws using the _baseline_ of the
text, not the top. If you put your text at 0,0 then it will be drawn off the top
of the screen. Be sure to lower the y by an appropriate amount.

``` textexample
ctx.fillStyle = "black";
ctx.font = "italic "+var1+"pt Arial ";
ctx.fillText("Awesome Sauce", var2,var3);
```

{{
    type: "jangle",
    id: "textexample",
    width: "300",
    height: "200",
    defaultValues: {
        var1: 48,
        var2: 20,
        var3: 150,
    }
}}



## Gradients

Canvas can also fill shapes with gradients instead of colors. Here's a linear
gradient:


``` gradient1
var grad = ctx.createLinearGradient(
    0, //x
    0, //y
    var1, //width
    var2 // height
    );
grad.addColorStop(0, "white");
grad.addColorStop(0.5, "red");
grad.addColorStop(1, "black");

ctx.fillStyle = grad;
ctx.fillRect(0,0,400,200);
```

{{
    type: "jangle",
    id: "gradient1",
    width: "300",
    height: "200",
    defaultValues: {
        var1: 200,
        var2: 0,
    }
}}

An important thing to notice here is that gradient is painted in the coordinate
system that the shape is drawn in, not the internal coordinates of the shape. In
this example the shape is drawn at 0,0. If we changed the shape to be at 100,100
the gradient would still be in the origin of the screen, so less of the gradient
would be drawn, like this:

``` gradient2
    var grad = ctx.createLinearGradient(
        0,    // x
        0,    // y
        var1, // width
        var2   // height
        );
    grad.addColorStop(0, "white");
    grad.addColorStop(0.5, "red");
    grad.addColorStop(1, "black");

    ctx.fillStyle = grad;
    ctx.fillRect(100,100,400,200);
```

{{
    type: "jangle",
    id: "gradient2",
    width: "300",
    height: "200",
    defaultValues: {
        var1: 200,
        var2: 0,
    }
}}


So if you get into a case where you think you are filling a shape with a
gradient but only see a single color, it might be because your coordinates are
off.


So that's it for basic drawing.  Let's stop there and do some exercises in the
next chapter.  You should already have a webbrowser and text editor installed. I
recommend using [Chrome](https://www.google.com/chrome/browser/) because it has nice debugging tools, and
[JEdit](http://www.jedit.org) or [Atom](https://atom.io) because they free and cross platform; but you
can use the browser and editor of your choice.
