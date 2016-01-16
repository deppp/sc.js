
(function (win, doc) {
    var SC = {
        _bindings: []
    };

    SC.defaults = {
	'type'             : 'keypress',
	'propagate'        : false,
        'nomatch'          : null
    };
    
    var special_keys = {
        'ctrl': 3000, 'shift':9000, 'alt': 15000, 'meta': 27000,
        
	'esc':27, 'escape':27, 'tab':9, 'space':32,
	'return':13, 'enter':13, 'backspace':8,
	
	'scrolllock':145, 'scroll_lock':145, 'scroll':145,
	'capslock':20, 'caps_lock':20, 'caps':20,
	'numlock':144, 'num_lock':144, 'num':144,
	
	'pause':19, 'break':19,
	
	'insert':45, 'home':36, 'delete':46, 'end':35,
	
	'pageup':33, 'page_up':33, 'pu':33,
	'pagedown':34, 'page_down':34, 'pd':34,
	
	'left':37, 'up':38, 'right':39, 'down':40,
	
	'f1':112, 'f2':113, 'f3':114, 'f4':115, 'f5':116, 'f6':117,
        'f7':118, 'f8':119, 'f9':120, 'f10':121, 'f11':122, 'f12':123
    };
    
    function iterobj (fun, obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                fun(prop, obj[prop]);
            }
        }
    } 

    function bind (el, func, type) {
        if(el.addEventListener) 
            el.addEventListener(type, func, false);
        else if(el.attachEvent) 
            el.attachEvent('on' + type, func);
        else
            el['on' + type] = func;
    };

    function consopt (opt) {
        if (! opt)
            opt = SC.defaults;
        else
            iterobj(function (prop, value) {
                if(typeof opt[prop] === 'undefined')
                    opt[prop] = value;
            }, SC.defaults);
        
        return opt;
    };

    function resolve (el, doc) {
        if (! isElement(el)) {
            if (typeof el === 'string') {
                el = doc.getElementById(el);
            } else if (isFunction(el)) {
                el = el.call();
            }
        }

        return el;
    };

    function isNode (o) {
        return (
            typeof Node === "object" ? o instanceof Node : 
                o &&
                typeof o === "object" &&
                typeof o.nodeType === "number" &&
                typeof o.nodeName==="string"
        );
    }

    //Returns true if it is a DOM element    
    function isElement (o) {
        return (
            typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
        );
    }

    function isFunction (obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    }

    // Computes the code for sequence, any modifiers are summed with
    // the key code
    function computeCode (seq) {
        var keys = seq.split('+');
        var res  = 0;
        
        for (var i = 0; i < keys.length; i++) {
            if (special_keys[keys[i]])
                res += special_keys[keys[i]];
            else
                res += keys[i].charCodeAt(0);
        }
        
        return res;
    };
    
    //
    
    function Keymap (defs) {
        var self = this;
        
        self._ev = {};
        self._waiting = false;
        
        iterobj(function (comb, cb) {
            var seq = comb.split(" "),
                current = self._ev;
            
            for (var i = 0; i < seq.length; i++) (function (i) {
                var ch = computeCode(seq[i]);

                if (current[ch])
                    current = current[ch];
                else {
                    var obj = { };
                    current[ch] = obj;
                    current = obj;
                }
            })(i);
            
            if (! current['callback']) {
                current['callback'] = [cb];
            } else {
                current['callback'].push(cb);
            }
        }, defs);
    }

    Keymap.prototype.send = function (key) {
        this._send(computeCode(key), {}, {});
    };
    
    Keymap.prototype._send = function (code, opt, ev) {
        var self = this;
        var map = self._waiting || self._ev;
        
        var fire = function() {
            self._waiting = false;
            
            for (var cb in map[code]['callback'])
                map[code]['callback'][cb](ev);                        
            
            if (opt['propagate'] != true) {
	        //e.cancelBubble is supported by IE - this will kill the bubbling process.
	        ev.cancelBubble = true;
	        ev.returnValue = false;
	        
	        //e.stopPropagation works in Firefox.
	        if (ev.stopPropagation) {
		    ev.stopPropagation();
		    ev.preventDefault();
	        }
                
	        return false;
	    }
        };

        if (map[code]) {
            var next = false;
            
            for (var prop in map[code])
                if (prop && map[code].hasOwnProperty(prop) && prop != 'callback') {
                    next = true;
                    break;
                }
            
            if (next) {
                if (map[code]['callback']) {
                    var tid = setTimeout(fire, 1000);
                    self._tid.push(tid);
                }
                
                self._waiting = map[code];
            } else {
                fire();
            }
            
            return true;
        } else {
            self._waiting = false;
            return false;
        }
    };

    function iter_bindings(fun) {
        var b = SC._bindings;
        for (var i = 0; i < b.length; i++) {
            fun(b[i]);
        }
    }
    
    function find_keymap (el, type) {
        var b = SC._bindings;
        for (var i = 0; i < b.length; i++) {
            if (b[i].el == el && b[i].type == type)
                return b[i].keymaps;
        }
        
        return null;
    }

    function build_invoke(keymap, opts) {
        return function (ev) {
            var code, orig_code;
            ev = ev || win.event;

            var handled = false;
            if (event.keyCode !== undefined) {
                code = ev.keyCode
            } else if (event.charCode !== undefined) {
                code = ev.charCode
            } else if (ev.which !== undefined) {
                code = ev.which
            } else if (ev.key !== undefined) {
                code = ev.key.charCodeAt(0);
            } else if (event.keyIdentifier !== undefined) {
                code = ev.keyIdentifier.charCodeAt(0);
            }
            
            orig_code = code;
            
            // [TODO] This are Ctrl, Shift, Alt, etc.
            // this happens on keyDown event when single Ctrl is
            // pressed.
            if (code == 16 || code == 17 || code == 18)
                return;
            
            if (ev.ctrlKey)   code += special_keys['ctrl'];
            if (ev.shiftKey)  code += special_keys['shift'];
            if (ev.altKey)    code += special_keys['alt'];
            if (ev.metaKey)   code += special_keys['meta'];

            var matched = false;
            
            for (idx in keymap) {
                var matched = keymap[idx]._send(code, opts, ev);
                if (matched)
                    break;
            }

            if (! matched && opts.nomatch) {
                var chr = String.fromCharCode(orig_code);
                opts.nomatch.call(opts.nomatch, ev, code, chr);
            }
        };
    }
    
    SC.attach = function (keymap, opts) {
        opts = consopt(opts);
        keymap = (keymap.constructor === Array) ? keymap : [ keymap ];
        
        return build_invoke(keymap, opts);
    };

    SC.add = function (keymap, el, opts) {
        opts = consopt(opts);
        el   = resolve(el, doc);
        
        var keymaps = find_keymap(el, opts.type);

        if (keymaps) {
            keymaps.push(keymap);
        }
        else {
            keymaps = [ keymap ];
            SC._bindings.push({
                el: el,
                type: opts.type,
                keymaps: keymaps
            });

            var invoke = build_invoke(keymaps, opts);
            bind(el, invoke, opts.type);
        }
    };
    
    SC.remap = function (keymap, el) {
        el = resolve(el, doc);
        
    };
    
    SC.remove = function (keymap, el, type) {
        // type = type || SC.defaults['type'];
        
        // var b = SC._bindings;
        // var matches = [];

        // var filter_keymap = function (binding) {
        //     var keymaps = filter(function (km) {
        //         return keymap != km;
        //     }, binding.keymaps);
        //     binding.keymaps = keymap;
        // }

        // var create_matcher = function (name, vr) {
        //     return function (b) {
        //         if (b[name] == vr) return b
        //     };
        // };

        // var match_el = create_matcher('el', el);
        // var match_type = create_matcher('type', type);
        
        // if (el && type) {
        //     iter(filter_keymap,
        //          map(match_type,
        //              map(match_el, SC._bindings)))
        // } else if (el) {
        //     iter(filter_keymap,
        //          map(match_el, SC._bindings))
        // } else if (type) {
        //     iter(filter_keymap,
        //          map(match_type, SC._bindings))
        // } else {
        //     iter(filter_keymap, SC._bindings);
        // }
    };
    
    win.Keymap = Keymap;
    win.SC = SC;

})(window, document);
