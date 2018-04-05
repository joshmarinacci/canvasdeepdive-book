### Lecture 1: the game loop

Now lets dig down into how to actually build a game. You may want
to use an existing library or tool to help you. These are called game
engines.  Some focus more on 2D and some on 3D.  Here are a few
examples of open source Canvas game engines:

* [Crafty JS](http://craftyjs.com/)
* [Lime JS](http://www.limejs.com/)
* [Quintus](http://html5quintus.com/)
* [HTML 5 Game Development] (http://www.html5gamedevelopment.com/)


However, my goal in this workshop is to really teach you what is
going on, not just how to build a game, so we won't be using a game
engine. Instead we will code it from scratch using just a web browser
and our text editor.

## Anatomy of a game engine

Most games are pretty simple. If you take away the splash screen, menus and
configuration, what you are left with is essentially a loop that runs over and
over very fast. The loop looks like this:

```
   * process user input
   * update the game state
   * check for death or other conditions
   * process animations
   * draw
   * refresh the screen and loop
```

Here's a simple template. This page doesn't do anything yet, but it gives us a
place to put everything.

```
<html>
<body>
<canvas id='canvas' width='800' height='600'></canvas>
<script type='text/javascript'>
function setup() {
}
function gameLoop() {
    processInput();
    updateGameState();
    checkConditions();
    processAnimations();
    draw();
    refresh();
}
function processInput() {}
function updateGameState() {}
function checkConditions() {}
function processAnimations() {}
function draw() {}
function refresh() {}
</script>
```

## Process user input


First we get user input. Usually this means a mouse or keyboard,
but as we will see later, it could include a joystick or game pad, or
even a remote device over the network like a smartphone.  Since we
are inside the loop we can't do anything that is slow or would
require us to wait. That means callbacks like keyboard handlers won't
work. We can't wait for the user to press a key (unless it's a puzzle
game, maybe). Instead we need to check the current state of the
keyboard on every time through the game loop.  The browser doesn't
provide an API to do this, but we can fake it with some global
variables like this:


```
var pressed = {};

function setup() {
    document.addEventListener('keydown',function(e) {
        pressed[e.keyCode] = true;
    });
    document.addEventListener('keyup',  function(e) {  
        pressed[e.keyCode] = false;  
    });
}
```


Every time the user presses a key anywhere on the document it will change
that key's entry in the pressed hash map, setting it to true or false. Then we
can check the value of `pressed[keycode]` at any time to see if that key is pressed.

## Update the Game State

Next we need to update the game state.  This is the state of
every object in the world of the game. Things like the position of
the player, the position of the enemies, the position of bullets and
obstacles, and anything else that could change in the world.  For
this game we are building a simple platformer, so we need the
position of the player and the position of some obstacles. Let's
start with the player.

The player, like most things in this game, is essentially a rectangle. Since we
will be working with these rectangles over and over I've created a common
utility object called `Box`

```
function Box(x,y,w,h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.fillRect = function(ctx) {
        ctx.fillRect(this.x,this.y,this.w,this.h);
    }
    this.getRight = function() { return this.x + this.w; }
    this.getLeft = function() { return this.x; }
    this.getTop = function() { return this.y; }
    this.getBottom = function() { return this.y + this.h; }

    this.setRight  = function(right) { this.x = right - this.w; }
    this.setLeft   = function(left)  { this.x = left; }
    this.setBottom = function(bottom) { this.y = bottom - this.h; }
    this.setTop    = function(top) { this.y = top; }

    this.intersects = function(box) {
        if(this.getRight() >= box.getLeft()
        && this.getLeft() <= box.getRight()) {
            if(this.getBottom() >= box.getTop()
            && this.getTop() <= box.getBottom()) {
                return true;
            }
        }
        return false;
    }
}
```

The `Box` object is just a rectangle defined by an x, y, width, and height. It
has utility functions for getting and setting the edges, as well as checking for
intersection with another box. `box.fillRect` is a function to draw
the box on screen. We won't use this in the real game, but it's useful for
debugging. Over time we will add more useful functions for dealing with
rectangles, so it's nice to have a common place to put them.

So our player is just a box. When the J and L keys are pressed we adjust
player.x by a certain amount.


```
//at the top
var player = new Box(0,0,50,100);
//....
function processInput() {
    if(pressed['J'.charCodeAt(0)] == true) {
        player.x -= 3;
    }
    if(pressed['L'.charCodeAt(0)] == true) {
        player.x += 3;
    }
}
```


Now our player can move right, but of course we can't see him yet because we
aren't drawing anything. We won't get to drawing later, but let's set up some
debug drawing just so we can tell what's going on.

```
function draw() {
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,800,600);
    ctx.fillStyle = "red";
    player.fillRect(ctx);
}
```


Now let's see what it looks like. You'll notice that the game is very slow.
For now I've limited it to ten frames per second so we can easily see what's
going on.

<h4><a href='game_v2.html'>Game with player and keyboard input</a></h4>


## Check for death and other conditions


Let's assume that we have a giant monolith on the right side of the screen. If
the player touches the monolith then they die. Since the player can't jump we
can just check if the player intersects the monolith. The monolith is a
rectangle and so is the player so  this calculation is easy. We just test if two
rects intersect.  Now I'm not saying the player has to actually _look_ like a
rectangle, just that its bounds are a rectangle for the purposes  of collision
detection. This is called a _bounding box_ and they are used everywhere in
games.

So let's add the monolith then check if the player intersects with it.	If the
player is touching the monolith then let's kill the player and move him back to
the start position. We can worry about some sort of death animation later.

```
// at top
var monolith = new Box(300,0,50,200);

function checkConditions() {
    if(player.intersects(monolith)) {
        console.log("player hit the monolith.");
        player.x = 0;
    }
}


// in draw()
    ctx.fillStyle = "black";
    monolith.fillRect(ctx);
```


## Draw the Screen

Now we finally get to the canvas part. We can actually draw the game so it looks
like a game. Here's the code to draw the monolith and player with a sky and
ground. To keep things simple we are still drawing them as plain rectangles.

```
function draw() {
    //background / sky
    ctx.fillStyle = "#88ddff";
    ctx.fillRect(0,0,800,600);

    //ground
    ctx.fillStyle = "#88ff00";
    ctx.fillRect(0,400,800,200);

    //player
    ctx.fillStyle = "red";
    player.fillRect(ctx);

    //monolith
    ctx.fillStyle = "black";
    monolith.fillRect(ctx);
}
```

<h4><a href="game_v3.html">Game, v3</a></h4>


## Refresh the Screen

Now we can just loop. However, we can't just stick all of this in a for loop.
The way the browser works it won't actually draw anything until our code ends.
If we just loop forever then the screen will never be updated. What we want is
to run our code, then hand control back to the browser to refresh the screen,
then run our code again, over and over.


You might be tempted to use a simple `setInterval()` which calls your
code every so many milliseconds, but *don't* do it!  `setInterval`
is literally just a timer. It doesn't know anything about what the rest
of the browser is doing. It doesn't know if the screen is synced to
the vertical refresh of your monitor. It doesn't know if your page is
in a tab in the background. It also isn't guaranteed to call your function
exactly at the time you request. In fact, it's often very jittery.
Using `setInterval()` is a sure fire way to
have a slow and choppy that wastes battery.

We will use `requestAnimationFrame` instead.  This function is fairly new, but
supported in all of the major browsers. It will refresh the screen at the best
and most power efficient time. It will lower the refresh rate in background
frames, and sync to the screen to give you a silky smooth 60 frames per second.
`requestAnimationFrame` is your friend!

Since different browsers use different forms of the call, we'll use this simple
shim.

```
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();
```

Now we call the function at the end of the gameLoop to request the
next frame. We also call it once after doing the initial setup.

```
function gameLoop() {
    processInput();
    updateGameState();
    checkConditions();
    processAnimations();
    draw();
    window.requestAnimFrame(gameLoop);
}

setup();
window.requestAnimFrame(gameloop);
```

Now let's take our game for a test run.

<h4><a href='game_v4.html'>game w/ request animation frame</a></h4>


## Process Animations

Earlier I skipped over the animation step. When I say animations here I mean
animations that run on their own, not actually moving the player or  enemies.
This could be clouds moving in the sky or an explosion triggered by a gun. It
could also be the look of the player, say a set  of sprites to make the player
look like they are walking. Let's start with  a particle explosion for when the
player dies.

Since particles are such a common part of games I've created
another utility object: `ParticleEffect`.

```
function ParticleEffect() {
    this.x = 0;
    this.y = 0;
    this.age = 0;
    this.parts = [];
    this.rate = 1;
    this.max = 10;
    this.maxage = 200;
    this.color = "#aaaaaa";
    this.alive = true;
    this.initParticle = function(part) {
        return part;
    }
    this.tick = function() {
        this.age++;
        if(this.age > this.maxage) {
            this.alive = false;
            return;
        }
        if((this.age % this.rate) == 0 && this.parts.length < this.max) {
            var part = {
                x:this.x,
                y:this.y,
                dx: rand(-3,3),
                dy: rand(-3,3),
                alpha:1,
                dalpha:-0.01,
                };
            this.parts.push(this.initParticle(part));
        }
        for(var i=0; i<this.parts.length; i++) {
            var p = this.parts[i];
            p.y += p.dy;
            p.x += p.dx;
            p.alpha += p.dalpha;
        }
    }
    this.draw = function(g) {
        if(!this.alive) return;
        g.save();
        g.fillStyle = this.color;
        for(var i=0; i<this.parts.length; i++) {
            var p = this.parts[i];
            if(p.alpha < 0) continue;
            g.globalAlpha = p.alpha;
            g.fillRect(p.x,p.y,20,20);
        }
        g.restore();
    }
}
```


You can think of a ParticleEffect as a mini game
loop. On each step it create some particles, update the position and
color of the existing particles, then kill or recycle some particles.

Each particle is just a tiny object with a bit of state, such as x  and y
positions and velocity. The particles also have an age so we  can kill them when
they reach some maximum age. In the code above   you can see default values for
the starting x and y positions,   the age, an array for holding the particles,
the rate to spawn new particles, the max number of particles, the max age for a
particle, the color of particles, and a boolean for whether the effect as a
whole is alive or dead.

To use a particle effect we must create a new `ParticleEffect` object then
override the portions we care about.

```
// at top
var effects = [];

// in checkConditions()
    if(player.intersects(monolith)) {
        console.log("player hit the monolith.");

        var effect = new ParticleEffect();
        effect.x = player.x;
        effect.y = 400;
        effects.push(effect);
        player.x = 0;
    }

// in draw()
    //effects
    effects.forEach(function(ef) {
        ef.tick();
        ef.draw(ctx);
    });
```

Let's check it out. Notice that I've also moved the player and
monolith 'y' values next to the ground so they don't look like they are floating in the air.


<h4><a href='game_v5.html'>Game w/ default particles</a></h4>

So that's pretty good, but let's tweak the effect a bit. Instead of gray I want
the colors to be random, and let's make them faster, and move only to the left.
By creating a new `initParticle` function we can modify how particles are
created.

```
var effect = new ParticleEffect();
effect.x = player.x;
effect.y = 400-player.h/2;
effect.max = 100;
effect.initParticle = function(part) {
    part.dy = rand(-5,5);
    part.dx = rand(-3,0);
    part.color = randColor();
    return part;
};
effects.push(effect);
```


Setting `max` to 100 changes the total number of particles. The `dx` and `dy`
values determine the per-tick velocity in the x and y directions.  `dy`  will be
a random value up or down (positive or negative) but with a max of 5 instead of
3, so it will go faster now.  `dx` will go from negative 3 to zero, so it will
only go in the x direction.

I've also included this nifty little function called `rand`
which returns a random number between two low and high values.
And thanks to Paul Irish for a nifty snippet
to [generate random colors](http://www.paulirish.com/2009/random-hex-color-code-snippets/)


<h4><a href='game_v6.html'>Game with updated particle effects</a></h4>

Great. Now we are going to do the hands on portion of our
workshop.  You will take the game skeleton I've outlined here and
flesh it out into a full game with graphics, animation, and
scrolling.
