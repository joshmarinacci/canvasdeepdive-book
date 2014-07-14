### Charts with SVG and D3

Building a chart with Canvas was pretty easy. We did a bit of math and drew some shapes.
But we didn't have animation. We didn’t have interaction. We didn't handle UI.
There were lots of hard coded values. What would happen if we get more data values, or
if the values exceed the range we planned for? We could fix all of these things by
hand with more code, or we could use technologies that handle these things for us: SVG and D3


Just like canvas, SVG is just a box in the page. The difference is that we can put
shapes directly inline. Here's an SVG box with a rectangle and circle inside.


```
<html>
<body>
<svg id='chart' width='500' height='100'>
    <rect x='10' y='10' w='100' height='50'/>
    <circle cx='200' cy='50' radius='25'/>
</svg>
</body>
</html>
```


Now let's style the shapes. We can set attributes directly on the
shapes or use CSS. The CSS works just like regular CSS for the DOM
but we use different properties.


```
<html>
<style type='text/css'>
    svg circle {
        fill: green;
        stroke: black;
        stroke-width: 5px;
    }
</style>
<body>
<svg id='chart' width='500' height='100'>
    <rect x='10' y='10' w='100' height='50' fill='red'/>
    <circle cx='200' cy='50' radius='25'/>
</svg>
</body>
</html>
```

To draw a chart we could add a bunch of shapes, once for each data point, but
this wouldn't really be an advantage over Canvas. We are still doing a lot of
work  by hand.  Let's look at a library made specifically for doing data visuallization: D3.

* background on D3
* some examples of D3
* a lot of this material came from this book [link]
* and tutorials [link]. highly recommended.

Let's use D3 to make the same bar chart as you made in the hands on lab. We
will start by creating the SVG element using the D3 api in javascript.

```
var w = 500;   // save our width and height for later
var h = 100;
var dataset = [ 5, 10, 15, 20, 25,];
var svg = d3.select('body')
            .append('svg')
            .attr('w',w)
            .attr('h',h);
```

This is the same as writing the SVG element in the page, but by using D3 we can start
adding behavior. Now let's add a rectangle for each data point.

```
svg.selectAll('rect')
    .data(dataset)
    .enter()
    .append('rect')
    .attr('fill','teal')
    .attr('x',function(d,i) {
        return i*30;
    })
    .attr('y',function(d,i) {
        return h-d*3;
    })
    .attr('width', function(d,i) {
        return 28;
    })
    .attr('height', function(d,i) {
        return d*3;
    })
    ;
```

This is similar to what we did with Canvas, but notice there is no loop. The
library is handling this for us.  Let's go through it step by step.

The `svg.selectAll('rect')` part gets all of the rectangles in the SVG box,
which is currently empty because we don't have any yet. Then it binds to the
data with `data(dataset)`. Next is `enter` which means "whenever a new data element
_enter_s the dataset, do the next stuff". Since all of our data is new it will call
what comes next for every element in our data set.  For each one it will then
what comes next for every element in our data set.  For each one it will then
create a new rect, `append('rect')`, then set the fill, x, y, width, and height attributes.

All of the rectangles have the same color so we set it with
`attr('fill','teal')`. The other values are different for each element, so
instead of passing a plain value like `'teal'` we pass it a function. This
function will calculate the correct value based on the data element. For x the
value is the index of the element times 30. Each of the other values are similar
to what we did for Canvas, but using these little callback functions instead of
the loop code.

Now, what do we do if we get so much data that it won't fit, or if one of the values
is so big it goes off the top of the chart.  As with Canvas, we could calculate
correct values by hand, but D3 already has a way to do this for us. It's called a
Scale.

A scale is just a mapping from a set of input values to a set of output values.
Suppose we have the values in our bar chart `[ 5, 50, 300, 800, 275]`. The biggest value
is 800 but our chart only goes up to 100 pixels. We need a scale to map from the
data values to pixel values.  In math the input is called the _domain_ and the
output is called the _range_.  Let's create a new linear scale and set the domain
and range.

```
var scale = d3.scale.linear()
                    .domain([0, 1000])
                    .range([0, 100]);
```

Now we can call scale as a function to have it convert numbers for us.

var dataset = [ 5, 50, 300, 800, 275, ];

var scale = d3.scale.linear()
                    .domain([0, 1000])
                    .range([0, 100]);




* instead of doing math by hand like before, we will define a scale
* what is a scale?
* calculate scale based on the data set

there are other scales besides linear. for example log is very useful when
tracking exponential trends like moore's law.

![example of moores law log graph](asdf.png)

* update the data and see that it adapts automatically

* add the two axes, notice how it makes them pretty with the ticks and values.


the real magic of d3 is how it handles updates. everything we've done so
far has been static. it could have been done a hundred years ago in a newspaper,
just with more effort.  to take advantage of the web we can make things
update dynamically with animation.



* now we add a button to switch between data sets
* animate between them

tweak the animation to use different durations and easings
add a calculated delay to make them start and stop at different times

add simple event handler to print the value of the bar you clicked on
add an event handler to change side bar details when you click on the bar
