### Game Input and Game Packaging

## GamePad API


Since this is 2d scrolling platformer, we must consider the fact that these
sorts of games didn't originally use keyboards. They were designed for a kind of
game controller known as a joypad or gamepad. This is what the original NES
controller looked like.

![NES Controller](http://upload.wikimedia.org/wikipedia/commons/8/83/NES-controller.jpg).screenshot

I picked up a modern USB equivalent at my local used electronics store. While it
has a few more buttons it's essentially the same.

Accessing the game pad is pretty easy with the
[new Game Pad API](http://www.w3.org/TR/gamepad/) This is
a pretty new API and not supported
everywhere, though it seems to keep getting better and better. Since iOS 7 has a
new native game pad API we can hope that it will show up in iOS's Safari soon as
well.  On the desktop you should use Chrome or FireFox. Hopefully Mac Safari and
IE will be coming soon.

You can test out your browser at
[this HTML 5 Rocks page](http://www.html5rocks.com/en/tutorials/doodles/gamepad/#disqus_thread)


Determine if the browser supports gamepads like this:

```
var gamepadSupportAvailable = !!navigator.webkitGetGamepads || !!navigator.webkitGamepads;
    if(!gamepadSupportAvailable) return;
```

Now we can get the list of gamepads.  This list will be full of  empty entries
until the user actually presses a button. This  behavior is to prevent browser
fingerprinting.  So always check that the pad object exists before trying to use
it.

```
var gamepads = navigator.webkitGetGamepads();

var pad = gamepads[0];
if(pad) {
    var xoff = pad.axes[0];
    var yoff = pad.axes[1];
    var punch = pad.buttons[0];
    var jump = pad.buttons[1];
    if(xoff &lt; -0.5) player.x -= 4;
    if(xoff &gt;  0.5) player.x += 4;
    if(jump == 1) dojump();
}
```

Now we can get the x and y from the axes array, and some
buttons from the buttons array.  An axis will generally go from
-1 to 1 and may or may not zero out right at 0.
Instead of just checking for less than 0
check if greater or less than a certain threshold from
zero. In this case I'm using 0.5.  Buttons will always be 0 or 1.

That's all there is to gamepad support. Here's the Ninja Cat game with gamepad support.

<h4><a href='game_v15.html' target='_blank'>Game with GamePad support</a></h4>

This API is still experimental and buggy, so be sure  to file bugs if you find a
particular joystick that doesn't work right.


## Multi-touch


Many games will be played on touch only devices like an iPad. These devices have
no keyboard or gamepad, just a touch screen.  We could use regular mouse events,
but that won't help if the player  wants to press more than one button at a
time, which is almost  certainly the case in a game. Mouse click events often
have a delay on mobile browsers as well. Instead we'll move to multitouch
events. Fortunately these are very well supported on virtually every mobile
platform.

iOS pioneered touch events on the web and the W3C  has standardized it. You will
need to listen for the `touchstart`, `touchmove`, and `touchend` events. Teach
event will contain three lists of touches: `touches`, `targetTouches`, and
`changedTouches`. We are only interested in `changedTouches` since they contain the
ones which trigger the events.

This is the code I used to detect left and right motion on the lower left of the
screen and a tap motion on the lower right.

```
var leftDown = false;
var rightDown = false;
var dirStartID = -1;
var jumpDown = false;
var jumpID = -1;
var dirStartX = 0;
var dirEndX = 0;
document.ontouchstart = function(e){
    e.preventDefault(); //disable default scrolling
    var touch = e.changedTouches[0]
    if(touch.clientX < 500) {
        dirStartX = touch.clientX;
        dirStartID = touch.identifier;
    }
    if(touch.clientX > 500) {
        jumpDown = true;
        jumpID = touch.identifier;
    }
}
```


First I declare some state variables.
When a touch is started I check if it's on the left or right side of the
screen. If it's on the left side then I'll use it as the D-pad.
If it's on the right I'll use it as jump. For each case I save
the touch identifier  so I can look it up later.

```
document.ontouchmove = function(e) {
    if(e.changedTouches[0].identifier == dirStartID) {
        dirEndX = e.changedTouches[0].clientX;
        var diff = dirEndX-dirStartX;
        if(Math.abs(diff) &gt; 30) {
            if(diff &lt; 0) leftDown = true;
            if(diff &gt; 0) rightDown = true;
        } else {
            leftDown = false;
            rightDown = false;
        }
    }
}
```

The `touchMove` event handler checks if the touch matches the id of the
direction  start. If it does then it calculates which way the user has dragged
their finger, left or right. If they move far enough (more than 30 pixels) then
it simulates the left or right keys being pressed using the leftDown and
rightDown variables.

```
document.ontouchend = function(e) {
    for(var i=0; i&lt;e.changedTouches.length; i++) {
        checkLeftRightTouch(e.changedTouches[i]);
        checkJumpTouch(e.changedTouches[i]);
    }
}

function checkLeftRightTouch(touch) {
    if(touch.identifier == dirStartID) {
        leftDown = false;
        rightDown = false;
        dirStartID = -1;
    }
}

function checkJumpTouch(touch) {
    if(touch.identifier == jumpID) {
        jumpDown = false;
        jumpID = -1;
    }
}
```

Finally on touch end the code checks for matches with both ids and ends those actions


To make things simpler I modified my keyboard and gamepad input code to also use
these leftDown, rightDown, and jumpDown variables. This makes it much easier to
manage multiple forms of input.


Let's see what it looks like

<h4><a href='game_v16.html' target='_blank'>Game with Touch Support</a></h4>

<p>For more on touch events this SitePen's <a href='
http://www.sitepen.com/blog/2011/12/07/touching-and-gesturing-on-iphone-android-and-more/
'>excellent article</a></p>

## Performance

Performance is a huge topic, and it changes every day as devices and browsers
get faster.  My general advice is to always draw less.  Use clipping so that you
only draw things that are on screen.  If you have static backgrounds or
foregrounds then move those into separate canvas elements so that the browser
can composite them in hardware.  If you really are just drawing so many things
on screen that it can't run in 60fps then consider switching from Canvas to
WebGL. There are several toolkits that give you a 2D drawing API but use GL
behind the scenes to speed it up. And of course you could go to real GL if you
want.

A few other quick tips:

* Cache static things into buffer images
* Turn off pixel scaling. This probably won't help much on desktop, but on mobile you may see benefits.
* use integer coordinates for images (vectors, not as much). Again this helps more on mobile than desktop.
* Profile, profile, profile

Chrome has a really good profiler in it to let you see where the hotspots are in
your app. This should always be the place you start when you have performance
problems.

<p><img src="profiler.png"/></p>


## App Packaging for Desktop

There are a variety of solutions for packaging up web content into a desktop
app. <a href='https://github.com/appjs/appjs'>AppJS</a>, <a
href='https://code.google.com/p/chromiumembedded/'>Chromium Embedded</a>, <a
href='http://cordova.apache.org/'>Apache Cordova</a>, <a
href='https://github.com/rogerwang/node-webkit'>Node Webkit</a>, the <a
href='http://www.sencha.com/products/desktop-packager/'>Sencha Desktop
Packager</a> and <a href='http://bellite.io/'>Bellite</a>.</p>

I recommend going with Apache Cordova because it is backed by Apache and is the
core of PhoneGap, the professional product now owned by Adobe.  Cordova gives
you a nice uniform API to code against, and is good about simply augmenting what
the HTML standard provides.

For each target operating system you will still need the native build tools and
have to set up a native project. Cordova provides templates and instructions for
both desktop and mobile. They even have a command line api to make
cross-platform projects easier to manage. However, for this demo I just want to
show you Mac support. Since I don't actually need any of Cordova's extended APIs
I'm going to show you a way to build a Mac app without using XCode at all. A
wonderful little open source tool called: <a
href='https://github.com/maccman/macgap'>MacGap.</a></p>


```
sudo gem install macgap
macgap new myapp
macgap build myapp
```

This gives us a directory with an html file in it. The simplest possible thing.
If I drop my code into it then I get an app like this. (run the app).

Unfortunately it doesn't support WebAudio
so it's best for doing quick tests. If you want to ship a product,
especially if you want to sell it in a real store like the Mac App store,
then you should go with Apache Cordova.


## Building Mobile and iPad apps

 won't cover how to turn this into a native iPad app.  You can do that easily
 with Cordova and PhoneGap. That's what those tools were built for. The have
 great tutorials to help you get started and PhoneGap even has an online build
 service so you don't have to install any of the giant platform specific SDKs,
 like XCode.

I do want to show you another way of making local iPad apps, however. The user
can save a page in the browser as a bookmark on the homescreen. Using a few
extra settings you can make this feel very much like a native app has been
installed, but that is still always updated through the web instead of the app
store. Even if you choose to go PhoneGap long term, using a web app can be a
real time saver when prototyping.

While doing this it's extremely helpful to use a remote debugger. Safari on Mac
can debug iOS devices.  There are similar solutions for Windows Phone and
Android devices. Cordova also has a tool called Winery.

First, add some hints at the top of the page to tell iOS that we want to treat
this webpage special.

```
<meta name = "viewport" content = "user-scalable=no, width=device-width initial-scale=1.0'">
<meta name="apple-mobile-web-app-capable" content="yes" />
<style type='text/css'>
html, body, canvas {
    border: 0; margin: 0; padding:0;
    background-color: black;
}
canvas {
    width: 100%;
}
</style>
```

The viewport meta tag tells the browser to disable scaling and set the width to
the device width. The apple-mobile-web-app-capable note will disable the browser
chrome like the URL bar and back button, leaving you with just the status bar.
This is what really makes it feel like an app. Also, use some quick CSS to
remove any excess space around the canvas and stretch it to 100% width.

I know this seems obvious, but remember to give your app a title. The title you give will be
used in the add to home screen dialog.

```
<html>
<head>
<title>Ninja Cat</title>
```

```
document.ontouchstart = function(e){
    e.preventDefault();
}
```

Apple has a great set of docs on the topic <a
href='http://developer.apple.com/library/safari/#documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html#//apple_ref/doc/uid/TP40002051-CH3'>here</a>.


## Parting Shoughts

Canvas really is a great technology for building games, whether or not you
decide to ship them in a webbrowser, as a desktop app, or as a mobile app. It's
a great way to build cross platform apps quickly.  To whet your appetite I spent
some time sprucing up my game to show you what it could look like with a bit
more effort.


To further impress you, here are a few games by real game developers who've done a far better job than I.


* http://www.scirra.com/arcade/games/addicting-rotary-games/848/airscape target='_blank'>AirScape</a>: a ridiculously fun platformer that rotates the entire world around you.
* <a href='http://chrome.voodoofriends.com/' target='_blank'>Voodoo Friends</a> another cute puzzle platformer
* <a href='http://city41.github.io/breakouts/' target='_blank'>Breakouts</a>. Litterally the break out game implemented in several different game engines to help you compare them.
* <a href='http://hexgl.bkcore.com/' target='_blank'>And if you want to dive into 3D, this shows what's possible with WebGL</a>
* Net Magazine's list of the <a href='http://www.netmagazine.com/features/top-10-html5-games-2012' target='_blank'>Top 10 HTML 5 games for 2012</a>.
* Pure Synth Drum Machine http://stuartmemo.com/beat-petite/


* for streaming audio: look <a href='http://joshondesign.com/p/books/canvasdeepdive/chapter12.html'>at the ebook</a>
* <a href='http://freesound.org/'>FreeSound.org</a>
* <a href='http://opengameart.org/'>Open Game Art.org</a>
