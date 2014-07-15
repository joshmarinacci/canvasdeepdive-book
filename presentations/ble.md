
### Bluetooth Low Energy
##  Big Progress for Small Consumption

Josh Marinacci

Advanced Technologies, Nokia

---

### 60 second summary of wireless technology

@note Here we go. in 60 seconds everything you ever needed to know
about wireless technology for mobile devices


---

### In The Beginning


---

## Infra Red

!Image of Palm V

@note Infrared was the cheapest and easiest way to transmit data between mobile
battery powered devices. It was awesome except it was slow and required line of
sight. But you could transfer phone contacts, so that was cool.

http://en.wikipedia.org/wiki/Infrared#Communications


---

### Bluetooth 1994



* Bluetooth 1.0 (1994) 0.7 Mb
* Bluetooth 2.0 (2004) 3.0 Mb
* Bluetooth 3.0 (2009) 24 Mb (by cheating w/ WiFi)

http://en.wikipedia.org/wiki/Bluetooth

@note Next up came Bluetooth (1994), which didn't require line of sight and was
faster, but cost a lot more and killed your battery life. And the specs were
very complicated. But it did let you connect your phone's address book to your
car and make voice calls. It could also do other cool things like transfer files
assuming your carrier wasn't Verizon who blocked it. It's been updated over the
years with more features and speeds, but essentially the same.


---

### RFID
## one way barcode


http://news.bbc.co.uk/2/hi/uk_news/england/bristol/somerset/8011998.stm

http://en.wikipedia.org/wiki/RFID

@note Next came no-contact wireless communication, powered or unpowered. a few meters
to 100s of meters if powered. low data rate. essentially wireless barcodes. they
are getting smaller and cheaper.

---

###  NFC: Near Field Communication
## 2004: two way barcodes

http://en.wikipedia.org/wiki/Near_field_communication

@note NFC is fancier with two way communication, Mainly used in commerce applications.
Notably, Apple devices do not support it, but Google has really pushed it.


---

### Why They Suck


@note What is wrong with these? Why did we need something better.  For a lot of use
cases you don't need high speed, but you do need very low power consumption
while still being two way, but without requiring line of sight. And we want
something that works on every mobile OS, and that doesn't require being a part
of some special developer program. That's what Bluetooth Low Energy gives us.


---

### Bluetooth 4.0
## 2010: Bluetooth Low Energy

@note Finally we get to Bluetooth 4.0 (2010). Everything in BT 3.0 + Bluetooth
Low Energy (also called Bluetooth Smart).  BT4.0 mandates the BLE part, so
basically everything coming out today has BLE support out of the box. Most
laptops and desktops, Win Phone, iOS, Android. It's everywhere.

@note Today I'm going to talk just about Bluetooth Low Energy and why it's
awesome.


---

### Bluetooth Low Energy

http://en.wikipedia.org/wiki/Bluetooth_low_energy

@note As the name would suggest, Bluetooth Low Energy is designed around using
very little power.  It can be used all the time on your phone without killing
your battery. It can be used with embedded sensors that last up to a year on
a single battery. To accomplish this the BT guys had to design a very different
kind of protocol.  While it does use the same frequencies it doesn't use
streams of data. Rather it has a bunch of key value pairs called Characteristics.
These are grouped into sets called profiles. It is these profiles that let
you communicate between devices.



---

### Last Year

@note The underlying chips for BLE are fairly cheap, but not easy to work with. You
have to be a real embedded systems programmer to program them. You also needed a
very expensive compiler. A year ago there was only one or two Arduino compatible
boards for BLE. They were limited in features and very expensive.   You also
couldn't do much with them because smartphones didn't have good support. At the
time only a few of the iPhones had support and iOS 6 was buggy. Only a few
Android phones supported it and they used vendor specific APIs.  Windows Phone
didn't support it at all even though most of Nokia's Lumia devices had the
hardware to support it.


---

### This Year

Today life in the BLE world is so much better. There are tons of Arduino
compatible breakout boards, the price keeps going down, and all of the Smartphones
OSes support it.  iOS 7 has very good support, all Apple devices have it built in,
even their desktops. With JellyBean Android supports it. With Windows Phone 8.1
those Lumia devices support it. There is also pretty good support on desktop
oses. You can even run it on a Raspberry Pi with a cheap dongle from Amazon.


---

### Next Year

@note Pretty much everywhere. Since it's built into the 4.0 BT spec pretty much every
smart device is going to get it. And since the chips are cheap, pretty much
every dumb device will use it as it's communication system. Thermostats, heart
rate sensors, you name it it'll have BLE in it.


---
###  Buy Now

@note So what can you buy today for Arduino development? A lot, actually.  There's a ton
of shields and devices available for under 50 bucks, some significantly under. I'll
break them into three categories.

* Arduino shields & breakout boards
* BLE built in: Arduino compatible
* USB adapters: desktop & Raspberry Pi


