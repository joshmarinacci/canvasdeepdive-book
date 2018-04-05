### Hands On 1: Game Graphics

In this hands on portion we will modify the existing game code from <a
href='game_v6.html'>here</a> with new features. We will make the player jump,
scroll the screen, and add new animations and graphics to make the game feel
more polished. Along the way you will learn how to use more features of Canvas,
including sprite images and transforms.

## Jumping

<p>Our game feels like a 2d platformer because the player can go left and right and hit things, but he can't jump! Let's fix that first. Recall from the lecture that we move the player in updateGameState().  Let's modify it to change the player's y position if the spacebar is held down.
</p>

<p>First we will add a <code>ground</code> variable so we don't have to keep hard coding <code>400</code> everywhere. Next let's give the player a delta y, meaning the velocity in the y direction.  This represents the force of the player jumping as well as graving pulling them down.</p>

<pre><code>
// at top
var ground = 400;

// in setup()
    player.dy = 0;

</code></pre>
<p>Now let's give add a delta y of -3 to the player if the space bar is pressed. The value is negative even though the player will jump up not down. Remember that the coordinate system of canvas has Y going top to bottom, so we need to reverse the sign of the dy. On every tick we use <code>player.dy</code> to update <code>player.y</code>. We also increase dy by one to account for gravity pulling the player back down.</p>

<pre><code>
// in updateGameState();
    if(pressed[' '.charCodeAt(0)] == true) {
        player.dy -= 3;
    }

    player.y += player.dy;
    player.dy += 1;
</code></pre>

<p>We can let the player fly off the top of the screen but if he drops down past the ground we should stop him. Let's modify checkConditions() to do this.</p>

<pre><code>
//bottom of checkConditions()
if(player.getBottom() > ground) {
    player.dy = 0;
    player.setBottom(ground);
}
</code></pre>

<p>If the bottom of the player is past the ground we set the velocity to zero and
set the bottom to the ground. While this is simple code, you could replace it with
more complex behavior like making the player bounce or get stuck in the ground if they fall down to hard.</p>

<p>Now, you'll notice we have a problem. If they user holds down the space bar then the player's dy will increase by 3 on every tick, going ever faster as they shoot into infinity.  Probably not what we want. Instead let's only add a single imples of 30, right when the player starts jumping. Control this with an extra boolean <code>jumping</code>. Now the updateGameState() function looks like this:
</p>

<pre><code>var jumping = false;
function updateGameState() {
    if(pressed['J'.charCodeAt(0)] == true) {
        player.x -= 4;
    }
    if(pressed['L'.charCodeAt(0)] == true) {
        player.x += 4;
    }
    if(pressed[' '.charCodeAt(0)] == true) {
        if(!jumping) {
            player.dy -= 30;
            jumping = true;
        }
    } else {
        jumping = false;
    }

    player.y += player.dy;
    player.dy += 1;
}</code></pre>

<h4><a href='game_v7.html'>game_v7: added jumping</a></h4>



<p>We have jumping but the player still looks like a boring rectangle. Let's fix that with sprites.  A sprite is just a little image. A sprite sheet is a collection of these images stored in a single bitmap image.  Canvas lets us draw just a portion of an image, so by offseting which part of the sheet we draw we can create a simple animation. </p>

<p>Here is a sprite sheet of a little ninja cat, from the [link open game art]  project. If you look at the whole sheet you will see that it contains many animations of the cat walking, running, jumping, idling, etc.   For this hands on we will use running, jumping, and idling.  Later you can add other animations if you choose.</p>

<p>
<a href='kitty.png'><img src='kitty.png' width='500' class='thumbnail'/></a><br/>
<i>click for full image</i>
</p>

<p>First we need to load the image. Declare a sprite variable at the top so it will be global, then set the src to kitty.png</p>

<pre><code>var sprite = new Image();
sprite.src = "kitty.png";
</code></pre>

<p>To draw a sprite we really just need the x/y coordinates of that sprite within the large bitmap.  We also need the width and height, but since our sprites are always 64x64 pixels we can hard code that.  For each different animation we have a set of x/y pairs. To store this information we will use a hash map of arrays of x/y pairs.  Let's start with the idle animation.</p>

