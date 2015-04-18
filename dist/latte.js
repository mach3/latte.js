/*!
 * latte.js
 * --------
 * Simple class and router library
 *
 * @version 0.0.1 (build: 2015-04-18)
 * @author mach3 <http://github.com/mach3>
 * @license MIT
 */
(function(global){

	var latte = {};

	/**
	 * Common utilities
	 * ================
	 */
	var u = {
		type: function(obj, test){
			var str = (function(){
				var m = Object.prototype.toString.call(obj).match(/^\[\w+\s(\w+)\]$/);
				return m ? m[1] : void 0;
			}());
			return (!! test) ? test === str : str;
		},
		toArray: function(obj){
			return Array.prototype.slice.call(obj);
		},
		extend: function(/* [deep, [override,]] dest, src, src */){
			var args, deep, override, dest;
			args = u.toArray(arguments);
			deep = u.type(args[0], "Boolean") ? args.shift() : false;
			override = u.type(args[0], "Boolean") ? args.shift() : true;
			dest = args.shift();
			u.each(args, function(o){
				u.each(o, function(value, key){
					if(! override && key in dest){ return; }
					if(u.type(value, "Object") && deep){
						dest[key] = u.extend(true, {}, dest[key], value);
					} else {
						dest[key] = value;
					}
				});
			});
			return dest;
		},
		each: function(obj, callback, force){
			var i;
			for(i in obj){
				if(! obj.hasOwnProperty(i) && ! force){ continue; }
				if(false === callback(obj[i], i)){ break; }
			}
		},
		map: function(list, callback){
			var i, dest;
			if(u.type(Array.prototype.map, "Function")){
				return list.map(callback);
			}
			dest = [];
			for(i=0; i<list.length; i++){
				dest[i] = callback(list[i]);
			}
			return dest;
		},
		delegate: function(obj, name){
			switch(u.type(name)){
				case "String":
					if(u.type(obj[name], "Function")){
						obj[name] = obj[name].bind(obj);
					}
					break;
				case "RegExp":
					u.each(obj, function(value, key){
						if(name.test(key)){ u.delegate(obj, key) }
					}, true);
					break;
				case "Array":
					u.each(name, function(s){ u.delegate(obj, s); });
					break;
				default: break;
			}
			return void 0;
		}
	};

	latte.util = u;

	/**
	 * Core Libraries
	 * ==============
	 */

	/**
	 * latte.Class
	 * -----------
	 * Core of latte class library
	 */
	latte.Class = function(props){
		var Core = function(){
			var my = this;
			u.each(this._extended, function(obj, i){
				obj = u.type(obj, "Function") ? obj.prototype : obj;
				if(obj._initialize !== my._initialize && u.type(obj._initialize, "Function")){
					obj._initialize.apply(my, arguments);
				}
			});
			u.delegate(this, /^_/);
			if(u.type(this._initialize, "Function")){
				this._initialize.apply(this, arguments);
			}
		};
		Core.prototype._extended = [];
		Core.extend = function(/* override, src, src... */){
			var args, override, self;
			args = u.toArray(arguments);
			override = u.type(args[0], "Boolean") ? args.shift() : false;
			self = this;
			u.each(args, function(obj){
				var props;
				obj = u.type(obj, "String") ? latte.find(obj) : obj;
				switch(u.type(obj)){
					case "Function": props = obj.prototype; break;
					case "Object": props = obj; break;
					default: break;
				}
				if(! props){ return; }
				u.extend(true, override, self.prototype, u.extend(true, {}, props));
				self.prototype._extended.push(props);
			});
			return this;
		};
		props = (props === void 0) ? {} : props;
		if(u.type(props._extend, "Array")){
			Core.extend.apply(Core, props._extend);
		}
		return Core.extend(true, props);
	};

	/**
	 * latte.Class.Events
	 * ------------------
	 * @class Event feature for latte class
	 */
	latte.Class.Events = latte.Class({

		_handlers: null,

		_initialize: function(){
			this._handlers = {};
		},

		on: function(name, func){
			var my = this;
			switch(u.type(name)){
				case "Object":
					u.each(name, function(value, key){
						my.on(key, value);
					});
					break;
				case "String":
					if(! (name in this._handlers)){
						this._handlers[name] = [];
					}
					this._handlers[name].push(func);
				default: break;
			}
			return this;
		},

		off: function(name, func){
			var args, tmp;
			args = arguments;
			tmp = [];
			switch(args.length){
				case 0:
					return this._handlers = {};
				case 1:
					this._handlers[name] = [];
					break;
				default: 
					if(name in this._handlers){
						u.each(this._handlers[name], function(value, i){
							if(func !== value){ tmp.push(value); }
						});
						this._handlers[name] = tmp;
					}
				break;
			}
			return this;
		},

		trigger: function(name){
			var my, args;
			my = this;
			args = [{target: this, type: name}].concat(u.toArray(arguments).slice(1));
			if(name in this._handlers){
				u.each(this._handlers[name], function(func){
					func.apply(my, args);
				});
			}
		}
	});

	/**
	 * latte.Class.Config
	 * ------------------
	 * @class Configure options feature for latte class
	 */
	latte.Class.Config = latte.Class({

		_options: null,
		options: null,

		_initialize: function(){
			this.options = u.extend(true, {}, this._options);
		},

		config: function(key, value){
			var my, args;
			my = this;
			args = u.toArray(arguments);
			switch(u.type(key)){
				case "String":
					if(args.length < 2){ return this.options[key]; }
					this.options[key] = value;
					break;
				case "Object":
					u.each(key, function(v, k){
						my.config(k, v);
					});
					break;
				case "Undefined":
					return this.options;
				default: break;
			}
			return this;
		}
	});

	/**
	 * latte.Class.Attributes
	 * ----------------------
	 * @class Configure attributes feature for latte class
	 */
	latte.Class.Attributes = latte.Class({

		_attributes: null,
		attributes: null,

		_initialize: function(){
			this.attributes = u.extend(true, {}, this._attributes);
		},

		attr: function(key, value){
			var my, args, changed;
			my = this;
			args = u.toArray(arguments);
			changed = false;
			switch(u.type(key)){
				case "Undefined":
					return this.attributes;
				case "String":
					if(args.length < 2){
						return this.attributes[key];
					}
					changed = this.attributes[key] !== value;
					this.attributes[key] = value;
					if(changed && u.type(this.trigger, "Function")){
						this.trigger("change", {key: key, value: value});
					}
					return this;
				case "Object":
					u.each(key, function(v, k){
						my.attr(k, v);
					});
				default: break;
			}
			return this;
		}
	});

	/**
	 * latte.Class.HashChange
	 * ----------------------
	 * @class Wrapper for onhashchange events
	 */
	latte.Class.HashChange = latte.Class({

		_options: {
			interval: 100
		},

		timer: null,
		latest: null,

		_initialize: function(){
			var my = this;
			if("onhashchange" in global){
				return global.addEventListener("hashchange", function(){
					my.trigger("change");
				});
			}
			this.timer = setInterval(this._process, this.config("interval"));
		},

		_process: function(){
			if(location.hash !== this.latest && this.latest !== null){
				this.trigger("change");
			}
			this.latest = location.hash;
		}

	})
	.extend(latte.Class.Config, latte.Class.Events);

	/**
	 * latte.Class.Routes
	 * ------------------
	 * @class Router module for latte
	 */
	latte.Class.Routes = latte.Class({

		_options: {
			mode: "path",
			single: false
		},
		routes: null,
		hashchange: null,
		instance: null,

		_initialize: function(){
			u.delegate(this, "resolve");
			this.routes = [];
		},

		push: function(/* item, item */){
			var my = this;
			u.each(arguments, function(item){
				my.routes.push(item);
			});
			return this;
		},

		start: function(){
			this.resolve();
			if(this.config("mode") === "hash"){
				this.hashchange = this.hashchange || new latte.Class.HashChange;
				this.hashchange.off("change").on("change", this.resolve);
			}
			return this;
		},

		resolve: function(){
			var o, my;
			o = this.config();
			my = this;
			name = (o.mode === "hash") ? location.hash.slice(1)
			: (o.mode === "query") ? location.search.slice(1)
			: (o.mode === "path") ? location.pathname
			: null;
			u.each(this.routes, function(item){
				var r = my.validateRoute(name, item);
				if(o.single && r){
					return false;
				}
			});
		},

		validateRoute: function(name, item){
			var o, valid, cls, matches;
			o = this.config();
			valid = false;
			matches = [];
			switch(u.type(item.rule)){
				case "String":
				case "RegExp":
					matches = (function(){
						var m = name.match(item.rule) || [];
						return u.toArray(m);
					}());
					valid = !! matches.length;
					break;
				case "Function":
					valid = item.rule(name);
					break;
				case "Boolean":
					valid = item.rule;
					break;
				default: break;
			}
			if(! valid){ return false; }
			if(
				o.single
				&& !! this.instance
				&& "_destruct" in this.instance
				&& u.type(this.instance._destruct, "Function")
			){
				this.instance._destruct();
			}
			switch(u.type(item.action)){
				case "Function":
					item.action.apply(this, matches);
					break;
				case "Object":
					cls = latte.Class(item.action);
					this.instance = new cls();
					break;
				default: break;
			}
			return true;
		}
	})
	.extend(latte.Class.Events, latte.Class.Config);


	/**
	 * Latte Interface
	 * ===============
	 */
	latte.routes = new latte.Class.Routes();
	latte.action = function(){
		this.routes.push.apply(this.routes, arguments);
	};
	latte.drip = function(){
		this.routes.start();
	};

	latte._modules = {};
	latte._instances = {};

	latte.define = function(name, obj, override){
		override = (override == void 0) ? true : override;
		if(override || name in latte._modules){
			latte._modules[name] = u.type(obj, "Object") ? latte.Class(obj) : obj;
		}
		return this;
	};

	latte.find = function(name){
		return (name in latte._modules) ? latte._modules[name]
		: (name in latte.Class) ? latte.Class[name]
		: void 0;
	};

	latte.require = function(name, newOne){
		var mod, getInstance;
		mod = latte.find(name);
		getInstance = function(mod){
			return u.type(mod, "Function") ? new mod() : mod;
		};
		if(! newOne){
			if(name in latte._instances){
				return latte._instances[name];
			}
			inst = getInstance(mod);
			latte._instances[name] = inst;
			return inst;
		}
		return getInstance(mod);
	};

	global.latte = latte;

}(this));