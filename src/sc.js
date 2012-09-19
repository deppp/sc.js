/*\
  VERSION: 0.03
  Author: Mikhail Maluyk <mikhail.maluyk@gmail.com>
  License: MIT
 */

var SC = (function () {
    var special_keys = {
        'ctrl': 1000, 'shift':1001, 'alt': 1002, 'meta': 1003,
        
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
        
    var defopt = {
	'type':             'keydown',
        'tag':              'default',
	'propagate':        false,
	'disable_in_input': false,
	'target':           document,
	'keycode':          false,
    };

    // Bind function $func to element $el on event $opt['type']
    // which is usually some key action
    function bind (el, func, opt) {
        
        if(el.addEventListener) 
            el.addEventListener(opt['type'], func, false);
        else if(el.attachEvent) 
            el.attachEvent('on' + opt['type'], func);
        else
            el['on' + opt['type']] = func;
    };

    // Options construction: copying defults into $opt
    // also doing some check here
    function consopt (opt) {
        (! opt) ? opt = defopt : (function () {
            for(var def in defopt) {
		if(typeof opt[def] == 'undefined')
                    opt[def] = defopt[def];
	    }
        })();
        
        var el = opt.target;
	if (typeof opt.target == 'string')
            el = document.getElementById(opt.target);
        
        opt.el = el;
        
        return opt;
    };

    function compute_code (seq) {
        var keys = seq.split('+');
        var res  = 0;
        
        for (var i = 0; i < keys.length; i++) {
            if (special_keys[keys[i]])
                res += special_keys[keys[i]];
            else
                res += keys[i].toUpperCase().charCodeAt(0);
        }
        
        return res;
    };
    
    return {
        _el: {},
        _ev: {},
        
        _remap: [],
        _search: null,
        
        _tid: [],
        _waiting: false,

        nomatch: null,
        
        _build_structure: function (into, data, opt) {
            for (var comb in data) {
                var seq = comb.split(" ");
                var current = into;
                for (var i = 0; i < seq.length; i++) (function (i) {
                    var ch = compute_code(seq[i]);
                    if (current[ch])
                        current = current[ch]
                    else {
                        var obj = { };
                        current[ch] = obj;
                        current = obj;
                    }
                })(i);

                if (opt['tie']) current['tie'] = true;
                
                var cb = data[comb];
                if (! current['callback']) {
                    current['callback'] = [cb];
                } else if (! current['tie']) {
                    current['callback'].push(cb);
                }
            }
        },
        
        init: function (opt) {
            var el = opt.el;
            var that = this;
            
            var invoke = function (e) {
                for (var i = 0; i <= that._tid.length; i++) {
                    clearTimeout(that._tid[i]);
                }
                that._tid = [];
                
                e = e || window.event;
                
                if (e.keyCode)
                    code = e.keyCode;
	        else if (e.which)
                    code = e.which;
                
                if (code == 16 || code == 17 || code == 18)
                    return;
                
                if (e.ctrlKey)	code += special_keys['ctrl'];
		if (e.shiftKey)	code += special_keys['shift'];
		if (e.altKey)	code += special_keys['alt'];
		if (e.metaKey)  code += special_keys['meta'];
                
                var ch = code; //String.fromCharCode(code).toLowerCase();
                var map = that._waiting || (that._search ? that._search : that._ev);
                
                var fire = function() {
                    that._waiting = false;
                    that._in_remap = false;
                    
                    for (var cb in map[ch]['callback'])
                        map[ch]['callback'][cb]();                        
                    
                    if (! opt['propagate']) {
			//e.cancelBubble is supported by IE - this will kill the bubbling process.
			e.cancelBubble = true;
			e.returnValue = false;
	                
			//e.stopPropagation works in Firefox.
			if (e.stopPropagation) {
			    e.stopPropagation();
			    e.preventDefault();
			}
                        
			return false;
		    }
                };
                
                if (map[ch]) {
                    var next = false;
                    for (var prop in map[ch])
                        if (prop && prop != 'callback' && prop != "tie") {
                            next = true;
                            break;
                        }
                    
                    if (next) {
                        if (map[ch]['callback']) {
                            var tid = setTimeout(fire, 1000);
                            that._tid.push(tid);
                        }
                        
                        that._waiting = map[ch];
                    } else {
                        fire();
                    }
                } else {
                    that._waiting = false;
                    that._search = null;
                    if (that.nomatch) that.nomatch();
                }
            };
            
            bind(el, invoke, opt);
        },

        remap: function (comb, data, opt) {
            var that = this;
            var into = {};
            
            for (var subcomb in data) {
                var cb = data[subcomb];
                data[subcomb] = function () {
                    that._search = null;
                    cb();
                };
            }
            
            this._build_structure(into, data, {});
            this._remap.push(into);
            var idx  = this._remap.length - 1;
            
            this.add(comb, function () {
                that._search = that._remap[idx];
            }, opt);
        },
        
        tie: function (comb, cb, opt) {
            if (! opt) opt = {};
            opt['tie'] = 1;
            
            this.add(comb, cb, opt);
        },
        
        add: function (comb, cb, opt) {
            
            opt = consopt(opt);
            
            // create $type event listener (keypress, keyup, ...)
            // if we don't already have one
            if (! this._el[opt['type']]) {
                this.init(opt);
                this._el[opt['type']] = 1;
            }
            
            // this._ev is a tree-like structure
            // when we go over $seq we look if we 
            // already have a leaf with $seq[$i] code
            // in case we do:
            //     $i++ and go through leaf, in case
            //     $i == $seq.length just add cb  
            // in case we don't:
            //     create it
            var data = {};
            data[comb] = cb;
            
            this._build_structure(this._ev, data, opt);
        },
        
        remove: function () {
            
        }
    };
})();
