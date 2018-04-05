### Hands On: Sound for Games


In this hands on we will use what we have learned about audio synthesis to add a
sound track and sound effects to our game.

## Getting Started

First we need to add some sound utility functions. Open your game and add this
code that we learned from the last lecture.

The important thing in this hands on is that you should play. I've intentially
given you less explicit instructions so you will have time to play with
different sounds and make them your own.


```
var sin = Math.sin;
var PI = Math.PI;
var floor = Math.floor;
var scale = {
    C4:261.626,
    D4:293.665,
    E4:329.628,
    F4:349.228,
    G4:391.995,
    A4:440.000,
    B4:493.883,
}
var notes = [scale.E4, scale.D4, scale.E4, scale.F4];

var noteLen = 0.2;
function note(t) {
    var cur = (floor(t/noteLen) % notes.length);
    return notes[cur];
}
function tone(t,freq) {
    return sin(t*2*PI*freq);
}
function lerp(t, lo, hi) { return (hi-lo)*t + lo; }

function adsr(t, a, d, s, r, al, sl) {
    if(t &lt; a) return lerp(t/a,0,al);
    t-=a;
    if(t &lt; d) return lerp(t/d,al,sl);
    t-=d;
    if(t &lt; s) return sl;
    t-=s;
    if(t &lt; r) return lerp(t/r,sl,0);
    return 0;
}
function envelope(t) {
    return adsr(t, 0.18, 0.15, 0.48, 0.19, 0.76, 0.08);
}
function music(t) {
    var ti = floor(t/noteLen)*noteLen;
    var t2 = (t-ti);
    var te = t2*noteLen;

    var freq = note(t);
    var ton = tone(t2, freq);
    var env = envelope(te);
    return ton*env;
}


var actx = new webkitAudioContext();
var jsnode = actx.createScriptProcessor(512,0,1);
var t = 0;
jsnode.onaudioprocess = function(e) {
    var output = e.outputBuffer.getChannelData(0);
    for (var i = 0; i &lt; output.length; i++) {
        output[i] = music(t);
        t += 1/44000.0;
    }
}
jsnode.connect(actx.destination);
```


This will give you a basic fast repeating melody of four notes

```
<h4><a href='game_v11.html' target='_blank'>Game with basic melody</a></h4>

```

# Make your own music

Now make your own melody by modifying the `notes` array. Start small with just a
few notes then add more until you have a few bars. Change the tempo with the
`noteLen` variable.  The current scale only has a single octave but
you can add more frequencies from
[Piano key frequencies list](http://en.wikipedia.org/wiki/Piano_key_frequencies) on
wikipedia.


Now try switching the tone generator function. Instead of a pure sin, use the
square or sawtooth functions.  The equations are:

```
function square(t) {
    var v = sin(t);
    if(v &lt; 0) return -1;
    return 1;
}
function sawtooth(t) {
    t = t/(2*Math.PI);
    return (t - floor(t))*2 - 1;
}
```

Now make up your own sound by mixing sine and square waves.  Here's a nice starting point. This mixes three waveforms at different frequencies.:

```
function tone(t,freq) {
    var th = t*2*PI*freq;
    return (square(th*1.2) + sawtooth(th) + sawtooth(th*1.01))/3;
}
```

Now change the ADSR settings. Use <a
href='http://joshondesign.com/p/demos/sound/adsrviz/index.html'
target='_blank'>the visualizer</a> to play around, then plug them into your
code. The ADSR viz shows you values as percentages. You will need to use them as
floating fractions, so 25% = 0.25.  Pay attention to the order of the arguments.
It goes A,D,S,R, then the attack level, then the sustain level.


# Sound Effects


No game would be complete without some sound effects. Let's add a sound when the player jumps.  To keep it simple start with just a sine wave mixed into the main audio.  Create a `jumpsound` function which returns 0 when the player is on the ground and a sin wave when the player is in the air.

```
function jumpsound(t) {
    if(player.getBottom() &gt;= ground) return 0;
    return sin(t*2*PI*200);
}
```

To use this sound mix it with the main music track in the `onaudioprocess` callback.  Mixing audio waveforms is done by adding them together then dividing by the number of sounds; in other words the _average_ of the different waveforms. This will mix the sounds evenly, meaning with the same volume.

```
jsnode.onaudioprocess = function(e) {
    var output = e.outputBuffer.getChannelData(0);
    for (var i = 0; i &lt; output.length; i++) {
        <b>output[i] = (music(t)+jumpsound(t))/2;</b> //mix in the jump sound
        t += 1/44000.0;
    }
}
```

<h4><a href='game_v12.html' target='_blank'>Game with Jump Sound</a></h4>

The sound is there but it's kinda boring. It would be nice if the sound conveyed
the feeling of jumping by increasing the pitch.  This is pretty easy. We can
multiply the frequency by t as it increases. There is a problem though. T starts
at 0 when the game starts and increases forever. We want a t value that starts
when the jump starts.  To fix this create a new t variable called
`jumpt` which is set to 0 when the player is on the ground and only
increases when the player is in the air.  Then use `jumpt` to modify the frequency
as well as the t value for the sine wave. The new `jumpsound` function looks like
this:

```
var jumpt = 0;
function jumpsound(t) {
    if(player.getBottom() &gt;= ground) {
        jumpt = 0;
        return 0;
    }
    jumpt += 1/44000.0;
    var freq = 260*(1+jumpt);
    return sin(jumpt*2*PI*freq);
}
```

<h4><a href='game_v13.html' target='_blank'>Game with Better Jump Sound</a></h4>


# Adding a Beat

To make the audio complete let's add a second music track. This time it will
just be a simple snare drum that repeats over and over.  We can simulate a snare
drum with a short bit of noise. Start with a t value that repeats from 0 to one
for every note, as we did with the music. Then return 0 if the value is less
that 0.9, or a random number otherwise.  Choosing 0.9 means it will be silent
for 90% of the note and only make noise for the last 10%, creating a simple
snare drum effect.

```function drum(t) {
    var ti = floor(t/noteLen)*noteLen;
    var t2 = (t-ti)/noteLen;
    if(t2 &lt; 0.9) return 0;
    return Math.random();
}
```

Since pure noise will seem much louder than tones I suggest you lower the drum's volume by dividing by 5. Play around with the numbers until you find something you like.

```
output[i] = (music(t)+jumpsound(t)+drum(t)/5)/3;
```

<h4><a href='game_v14.html' target='_blank'>Game with A Beat</a></h4>


That's it for sound. Please keep playing until it is time for the next lecture
portion.  There is literally an endless variety of sounds you can create by just
messing with simple math.
