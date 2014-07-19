
### Making Your Visualizations Better

## D3 Capabilities.

As you've just seen, D3 is a very powerful tool. While we've only used bar and
map charts, it supports many others like:

A bubble chart.

[Bubble Chart](http://bl.ocks.org/mbostock/4063269)

This is a tree map.

[Classic Zoomable Tree Map](http://mbostock.github.io/d3/talk/20111018/treemap.html)

This is an alternate radial form of a tree map.

[BiLevel Partition: radial tree map](http://bl.ocks.org/mbostock/5944371)

A force directed graph. These are self arranging and interactive.

[Force Directed Graph](http://bl.ocks.org/mbostock/4062045)


You can even use D3 for simple mechanical simulations:

[Planetary Gears](http://bl.ocks.org/mbostock/1353700)

I especially like this multiple level radial chart called a Sequence Sunburst

[Sequence Sunburst](http://bl.ocks.org/kerryrodden/7090426)

It's a really great way to show consecutive sequences. In this example it shows
sequences of page navigation on a website. By moving your mouse around you can see
increasingly fine slices of the data while still making sense of the whole.

This example brings up a good point. When should you use interactivity and color?
D3 makes it so easy to build cool things that it's easy to go overboard. Always use
restraint.

## Color

Don't use color just to make it pretty. The color in your chart should always
represent something. If two things are different colors they should actually be
different in some way. Now of course, the particular set of colors you choose
are up to you, as is how you map them. Make sure the colors feel good together,
but also that there is enough contrast between them. If two colors are too close
together then it may be hard to distinguish between them.

I recommend using a tool called ColorBrewer to generate nice sets of
colors.

[ColorBrewer 2.0](http://colorbrewer2.org)

demo of how color brewer works.

## Animation and Interaction

Animation is even easier to over do than color. Keep it limited and purposeful.
If something moves on screen it should be important. Use movement for
transitions or to highlight something. In general keep motion toned down.

Interaction is similar. It may be tempting to put rollovers on every chart you
build, but only do it if the interaction actually adds something. If the rollover
just tells you a small pieces of data that could fit into the chart anyway, then
drop the rollover.

Remember that D3 is just SVG underneath. This means you can use any SVG
objects, use other SVG libraries, and import SVG content from anywhere.
You can create SVG content in [Sketch](http://www.bohemiancoding.com/sketch/),
[Illustrator](http://www.adobe.com/products/illustrator.html), or [Inkscape](http://www.inkscape.org/).
There is a lot of SVG artwork you can find on the web. Wikipedia even has
a list of their many SVG files [organized by subject](http://commons.wikimedia.org/wiki/Category:SVGs_by_subject).

## Getting Tabular Data

We don't have much time left, but I want to talk a bit about getting data itself.
Most likely you already have some data you want to display, but you may also
need some baseline data. For example, if you wanted to show cat density in Portland
vs other cities, you'd need national cat data to render it.

There are many places to find data online. Almost too many. So I'll send you to
a few aggregators of data.


[DBpedia](http://dbpedia.org/) is a databasized version of the data inside Wikipedia. It's useful
for basic facts

[DataHub.IO](http://datahub.io) is essentially a search index for data providers, mostly
public ones. For example, a search for 'energy' turns up 634 items.

[Quandl](http://www.quandl.com) is another aggregator which also has converters to download data
in different formats like JSON.

## Getting Geo Data
If you are working on mapping projects you'll also want some GeoData. First start
by searching for GeoJSON files, then look up other data sets in the Shape format. There are
free tools to convert Shape files into GeoJSON.  If you just want a common set, like
the outlines of all countries, you can find that in Johan Sundström [github repo](https://github.com/johan/world.geo.json).  Incidentally, GitHub
has added GeoJSON support to the website, so you can preview them right in the browser.

## Why Data Visualizations

Now finally, I'd like to leave you with one thought. Why do we do data visualizations at all? Because a picture
can be worth far more than a thousand words. Words and numerical data are poor indicators of importance. Only
by putting it into a well designed picture can we bring out what is important. Let me leave you with this demonstration of data sets that look identical with numerical statistics, but is completely different when shown visually.

[Why Data Visualizations](https://www.dashingd3js.com/why-data-visualizations)

Thank you



[D3 API Reference](https://github.com/mbostock/d3/wiki/API-Reference)

[More D3 Examples](https://github.com/mbostock/d3/wiki/Gallery)
