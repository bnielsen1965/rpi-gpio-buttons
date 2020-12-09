Test Script for Raspberry Pi GPIO Button Event Emitter
======================================================

This test script assumes a circuit with a Raspberry Pi with two normally open button
switches connected to ground and GPIO17 pin and GPIO27 pin with a 1k ohm pull up
resistor on each input.

```
                                         RPi Header
                                          *-----*
            +-------------+-------- +3.3V | 1  2|
            |             |               | 3  4|
            ^             ^               | 5  6|
           (1k) pullup  (1k) pullup       | 7  8|
            v             v               | 9 10|
            +-------------|------- GPIO17 |11 12|
            |             +------- GPIO27 |13 14|
            |             |               |15 16|
            |             |               |17 18|
        |   o             |               |19 20|
      ==|    (no)         |               |21 22|
        |   o          |  o               |23 24|
            |        ==|     (no)        |25 26|
up button   |          |  o               |27 28|
            |             |               |29 30|
            | down button |               |31 32|
            |             |               |33 34|
            |             |               |35 36|
            |             |               |37 38|
            +-------------+---------- GND |39 40|
                                          *-----*
```

When executed the test script will run for 30 seconds and display event information
from start to finish.
