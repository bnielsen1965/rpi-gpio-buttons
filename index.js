// index.js
// rpi-gpio-buttons
// Use rpi-gpio to monitor gpio inputs with push buttons.
// Provides debounce and emits events for pressed, clicked, clicked and
// pressed, double clicked, and released.
//
// Inputs are assumed to be pull up with a normally open button. When a button
// is pressed it should take the gpio pin low.

/*jshint esversion: 6*/

const events = require('events');
const gpio = require('rpi-gpio');

const STATE_INIT = 0;
const STATE_IDLE = 1;
const STATE_PRESSED = 2;
const STATE_CLICKED = 3;
const STATE_CLICKED_PRESSED = 4;
const STATE_DOUBLE_CLICKED = 5;
const STATE_RELEASE_WAIT = 6;

const DEBOUNCE_MS = 30;
const PRESSED_MS = 200;
const CLICKED_MS = 200;

// pins should be an array of integers for each gpio header pin
module.exports = function (pins, options) {
  options = options || {};
  var emitter = new events.EventEmitter();
  var buttons = {};
  var timing = {
    debounce: options.debounce || DEBOUNCE_MS,
    pressed: options.pressed || PRESSED_MS,
    clicked: options.clicked || CLICKED_MS
  };

  // setup each pin as a button input
  pins.forEach(function (pin) {
    buttonSetup(pin);
  });

  // watch for gpio change events
  gpio.on('change', gpioChange);

  // process gpio change event
  function gpioChange(pin, value) {
    // check if pin is a button and is not in init state
    if (buttons[pin] && STATE_INIT !== buttons[pin].state) {
      // track the last seen value for this button
      buttons[pin].last = !value; // invert for pull up
      // if button is not in debounce mode then start debounce
      if (!buttons[pin].debounce) {
        debounceStart(pin, value);
      }
    }
  }

  // start the debounce process on a button press / release
  function debounceStart(pin, value) {
    // track the current value and start the debounce
    buttons[pin].value = !value; // invert for pull up
    buttons[pin].debounce = true;
    setTimeout(function () { debounceComplete(pin); }, timing.debounce);
  }

  // complete the debounce process on a button press / release
  function debounceComplete(pin) {
    emitter.emit('button_changed', pin);
    if (buttons[pin].last) {
      // debounced button press
      emitter.emit('button_press', pin);
      switch (buttons[pin].state) {
        case STATE_CLICKED:
        // transition from a clicked state to clicked and pressed
        clearTimeout(buttons[pin].emitTimer);
        buttons[pin].state = STATE_CLICKED_PRESSED;
        break;

        default:
        // begin the pressed state
        clearTimeout(buttons[pin].emitTimer);
        buttons[pin].state = STATE_PRESSED;
        break;
      }
      // delay to allow for further state transition
      buttons[pin].emitTimer = setTimeout(function () { emitState(pin); }, timing.pressed);
    }
    else {
      // debounced button release
      emitter.emit('button_release', pin);
      switch (buttons[pin].state) {
        case STATE_PRESSED:
        // transition from pressed to clicked
        clearTimeout(buttons[pin].emitTimer);
        buttons[pin].state = STATE_CLICKED;
        // delay to allow for further state transition
        buttons[pin].emitTimer = setTimeout(function () { emitState(pin); }, timing.clicked);
        break;

        case STATE_CLICKED_PRESSED:
        // transition from clicked and pressed to double clicked
        clearTimeout(buttons[pin].emitTimer);
        buttons[pin].state = STATE_DOUBLE_CLICKED;
        // no further transitions
        emitState(pin);
        break;

        case STATE_RELEASE_WAIT:
        // transition from release wait to idle by emitting event
        clearTimeout(buttons[pin].emitTimer);
        emitState(pin);
        break;
      }
    }

    buttons[pin].debounce = false;
  }

  // emit event for the current button state
  function emitState(pin) {
    switch (buttons[pin].state) {
      case STATE_PRESSED:
      // emit event and transition to release wait
      emitter.emit('pressed', pin);
      buttons[pin].state = STATE_RELEASE_WAIT;
      break;

      case STATE_CLICKED:
      // emit event and transition to idle
      emitter.emit('clicked', pin);
      buttons[pin].state = STATE_IDLE;
      break;

      case STATE_CLICKED_PRESSED:
      // emit event and transition to release wait
      emitter.emit('clicked_pressed', pin);
      buttons[pin].state = STATE_RELEASE_WAIT;
      break;

      case STATE_DOUBLE_CLICKED:
      // emit event and transition to idle
      emitter.emit('double_clicked', pin);
      buttons[pin].state = STATE_IDLE;
      break;

      case STATE_RELEASE_WAIT:
      // emit event and transition to idle
      emitter.emit('released', pin);
      buttons[pin].state = STATE_IDLE;
      break;
    }

    buttons[pin].emitTimer = null;
  }

  // configure the specified header pin as a gpio button
  function buttonSetup(pin) {
    // create data structure for button state
    buttons[pin] = {
      state: STATE_INIT,
      debounce: false,
      value: null,
      last: null,
      emitTimer: null
    };

    // setup gpio pin for button use
    gpio.setup(pin, gpio.DIR_IN, gpio.EDGE_BOTH, function () {
      // get the current button state
      gpio.read(pin, function (err, val) {
        if (err) console.log('ERR: ', err);
        else {
          buttons[pin].value = !val;
          buttons[pin].state = (!val ? STATE_PRESSED : STATE_IDLE);
        }
      });
    });
  }

  // set new timing values for button events
  function setTiming(options) {
    timing.debounce = options.debounce || timing.debounce;
    timing.pressed = options.pressed || timing.pressed;
    timing.clicked = options.clicked || timing.clicked;
  }

  // export functions
  emitter.setTiming = setTiming;
  return emitter;
};