<p>By looking at the master image we can see that each frame of the idle animation
is at the top row (y = 0) and 4 images long going left to right. We can calculate the x position by multiplying the index (i) by 64, like this:</p>

<pre><code>//at top
    catAnim = {};

//in setup
    catAnim.idle = [];
    for(var i=0; i&lt;4; i++) {
        catAnim.idle.push({x:i*64, y:0});
    }</code></pre>

<p>Each coordinate pair is stored in the <code>catAnim.idle</code> array. Additional animations are created by generating different sets of coordinates.</p>

<pre><code>    catAnim.walking = [];
    for(var i=0; i&lt;8; i++) {
        catAnim.walking.push({x:i*64, y:64});
    }
    catAnim.jumping = [];
    for(var i=0; i&lt;8; i++) {
        catAnim.jumping.push({x:i*64, y:128});
    }</code></pre>

<p>We also need the index of the current frame, starting at 0, and the name of the current animation. We will default to idle.</p>
<pre><code>    catAnim.index = 0;
    catAnim.name = "idle";</code></pre>

<p>Now we must update the index on every tick, wrapping around. Since different animations may have different lengths we must check for this to avoid going off the end of the array.  Here is the updated processAnimations() function.
</p>

<pre><code>var tick = 0;
function processAnimations() {
    if(player.getBottom() &lt; ground) {
        catAnim.name = &quot;jumping&quot;;
    }


    tick++;
    if(tick % 6 == 0) {
        catAnim.index++;
    }
    if(catAnim.index &gt;= catAnim[catAnim.name].length) {
        catAnim.index = 0;
    }
}</code></pre>


<p>With the animation in place we can finally draw the sprite to the screen.</p>

<pre><code>
    //player
    ctx.fillStyle = "red";
    player.fillRect(ctx);

    ctx.save();
    ctx.translate(player.x,player.y);
    var slice = catAnim[catAnim.name][catAnim.index];
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.drawImage(sprite,
        slice.x,slice.y,64,64, //src
	    -64-32,-64-32-20,128*2,128*2 //dst
        );

    ctx.restore();
</code></pre>

<p>The code above saves the canvas state, translates to the player position, then draws the current slice of the master sprite image. It will always look up the slice by the name of the current animation and the current index. Since <code>catAnim.index</code> updates on every 6th frame the player will be drawn with different slices over time. The hard coded numbers are chosen to make the sprite match up with the player bounds. If you  use different sprites you will need to change these.</p>
<p>By default canvas will smooth out images when scaling them. This is fine for photos, but we actually want the jagged edges in our pixel art. By setting smoothingEnabled to false we can preserve our retro look.</p>


<p>Now let's check out our game:</p>

<h4><a href='game_v8.html'>Game with player sprites</a></h4>

<p>Once you've got the sprites looking correct you can comment out player.fillRect() which draws the red rect version of the player.</p>


<h3>Scrolling</h3>

<p>To make this a real platformer we need to make the screen scroll. Fortunately this is quite easy.  We just add a <code>camera</code> variable to remember the current scrolling offset. We update the offset whenever the player moves.</p>

<pre><code>
//at top
<b>var camera = 0;</b> // declare the camera

//at end of updateGameState()
    player.y += player.dy;
    player.dy += 1;
    <b>camera = player.x - 200;</b> // update the camera
</code></pre>

<p>Now we must use the camera variable to translate all of our drawing in the opposite direction. This makes the camera follow the player. Just the bold lines below are new.</p>

<pre><code>
function draw() {
    <b>ctx.save();</b> //save graphics state
    <b>ctx.translate(-camera,0);</b> //translate

    //background / sky
    ctx.fillStyle = "#88ddff";
    ctx.fillRect(0,0,800,600);

    //ground
    ctx.fillStyle = "#88ff00";
    ctx.fillRect(0,400,800,200);


    //player
    ctx.fillStyle = "red";
    //player.fillRect(ctx);

    ctx.save();
	ctx.translate(player.x,player.y);
    var slice = catAnim[catAnim.name][catAnim.index];
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
	ctx.drawImage(sprite,
	    slice.x,slice.y,64,64, //src
	    -64-32,-64-32-20,128*2,128*2 //dst
	    );

	ctx.restore();

    //monolith
    ctx.fillStyle = "black";
    monolith.fillRect(ctx);

    //effects
    effects.forEach(function(ef) {
        ef.tick();
        ef.draw(ctx);
    });

    <b>ctx.restore();</b> // restore the graphics state
}
</code></pre>


