
const RPiGPIOButtons = require('../index.js'); // normally this would be require('rpi-gpio-buttons');
const PIN_UP = 17;
const PIN_DOWN = 27;


let buttons = new RPiGPIOButtons({ pins: [PIN_UP, PIN_DOWN] });

buttons
.on('error', error => {
  console.log('ERROR', error);
})
.on('debug', debug => {
  console.log('DEBUG', debug);
})
.on('clicked', function (pin) {
  switch(pin) {
    case PIN_UP:
    userClickedUp();
    break;

    case PIN_DOWN:
    userClickedDown();
    break;
  }
})
.on('button_event', (type, pin) => {
  console.log(`button_event ${type} on ${pin}`)
});

function userClickedUp () {
  console.log('UP');
}

function userClickedDown () {
  console.log('DOWN');
}

buttons.init()
.then(() => {
  setTimeout(() => {
    buttons.destroy()
      .then(() => {
        console.log('Destroy complete.');
        process.exit(0);
      })
      .catch(error => {
        console.log(`Destroy error, ${error.stack}`);
        process.exit(1);
      })
  }, 30000);
})
.catch(error => {
  console.log('ERROR', error.stack);
  process.exit(1);
});
