
const RPiGPIO = require('rpi-gpio');
const EventEmitter = require('events').EventEmitter;
const ButtonEvents = require('button-events');

const Defaults = {
  pins: [], // array of button pin numbers, MODE_BCM == use gpio numbers, MODE_RPI (default) == use 40 pin header pin number
  usePullUp: true, // is button input pulled high
  mode: RPiGPIO.MODE_RPI, // mode to use for rpi-gpio pin numbering
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

  async init (gpio) {
    this.gpio = gpio || await this.gpioSetup();
    await this.initListener();
  }

  // setup rpi-gpio
  async gpioSetup () {
    RPiGPIO.setMode(this.Config.mode);
    // setup each pin as a button input
    for (let i = 0; i < this.Config.pins.length; i++) {
      try {
        await this.buttonSetup(this.Config.pins[i]);
      }
      catch (error) {
        this.emit('error', `Failed to setup button pin ${this.Config.pins[i]}. ${error.message}`);
      }
    }
    return RPiGPIO;
  }

  // configure the specified pin as a button input
  buttonSetup (pin) {
    return new Promise((resolve, reject) => {
      this.emit('debug', `Setup button pin ${pin}.`);
      // setup gpio pin for button use
      RPiGPIO.setup(pin, RPiGPIO.DIR_IN, RPiGPIO.EDGE_BOTH, () => resolve());
    });
  }

  // initialize gpio listener for buttons
  async initListener () {
    for (let i = 0; i < this.Config.pins.length; i++) {
      let pin = this.Config.pins[i];
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
    this.gpio.on('change', (pin, value) => {
      if (!this.buttons[pin]) return;
      this.buttons[pin].gpioChange(value);
    });
  }

  // preread button state before starting listener
  buttonPreread (pin) {
    return new Promise((resolve, reject) => {
      this.emit('debug', `Preread button pin ${pin}.`);
      RPiGPIO.read(pin, (error, value) => {
        if (error) reject(new Error(error));
        else resolve(value);
      });
    });
  }

  destroy () {
    this.gpio.destroy();
  }

};

GPIOButtons.MODE_BCM = RPiGPIO.MODE_BCM;
GPIOButtons.MODE_RPI = RPiGPIO.MODE_RPI;

module.exports = GPIOButtons;