---

### List of Shields


---

### List of BLE built ins


---

### List of USB dongles


---

### Simple Arduino Demo

I mentioend that BLE uses characteristics, called key value pairs. These
are powerful but complicated to use at runtime from an Arduino. To make
it simpler most BLE board vendors have created a serial port profile and
given you some library code to hide the details. This means you can use
your BLE board just like another serial port.  Here's some example code

```
example code to read
```

To show how this works I've put together a simple robot using an Arduino
Uno, the Red Bear Labs BLE shield, and a 2WD robot chassis from DF Robots.

You can see that I stacked the shields on to the Uno, then screwed it into the
robot. The Arduino code is extremely simple. It just accepts simple commands
to start and stop the motors.

```
robot code
```

On the phone side I wrote a simple iOS app. It uses the Red Bear iOS library
to communicate. When I click a button it sends the command.

```
iOS code to send 'Left motor on command'
```

---

### Robot Time

---

So this is pretty cool, but I could already do this with a physical serial cable.
The only difference is the wires. But what about something that really needs
the low power, like a smartwatch.  Here's a quick one I built using
the Xadow system from Seeedstudio.

---

### Xadow Modules

@note Xadow is a system of tiny modules that connect using an I2C bus over a
flexible ribbon cable. The main module is basically an arduino leonardo with a
built in lipo charger circuit and a lipo battery, all for twenty bucks.  You
then buy modules for the features you want to add, like an LED grid, an accelerometer,
and of course a bluetooth LE module.

Xadow's BLE module works the same way as the Red Bear one. It emulates a serial
port over BLE.  I've built a simple one here in a 3d printed case which can talk
to my phone. From the phone I can set the current time, set an alarm, and send
simple messages. It can also tell me the current battery state. What it can't do
is be made aware of system wide messages on my phone. If i get a facebook or
twitter notification I can't send it to my smart watch. Why is that?

---

### Custom Profiles

@note so now we get into one of the big problems with BLE today. All of these
arduino compatible devices use a serial profile to emulate a regular serial port.
While it does make it easy to code, it's not as power efficient as a proper
BLE profile. It also doesn't let you access platform specific profiles. On iOS
Apple implemented a  new profile called Apple Notification Center Service, or ANCS.
This provides system wide access to notifications, but to use it your BLE device
must support custom profiles.  Most of the Arduino boards do not.

---
It turns out that supporting custom profiles is rather difficult. There is
really only about two different underlying BLE chips. One from TI and one from
Nordic. Every board you find will be built on top of one of these. These chips
have to be reprogrammed to support different profiles. TI's has it's own CPU, so
in theory you would't need an Arduino at all, but you have to use a 4000$
compiler to program it. In practice a board using this chip will be
pre-programmed with the one serial profile the board maker supports, then wired
to the arduino through pins. The Nordic chip is similar, though at least their
windows only compiler is free with their 100$ SDK. Again, the board you get is
probably pre-programed to support one profile.

To support a new profile like ANCS you'd need to dig into the internals of the BLE
chip and write your own support. Not for the timid. That's why almost every
board uses a serial port profile.

But, all is not lost. Thigns are getting better.

Some boards are built on BlueGiga chips. While BG uses the TI chip underneath
they wrote their own BLe system from scratch. The compiler is free , though
windows only.  You can define new profiles using XML and their BG Script
language. I found an ANCS implementation on github here and was able to
make an LED blink when a tweet came in.  I used this BG breakout board.

Nordic is has started to embrace the Arduino and introduced their own arduino
sdk. You still need to use windows for one part of the compile step, but it
works under Wine or virtual box, and you only need to do that part when you
change the BLE profile.  Most of the newer Arduino boards are based on this chip.

---

### Integrated Boards

@Another option is to go with a dedicated BLE board. These are board which are both
the arduino and BLE radio in one, rather than attaching to an existing arduino.
They are mostly not-AVR based, so some standard Arduino libraries may not work with them.

* BlendMicro
* Bean from Punch Through
* RFDuino

---

@note And another option is to buy a board where the maker has done the hard work of creating
a custom profile for you. Red Bear Labs and Dr. Kroll have provided alternative
firmware for ANCS and iBeacon support.
---

And finally, you can reprogram the board yourself. The nordic SDK isn't that hard to use
and there have been some recent efforts to better document the process.  All in all
BLE is getting better and easier to use.

---
One thing I'd like to mention is that almost every board uses their own serial port
profile and implementation. This is a lot of duplicated effort. I'm trying to work
with some of the BLe board vendors to create a standard serial profile that
we all could share. please contact me for more info.


---

   * slide: List the others I’ve got in my google docs spreadsheet
   * mention the nodeJS bindings. show some example code which writes sensor data to a web browser with web sockets, from BLE shield + temp sensor + solar + battery in an otter box.
