Raspberry Pi GPIO Button Event Emitter
======================================

The rpi-gpio-buttons module is used to develop a rich user interface from simple
button inputs by generating events based on the timing of user interactions with
the buttons. Possible button events include *'clicked'*, *'double_clicked'*, *'pressed'*,
*'released'*, and *'clicked_pressed'*. Complex application interactions can be developed
from a single button input.

The package utilizes [rpi-gpio](https://www.npmjs.com/package/rpi-gpio) to monitor the
GPIO pins for button signals and the [button-events](https://www.npmjs.com/package/button-events) module
to convert those signals into user events.


# Usage

To utilize rpi-gpio-buttons you will need the hardware, i.e. a Raspberry Pi with
buttons attached to the GPIO inputs, and Node.js to develop your application.

1) Install the module as a dependency in your application...
> npm install --save rpi-gpio-buttons

2) In your application load the module and create a configured instance...
```javascript
const RPiGPIOButtons = require('rpi-gpio-buttons');
let buttons = new RPiGPIOButtons({
  pins: [17, 27] // use GPIO 17 and 27 for buttons
});
```

3) Add listeners to the new instance and watch for button events...
```javascript
buttons
  .on('clicked', pin => {
    switch(pin) {
      case 17:
      buttonUp();
      break;

      case 27:
      buttonDown();
      break;
    }
  })
  .on('double_clicked', pin => {
    switch(pin) {
      case 17:
      buttonBack();
      break;

      case 27:
      buttonForward();
      break;
    }
  })
```

4) Initialize the new instance to start monitoring the buttons...
```javascript
buttons
  .init()
  .catch(error => {
    console.log('ERROR', error.stack);
    process.exit(1);
  });
```

For a simple working example see the [test script](test/).


# Class Methods

When using the rpi-gpio-buttons class there are only three methods that an application
will normally deal with, the constructor() when creating a new instance, the on() method
to attach event listeners, and the init() method which asynchronously initializes the
rpi-gpio-buttons instance.


## constructor(config)

The constructor() method is called when a new instance of rpi-gpio-buttons is created.
A configuration object must be passed into the constructor to configure the GPIO pins
used in rpi-gpio and the event logic used in button-events.

The default configuration settings may be acceptable in many cases, however, the configuration
**must include** the *pins* array that defines the GPIO pins used for button inputs.
```javascript
// the pins setting is required!
let buttons = new RPiGPIOButtons({ pins: [17, 18, 27] });
```


## async init()

After creating an rpi-gpio-buttons instance the asynchronous init() method must be
called to intialize rpi-gpio, the button GPIO pins, the GPIO listener and the button
event logic. Once the init() method resolves the button events will become active.
```javascript
let buttons = new RPiGPIOButtons({ pins: [17, 18, 27] });
// initialize asynchronously
buttons
  .init()
  .catch(error => {
    console.log('ERROR', error.stack);
    process.exit(1);
  });
```

**NOTE:** If an rpi-gpio instance is passed to the constructor in the configuration settings
then init() will skip the rpi-gpio initialization but will execute button GPIO pins, the
GPIO listener and the button event logic. See the *gpio* configuration option below.


## on(event, handler)

As with any event emitter a number of listeners can be attached to the rpi-gpio-buttons
instance to listen for events when the user interacts with a button. See the event types
below for more detail.
```javascript
// listen for clicked events
let buttons = new RPiGPIOButtons({ pins: [17, 18, 27] });
buttons.on('clicked', pin => {
  console.log(`Clicked button ${pin}.`);
});
```


## async destroy()

The destroy() method is used to cleanup event listeners and resources associated with
the rpi-gpio-buttons instance once an application no longer requires use of the rpi-gpio-instance.
```javascript
// create rpi-gpio-buttons instance
const RPiGPIOButtons = require('rpi-gpio-buttons');
let buttons = new RPiGPIOButtons({ pins: [17, 27] });

// listen to buttons
buttons
  .on('double_clicked', pin => {
    if (pin === 27) {
      // clean up and exit on double_clicked button pin 27
      buttons.destroy()
        .then(() => {
          process.exit(0);
        })
        .catch(error => {
          console.log(`Error while destroying buttons. ${error.message}`);
          process.exit(1);
        });
    }
  });

// initialize buttons to start listeners
buttons
  .init()
  .catch(error => {
    console.log('ERROR', error.stack);
    process.exit(1);
  });
```

