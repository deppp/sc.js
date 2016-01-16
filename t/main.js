

function keyboardEvent(chr, type, modifiers, el) {
    if (! type) type="keypress";
    
    var event = document.createEvent('Event');
    event.initEvent(type, true, true);
    event.keyCode = chr.charCodeAt(0);
    if (modifiers && modifiers.length > 0)
        for(i in modifiers) event[modifiers[i]] = true;

    document.body.dispatchEvent(event);
}

// function simulateKeyEvent(character, type, modifiers) {
//     if (! type) type = "keypress";
//     if (! modifiers) modifiers = "";

//     console.log(modifiers);
    
//     var evt = document.createEvent("KeyboardEvent");
//     evt.initKeyboardEvent(type,
//                           true, true, window,
//                           character, character.charCodeAt(0),
//                           0, modifiers, 0)

//     console.log("yo");
//     evt.ctrlKey=true;
//     console.log(evt);
    
//     evt.keyCode=character.charCodeAt(0);
//     var res = document.body.dispatchEvent(evt);
// }

var ok = function (assert, msg) {
    return function () {
        assert.ok(true, msg);
    };
};

function makeSimpleKeymap(assert, combs) {
    var opts = {}
    for (var idx in combs) {
        opts[combs[idx]] = ok(assert, combs[idx])
    };
    
    return new Keymap(opts);
}

QUnit.test("simple chars keymap", function( assert ) {
    assert.expect(2);

    var combs = ["a", "Z"];
    var keymap = makeSimpleKeymap(assert, combs);
    SC.add(keymap, document.body);
    
    keyboardEvent("a");
    keyboardEvent("Z");
});

QUnit.test("chars with modifiers", function (assert) {
    assert.expect(2);

    var combs = ["ctrl+b", "ctrl+shift+c"]
    var keymap = makeSimpleKeymap(assert, combs);
    SC.add(keymap, document.body);
    
    keyboardEvent("b", undefined, ["ctrlKey"]);
    keyboardEvent("c", undefined, ["ctrlKey", "shiftKey"]);
});

QUnit.test("char combinations", function (assert) {
    assert.expect(3);

    var combs = ["d e", "ctrl+f j", "ctrl+t ctrl+t"];
    var keymap = makeSimpleKeymap(assert, combs);
    SC.add(keymap, document.body);

    keyboardEvent("d");
    keyboardEvent("e");

    keyboardEvent("f", undefined, ["ctrlKey"]);
    keyboardEvent("j");

    keyboardEvent("t", undefined, ["ctrlKey"]);
    keyboardEvent("t", undefined, ["ctrlKey"]);
});

QUnit.test("multiple keymaps", function (assert) {
    assert.expect(2);

    var keymap1 = makeSimpleKeymap(assert, ["g"]);
    var keymap2 = makeSimpleKeymap(assert, ["h"]);
    
    SC.add(keymap1, document.body);
    SC.add(keymap2, document.body);
    
    keyboardEvent("g");
    keyboardEvent("h");
});