<h4><a href='game_v9.html'>v9: add scrolling</a></h4>


<p>Before we go any further lets do some cleanup. The draw function is getting pretty large. Let's break it up into the different parts of the scene. That will
make it easier to manage as we add more animation and scrolling. The refactored code looks like this:</p>

<pre><code>function draw() {
    drawBackground(ctx);
    drawGround(ctx);
    ctx.save();
    ctx.translate(-camera,0);
    drawPlayer(ctx);
    drawMonoliths(ctx);
    drawEffects(ctx);
    ctx.restore();
}
function drawBackground(ctx) {
    ctx.fillStyle = &quot;#88ddff&quot;;
    ctx.fillRect(0,0,800,600);
}
function drawGround(ctx) {
    ctx.fillStyle = &quot;#88ff00&quot;;
    ctx.fillRect(0,400,800,200);
}
function drawPlayer(ctx) {

    ctx.save();
	ctx.translate(player.x,player.y);
    var slice = catAnim[catAnim.name][catAnim.index];
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
	ctx.drawImage(sprite,
	    slice.x,slice.y,64,64, //src
	    -64-32,-64-32-20,128*2,128*2 //dst
	    );

	ctx.restore();

}
function drawMonoliths(ctx) {
    ctx.fillStyle = &quot;black&quot;;
    monolith.fillRect(ctx);
}
function drawEffects(ctx) {
    effects.forEach(function(ef) {
        ef.tick();
        ef.draw(ctx);
    });
}
</code></pre>


<h3>Parallax Scrolling</h3>

<p> Let's change the game to a night scene and add parallax scrolling layers. These are additional background layers that scroll with the player, but at slower rates so they appear to be further away.</p>

<p>The background layer will be a dark red city skyline. They will all be the same width and color, so we can build the skyline with a bunch of rand height values.</p>

<pre><code>//at the top
var skyline1 = [];
for(var i=0; i&lt;100; i++) {
    skyline1[i] = rand(50,200);
}
</code></pre>

<p>To draw it we first translate by half of the camera value. This makes it scroll slower than the foreground, and therefore appears to be further away. This simple trick to simulate depth works surprisingly well.</p>
<pre><code>//new function to draw the skyline
<b>function drawSkyline(ctx) {
    ctx.save();
    ctx.translate(-camera/2, 0);
    ctx.fillStyle = "#442222";
    for(var i in skyline1) {
        var h = skyline1[i];
        ctx.fillRect(i*50, ground - h, 51, h);
    }

    ctx.restore();
}</b>

//add drawSkyline to the draw() function
function draw() {
    drawBackground(ctx);
    <b>drawSkyline(ctx);</b>
    drawGround(ctx);
</code></pre>

Also change the color of the background to near black, and the monolith to near white.

<pre><code>function drawBackground(ctx) {
    //background / sky
    <b>ctx.fillStyle = "#202020";</b>
    ctx.fillRect(0,0,800,600);
}
function drawMonoliths(ctx) {
    <b>ctx.fillStyle = "#f0f0f0";</b>
    monolith.fillRect(ctx);
}
</code></pre>

<p>Now let's take a look at our work:</p>

<h4><a href='game_v10.html'>v10: parallax scrolling</a></h4>

<p>That's all of the time we have for this hands on section. If you have
extra time here are a few suggestions for improvements you could make.

<ul>
<li>draw the player flipped when he moves left instead of right</li>
<li>Limit the jump height and the ability to jump in mid-air</li>
<li>add more parallax background layers</li>
<li>add a stationary background layer, such as a starfield or moon.</li>
<li>add more monoliths</li>
<li>add other movable enemies. You can find more fun sprites from author of the cat fighter, <a href='http://opengameart.org/users/dogchicken'>DogChicken</a>.
</ul>

</pre>
<script type="text/javascript">var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-9436360-1']);
_gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

</script></body>
</html>
