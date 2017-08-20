Raspberry Pi GPIO Button Event Emitter
======================================

## Application
This is a Node.js package used to generate events from buttons attached to the
GPIO pins on a Raspberry Pi. The package utilizes
[rpi-gpio](https://www.npmjs.com/package/rpi-gpio) to setup the user
specified GPIO pins for input and interupt based monitoring of input changes.


The package implements debounce logic to clean up noisy buttons and generates
a variety of high level button event types (i.e. 'clicked', 'double_clicked')
based on detailed monitoring of button transition states.


Hardware applications with physical buttons can therefore utilize this package
to implement event based user interactions in the application layer without
the need to work out input timing issues or trying to determine user intent.


## Requirements
* Raspberry Pi (with buttons on GPIO pins)
* Node.js runtime
* rpi-gpio package (has additional dependencies, check project page)


## Hardware Notes
GPIO pins with buttons must have a pull up resistor or be configured in the
device tree overlay to use internal pull up.


Buttons must use normally open contacts and pull the GPIO pin low when the
button is pressed.


## Install
Use npm to install the package from the npm repository or directly from the
git repository. Note that the rpi-gpio dependency may have special requirements
that need to be met during installation.

`npm install rpio-gpio-buttons`


## Usage
Using rpio-gpio-buttons in your application requires two steps, create an
instance of the rpio-gpio-buttons object using an array of header pin numbers
and then bind to the desired button events that you expect to use in your user
interface.


i.e. Assuming we have two buttons wired to pins 11 and 13 of the GPIO header
and we have labeled the button on pin 11 as "Up" and pin 13 as "Down" on the
user interface, we may have the following code...

```javascript
// create an instance of the rpio-gpio-buttons object with pins 11 and 13
var buttons = require('rpi-gpio-buttons')([11, 13]);

// bind to the clicked event and check for the assigned pins when clicked
buttons.on('clicked', function (pin) {
  switch(pin) {
    // Up button on pin 11 was clicked
    case 11:
    userClickedUp();
    break

    // Down button on pin 13 was clicked
    case 13:
    userClickedDown();
    break;
  }
});


function userClickedUp() {
  // do something here for up button
  console.log('UP');
}


function userClickedDown() {
  // do something here for down button
  console.log('DOWN');
}
```


## API

### Initialization
**require('rpi-gpio-buttons')([pin number, pin number, ...], {options})**

The rpi-gpio-buttons package exports a function and the function accepts an
array of integers with each integer being the pin number on the GPIO header.
An optional second parameter can be included to set custom timing values for
button events.

```javascript
// create an instance of the rpio-gpio-buttons object with pins 11 and 13
var buttons = require('rpi-gpio-buttons')([11, 13]);
```

### Set Timing
**setTiming(options)**

Timing options can be adjusted after initialization with the setTiming method.
This makes it possible to adjust button event timing without reintializing the
button module.

```javascript
var buttons = require('rpi-gpio-buttons')([11, 13]);

// set 400ms timing value for pressed event
buttons.setTiming({ pressed: 400 });
```


#### Timing
Button events are determined by a set of timing values that control the
amount of time between a button press, release, and any follow up actions.
The values can be adjusted from a rapid button click to a more relaxed click.

Optional timing values may be passed to the module on initialization or later
using the setTiming() method. Timing options include the following values...

##### debounce
The number of milliseconds to allow the input to settle before acting on
changes to the input.

##### pressed
Milliseconds to wait after a button is pressed before settling on a pressed
type event.

##### clicked
Milliseconds to wait after a button is released before settling on a clicked
type event.


### Events
The package provides a variety of high level button events to which an
application can bind. Each event that is emitted includes the pin number that
generated the event.

**on(event, callback)**

Possible events include the following...
* pressed
* clicked
* clicked_pressed
* double_clicked
* released
* button_changed
* button_press
* button_release


#### pressed
The pressed event is emitted when a button is pressed and held down. This will
eventually be followed with a released event when the button is released.

```javascript
buttons.on('pressed', function (pin) {
  console.log('User pressed button on pin ', pin);
});
```

#### clicked
When a button is pressed and released rapidly this is interpreted as a click and
results in the emit of the clicked event.

```javascript
buttons.on('clicked', function (pin) {
  console.log('User clicked button on pin ', pin);
});
```

#### clicked_pressed
If a clicked event is detected and quickly followed by pressing and holding the
button then a clicked_pressed event will be emitted. Eventually when the button
is released then a released event will be emitted.

```javascript
buttons.on('clicked_pressed', function (pin) {
  console.log('User clicked then pressed button on pin ', pin);
});
```

#### double_clicked
If a clicked event is immediately followed with another clicked detection then
it is interpreted as a double click and a double_clicked event is emitted.

```javascript
buttons.on('double_clicked', function (pin) {
  console.log('User double clicked button on pin ', pin);
});
```

#### released
When one of the pressed type events is generated the button is placed in a
state where it will wait for the user to release the pressed button. When this
happens the released event is emitted.

```javascript
buttons.on('released', function (pin) {
  console.log('User released button on pin ', pin);
});
```


#### button_changed
*This is a low level event and is only used in special circumstances.* The button_changed 
event occurs anytime there is a button press or release. This event may be
accompanied by the higher level events that detect user intention, i.e. clicked,
double_clicked, etc.


#### button_press
*This is a low level event and is only used in special circumstances.* When the user
presses a button the button_press event will occur. This may be accompanied by
other high level events that detect user intent.


#### button_release
*This is a low level event and is only used in special circumstances.* A button_release
event occurs whenever the user releases a button. This may be accompanied by
other high level events that detect user intent.