**NOTE:** If an rpi-gpio instance is passed to rpi-gpio-buttons in the constructor configuration
then the destroy() method will only cleanup the event listener and button resources used
by rpi-gpio-buttons, but it will not destroy the rpi-gpio instance. The application that
created the rpi-gpio instance will be responsible for destroying the instance.


# Configuration

When creating a new instance of rpi-gpio-buttons the constructor must be provided a
configuration object which includes at a minimum the *pins* array for the GPIO pins
to which buttons are attached.
```javascript
const RPiGPIOButtons = require('rpi-gpio-buttons');
// minimal configuration must include array of pins, example is one button on GPIO 17
let buttons = new RPiGPIOButtons({ pins: [17] });
```

Optional configuration parameters can be included to control the behavior of the rpi-gpio-buttons
instance. The configuration parameters are as follows...


## pins

**(required)**

An array of pin numbers, either GPIO or header pin number depending on
the rpi-gpio mode selected.
```javascript
const RPiGPIOButtons = require('rpi-gpio-buttons');
// create events for buttons on GPIO17, GPIO18, and GPIO27
let buttons = new RPiGPIOButtons({ pins: [17, 18, 27] });
```


## mode

**(optional)**

Default value: MODE_BCM

Possible value: MODE_BCM or MODE_RPI

