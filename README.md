# sc.js - keymaps and keyboard events JavaScript

sc.js provides a way to create different keymaps and bind those to DOM
elements, each keymap consists of sequances of keyboard events and
associated functions.

## Usage

```javascript
var keymap = new Keymap({
    // single keys
    'a': function (ev) {},
    'b': function (ev) {},

    // keys with modifiers
    'ctrl+f': function (ev) {},
    'ctrl+c v': function (ev) {},

    // one key after another
    'd e': function (ev) {},
    'ctrl+f a': function (ev) {},
    'ctrl+g shift+c': function (ev) {}
});

var options = {
    'type'      : 'keypress',
    'propagate' : false,
	'nomatch'   : null
};

SC.add(keymap, document.body, options);
```

## Details

You can set `nomatch` option to fire when no matches were found in any
keymaps.

```javascript
SC.add(keymap, document.body, {
    nomatch: function (ev, code, chr) {
        // nothing matched, do something with event!
    }
});
```

Any number of keymaps can be connected to element.

```javascript
SC.add(keymap1, document.body);
SC.add(keymap2, document.body);
```

You can get a listener function that you need to manually attach to an
event listener.

```javascript
var f = SC.attach(keymap, options);
document.body.addEventListener("keypress", f);
```

## Info about codes

TODO

## Info about events

There are three keyboard events that can occur, in specific order:

- **KeyDown** 
- **KeyPress**
- **KeyUp**

KeyPress is sort of an abstraction on top of KeyDown meaning that
there was a character received from keyboard. KeyPress is only fired
when printable character were pressed and only after KeyDown event.

Example of keys that do not create KeyPress event:

- Shift, Ctrl, Alt
- F1 ... F12
- Arrows

Depending on delay in type settings, there can be multiple KeyDown and
KeyPress events, but only one KeyUp event.
