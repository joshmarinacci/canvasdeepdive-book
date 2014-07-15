### Advanced Audio Synthesis

Now that we have the game running. Let's make it better with some real sound.

## Audio

The secret to a good game is good audio. Without sound a game feels like a cheap
demo. With good sound, even cheesey graphics can be lots of fun to play.

Sound used to be one of the weakest parts of Canvas games, but the web has come
a long way in the past few years. You can easily play an mp3 or short sound
clips in a webpage. There's a chapter in my canvas book about it. Today,
however, I want to teach you something new. Today we will learn how sound really
works and create our own music from scratch. No sampling. No recording. Just
pure sonic math.

## What is sound?

Sound is just vibrating air. When it vibrates at a certain frequency we hear
particular tones. The simplest sound possible is just a sine wave. In fact,
almost any sound can be created by adding enough sine waves together. Here's
what a simple sine wave looks like. You should remember this from highschool
math.

```
Wave Visualizer
```

Digital audio is just analog audio, like our sine wave here, chopped up into
tiny pieces called samples. A sample is just a number from -1 to 1. Most digital
audio is run at 44khz, meaning it runs through forty four thousand samples every
second. If we can provide 44k numbers every second then we can make real sound.
HTML recently added a new spec called WebAudio which lets us do just that.

This is the simplest possible sound we can make with WebAudio

```
var ctx = new webkitAudioContext();
var jsnode = ctx.createScriptProcessor(512,0,1);
var t = 0;
jsnode.onaudioprocess = function(e) {
    var output = e.outputBuffer.getChannelData(0);
    for (var i = 0; i < output.length; i++) {
        output[i] = Math.sin(t);
        t += 0.05;
    }
}
jsnode.connect(ctx.destination);
```

This code creates a new audio context and a script processor. A script processor
is an object that will call our code to request sound samples every few
milliseconds. We just fill the output array with numbers and return. We could
fill the sound with values taken from a file. This would be pre-recorded audio,
like an MP3 or wave file. However, we are filling the array with a sine wave.
This is what it sounds like.

```
[Sound Play]()
```

This is a plain sine wave so it has that pure tone sound. The value we put into
the sine function is called _theta_, as you may remember from your trig classes.
We can change the pitch by changing theta. If we divide theta by two then the
frequency will be cut in half, which makes the tone go down an octave.

Let's try a few: `t*2, t/2, t*1.3`

We can also add sine waves together like this: `sin(t) + sin(t*1.2)`.  Each sin
goes from -1 to 1, and our output needs to be between -1 and 1.  If we add to
sines together then the value could go from -2 to 2, so we need to divide by 2
like this: `(sin(t) + sin(t*1.2)/2`. See how there's more depth to the sound? This
is because we are mixing multiple waves. In real life nothing is a single pure
tone. It's aways a mixture of things. By combining waves we can make all sorts
of interesting sounds.

Let's try a stranger one: `sin(t) + sin(t*1.01)`. This gives us a
funky wobbling sound. It's because we have two waves that are almost identical
but not quite. Let's look at waht's really going on here in the visualizer.

```
Wave Visualizer
```

Everything I've shown you so far is pure sine waves, but there are other kinds
of waves too. In digital music we will commonly use the square wave and sawtooth
waves. We can also use random numbers to give us pure noise.

```
more demos
```

After playing around with some different functions I found this nice 70s scifi
movie sound:

```
function wave(t) {
    return (saw(t) + sin(t/3) + saw(t/5))/3;
}
var base = mix(wave(t*1.000), wave(t*1.005));
```

```
70s Synth
```

## Notes

Playing with tones is certainly fun, but if we want to make music we need to
turn them into musical notes. That means working with specific frequencies.
Let's start by making _t_ go from 0 to 1 over one second. Then we multiply by
_2PI_, which is the length of one cycle, and then by the frequency we want.
Middle C on a piano has a frequency of 261.626, so the equation looks like this:

```
function tone(t,freq) {
    return sin(t*2*PI*freq);
}
var C = 261.626;
return tone(t,C);
```

and the loop looks like this

```
jsnode.onaudioprocess = function(e) {
    var output = e.outputBuffer.getChannelData(0);
    for (var i = 0; i < output.length; i++) {
        output[i] = music(t);
        t += 1/44000.0;
    }
}
```

Now we want to play some tones in sequence as notes.  To do this we need to
decide how long a note is,  then choose a new frequency every time we hit that
note. Let's start with our music scale with
the [piano frequencies](http://en.wikipedia.org/wiki/Piano_key_frequencies) from
Wikipedia.


```
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
```

The notes array contains four frequencies which create our simple 4 note melody.
Now we need to find the frequency for a particular note as time moves forward.

```
var noteLen = 0.25;
function note(t) {
    var cur = (floor(t/noteLen) % notes.length);
    //cur will cycle through 0,1,2,3 every second.
    return notes[cur];
}
```

This divides _t_ by the length of a note. Since t increase by one per second,
the note length is in fractions of a second. In this case I've set it to one
fourth, or 0.25, seconds per note. Doing a `floor()` of this value gives us an
integer that increases. The mod (%) by `notes.length` makes it wrap around so that
it continually loops through the notes array. Now we can combine the note with
our tone generator like this:


```
function tone(t,freq) {
    return sin(t*2*PI*freq);
}
function music(t) {
    var freq = note(t);
    return tone(t, freq);
}
```

We now have a basic music function. We can modify `noteLength`  to change the
speed or tempo of the melody. We can change the melody notes   in the notes
array. We can change the instrument or feel of the sound   by using a different
function for the tone.

Here's a more familiar melody, with a slower tempo of 0.7 seconds per note.

[Music Notes for Mary Had a Little Lamb](link)

Hmm. That's not quite right is it. We get the notes but there is no gap between
them, so three short notes of the same pitch sound like one long note. Plus, it
doesn't sound like any real instrument. The volume is the same for the whole
part of the note. And there's that annoying click sound at the start of some
notes. Let's fix these problems.

## Attack, Decay, Sustain, Release

In real life the sound of an note is described in terms Attack, Decay, Sustain,
and release. I've made a little visualizer to help see how it works.

[ADSR Visualizer](link)

In the real world a sound doesn't just start out at at full volume. It starts at
zero and builds up to it's full strength. This is called the attack. A short
attack feels more agressive. A long attack feels softer. The decay is when the
volume reduces slightly, if at all, to the main part of the sound. This main
part is the sustain. After the sustain the sound goes back to zero in the
release section. By changing these different parts of the sound we can make the
sound feel completely different. Let's play around a bit in the visualizer.

BTW, this sound tool tracks your settings in the URL, so you can share your
sound with others by simply posting or emailing the URL around.

The ADSR settings combined are called the sound envelope. We can use the
envelope by plugging the ADSR values into an equation like this:

[Mary Had a Little ADSR](link)

That's all there is to audio synthesis. Now it's time for you to play in the
next hands on section.