When the rpi-gpio-buttons init() method is called it will initialize the rpi-gpio module
and set the pin mode used to associate the numbers in the pin array with GPIO pin numbers.
See the [rpi-gpio](https://www.npmjs.com/package/rpi-gpio) documentation for more details
about the pin modes.
```javascript
const RPiGPIOButtons = require('rpi-gpio-buttons');
// create an rpi-gpio-buttons instance with the rpi-gpio module setup in BCM mode
let buttonsBCM = new RPiGPIOButtons({ mode: RPiGPIOButtons.MODE_BCM, pins: [11] });
```
or
```javascript
const RPiGPIOButtons = require('rpi-gpio-buttons');
// create an rpi-gpio-buttons instance with the rpi-gpio module setup in RPI mode
let buttonsRPI = new RPiGPIOButtons({ mode: RPiGPIOButtons.MODE_RPI, pins: [17] });
```

**NOTE:** When including an existing rpi-gpio instance in the *gpio* configuration field
the mode option the init() will not set the pin mode so the *mode* option is not needed.
See the *gpio* configuration option for more detail.


## gpio

**(optional)**

Default value: undefined

Possible value: set to an existing rpi-gpio instance

If the application has already created an instance and initialized rpi-gpio then it
can be passed to rpi-gpio-buttons in the configuration *gpio* field. This ensures that the
application and rpi-gpio-buttons do not create competing instances of the rpi-gpio module.
```javascript
const RPiGPIO = require('rpi-gpio');
const RPiGPIOButtons = require('rpi-gpio-buttons');

// setup the application rpi-gpio
RPiGPIO.setMode(RPiGPIO.MODE_BCM);

// create an rpi-gpio-buttons instance that uses the existing rpi-gpio instance
let buttons = new RPiGPIOButtons({
  pins: [17, 18, 27], // define pins used for buttons
  gpio: RPiGPIO       // use the applications rpi-gpio instance
});
// initialize rpi-gpio-buttons
buttons.init()
  .then(() => {
    console.log('buttons is initialized, events are active')
  })
  .catch(error => {
    console.log(`An error occured during buttons init(). ${error.message}`);
  });
```


## usePullUp

**(optional)**

Default value: true

Possible value: true or false

The *usePullUp* boolean is passed to the [button-events](https://www.npmjs.com/package/button-events) module
and is used to determine the expected signal value when the button is pressed and when
it is released.

When *usePullUp* is true it is assumed that the button input has a pull up resistor and
and normally open button switch that will produce a value of 0 when the button is pressed
and a value of 1 when the button is released.

If a pull down resistor is used in the circuit, or the button hardware is normally closed,
then a *usePullUp* setting of false will assume that a button press value is 1 and the
button release value is 0.


## timing

**(optional)**

Default:
```javascript
{
  debounce: 30, // 30 ms debounce
  pressed: 200, // 200 ms in pressed state == button pressed
  clicked: 200 // 200 ms after released == button clicked
}
```

The timing settings are passed to the [button-events](https://www.npmjs.com/package/button-events) module
and are used to configure the signal debounce and the timing logic used to trigger the
various button events.

One or more of the timing settings can be passed into the rpi-gpio-buttons constructor
to override each timing parameter.


## Disable debounce

If a debounce circuit or algorithm has already been applied to the button signal then
it may be desirable to disable the redundant debounce logic in the button-events module.
Setting the timing.debounce value to 0 will disable the debounce logic.
```javascript
const RPiGPIOButtons = require('rpi-gpio-buttons');
// set the timing debounce value to 0 so debounce is disabled
let buttons = new RPiGPIOButtons({
  pins: [17, 18, 27],
  timing: { debounce: 0 }
});
```


# Events

The package provides a variety of high level button events to which an application can
bind. Each event will include the pin number to which the event is associated.

Possible events include the following...

**Events that indicate user intent**
- pressed
- clicked
- clicked_pressed
- double_clicked
- released

**Unified event for user intent, passes the user event state**
- button_event

**Low level events**
- button_changed
- button_press
- button_release


## pressed

The pressed event is emitted when a button is pressed and held down. This will eventually
be followed with a released event when the button is released.

```javascript
buttons.on('pressed', pin => {
  console.log(`User pressed button ${pin}.`);
});
```


## clicked

When a button is pressed and released rapidly this is interpreted as a click and results
in the emit of the clicked event.

```javascript
buttons.on('clicked', pin => {
  console.log(`User clicked button ${pin}.`);
});
```


## clicked_pressed

If a clicked event is detected and quickly followed by pressing and holding the button
then a clicked_pressed event will be emitted. Eventually when the button is released
then a released event will be emitted.

```javascript
buttons.on('clicked_pressed', pin => {
  console.log(`User clicked then pressed button ${pin}.`);
});
```


## double_clicked

If a clicked event is immediately followed with another clicked detection then it is
interpreted as a double click and a double_clicked event is emitted.

```javascript
buttons.on('double_clicked', pin => {
  console.log(`User double clicked button ${pin}.`);
});
```


## released

When one of the pressed type events is generated the button is placed in a state where
it will wait for the user to release the pressed button. When this happens the released
event is emitted.

```javascript
buttons.on('released', pin => {
  console.log(`User released button ${pin}.`);
});
```


## button_event

The button_event event is a unified event triggered in combination with the user intent
events and will pass the value of the user intent as an argument. The types passed in
the *'button_event'* include *'pressed'*, *'clicked'*, *'clicked_pressed'*, *'double_clicked'*,
and *'released'*.

```javascript
button.on('button_event', (type, pin) => {
  switch (type) {
    case 'clicked':
    console.log(`User clicked ${pin}.`);
    break;

    case 'double_clicked':
    console.log(`User double clicked ${pin}.`);
    break;
  }
});
```


## button_changed

This is a low level event and is only used in special circumstances. The button_changed
event occurs anytime there is a button press or release. This event may be accompanied
by the higher level events that detect user intention, i.e. clicked, double_clicked, etc.


## button_press

This is a low level event and is only used in special circumstances. When the user presses
a button the button_press event will occur. This may be accompanied by other high level
events that detect user intent.


## button_release

This is a low level event and is only used in special circumstances. A button_release
event occurs whenever the user releases a button. This may be accompanied by other high
level events that detect user intent.


## error

The error event is used to signal non-throwable errors that may occur during initialization
or operation of the rpi-gpio-buttons module.


## debug

During initialization *debug* events will be emitted that can be used to assist in trouble
diagnosis during development and operation.
