
const EventEmitter = require('events').EventEmitter;
const ButtonEvents = require('button-events');

// gpio modes from rpi-gpio
const MODE_BCM = 'mode_bcm';
const MODE_RPI = 'mode_rpi';

const Defaults = {
  mode: MODE_BCM, // mode to use for rpi-gpio pin numbering
  pins: [], // array of button pin numbers, MODE_BCM == use gpio numbers, MODE_RPI (default) == use 40 pin header pin number
  usePullUp: true, // is button input pulled high
  timing: {
    debounce: 30, // 30 ms debounce
    pressed: 200, // 200 ms in pressed state == button pressed
    clicked: 200 // 200 ms after released == button clicked
  }
};

class GPIOButtons extends EventEmitter {
  constructor (Config) {
    super();
    this.buttons = {};
    this.Config = Object.assign({}, Defaults, Config);
    this.Config.timing = Object.assign({}, Defaults.timing, this.Config.timing);
  }

  async init () {
    this.emit('debug', 'Initialize rpi-gpio-buttons.');
    this.gpio = this.Config.gpio || this.gpioSetup();
    await this.gpioButtonsSetup();
    await this.initListener();
  }

  // setup rpi-gpio
  gpioSetup () {
    this.emit('debug', 'Setup rpi-gpio.');
    let gpio = require('rpi-gpio');
    gpio.setMode(this.Config.mode);
    return gpio;
  }

  // setup gpio button pins
  async gpioButtonsSetup () {
    this.emit('debug', 'Setup gpio button pins.');
    // setup each pin as a button input
    for (let i = 0; i < this.Config.pins.length; i++) {
      try {
        await this.buttonSetup(this.Config.pins[i]);
      }
      catch (error) {
        this.emit('error', `Failed to setup button pin ${this.Config.pins[i]}. ${error.message}`);
      }
    }
  }

  // configure the specified pin as a button input
  buttonSetup (pin) {
    return new Promise((resolve, reject) => {
      this.emit('debug', `Setup button pin ${pin}.`);
      // setup gpio pin for button use
      this.gpio.setup(pin, this.gpio.DIR_IN, this.gpio.EDGE_BOTH, () => resolve());
    });
  }

  // initialize gpio listener for buttons
  async initListener () {
    for (let i = 0; i < this.Config.pins.length; i++) {
      let pin = this.Config.pins[i];
      this.emit('debug', `Initialize listener for button pin ${pin}.`);
      try {
        let value = await this.buttonPreread(pin);
        let buttonEvents = new ButtonEvents(Object.assign({}, this.Config, { preread: value }));
        // pass along all pin events
        buttonEvents
          .on('button_event', type => {
            this.emit('button_event', type, pin);
            this.emit(type, pin);
          })
          .on('button_changed', () => this.emit('button_changed', pin))
          .on('button_press', () => this.emit('button_press', pin))
          .on('button_release', () => this.emit('button_release', pin));
        this.buttons[pin] = buttonEvents;
      }
      catch (error) {
        this.emit('error', `Failed preread and button events setup on pin ${pin}. ${error.message}`);
      }
    }
    // listen for changes on gpio
    this.emit('debug', `Listen for changes to gpio pins.`);
    this.gpio.on('change', (pin, value) => {
      if (!this.buttons[pin]) return;
      this.buttons[pin].gpioChange(value);
    });
  }

  // preread button state before starting listener
  buttonPreread (pin) {
    return new Promise((resolve, reject) => {
      this.emit('debug', `Preread button pin ${pin}.`);
      this.gpio.read(pin, (error, value) => {
        if (error) reject(new Error(error));
        else resolve(value);
      });
    });
  }

  destroy () {
    return new Promise((resolve, reject) => {
      this.emit('debug', 'destroy() called, cleanup buttons.');
      Object.keys(this.buttons).forEach(be => this.buttons[be].cleanup());
      if (this.Config.gpio) {
        // do not destroy the rpi-gpio that we did not create
        resolve();
        return;
      }
      this.emit('debug', 'Destroy gpio.');
      this.gpio.destroy(error => {
        if (error) {
          this.emit('error', error);
          reject(new Error(error));
        }
        else resolve();
      });
    });
  }

};

GPIOButtons.MODE_BCM = MODE_BCM;
GPIOButtons.MODE_RPI = MODE_RPI;

module.exports = GPIOButtons;
