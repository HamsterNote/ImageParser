import { r as __toESM, t as __commonJSMin } from "./chunk-CRPLlQ3x.js";
//#region node_modules/js-yaml/dist/js-yaml.mjs
/*! js-yaml 4.1.1 https://github.com/nodeca/js-yaml @license MIT */
function isNothing(subject) {
	return typeof subject === "undefined" || subject === null;
}
function isObject$1(subject) {
	return typeof subject === "object" && subject !== null;
}
function toArray(sequence) {
	if (Array.isArray(sequence)) return sequence;
	else if (isNothing(sequence)) return [];
	return [sequence];
}
function extend(target, source) {
	var index, length, key, sourceKeys;
	if (source) {
		sourceKeys = Object.keys(source);
		for (index = 0, length = sourceKeys.length; index < length; index += 1) {
			key = sourceKeys[index];
			target[key] = source[key];
		}
	}
	return target;
}
function repeat(string, count) {
	var result = "", cycle;
	for (cycle = 0; cycle < count; cycle += 1) result += string;
	return result;
}
function isNegativeZero(number) {
	return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
}
var common = {
	isNothing,
	isObject: isObject$1,
	toArray,
	repeat,
	isNegativeZero,
	extend
};
function formatError(exception, compact) {
	var where = "", message = exception.reason || "(unknown reason)";
	if (!exception.mark) return message;
	if (exception.mark.name) where += "in \"" + exception.mark.name + "\" ";
	where += "(" + (exception.mark.line + 1) + ":" + (exception.mark.column + 1) + ")";
	if (!compact && exception.mark.snippet) where += "\n\n" + exception.mark.snippet;
	return message + " " + where;
}
function YAMLException$1(reason, mark) {
	Error.call(this);
	this.name = "YAMLException";
	this.reason = reason;
	this.mark = mark;
	this.message = formatError(this, false);
	if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
	else this.stack = (/* @__PURE__ */ new Error()).stack || "";
}
YAMLException$1.prototype = Object.create(Error.prototype);
YAMLException$1.prototype.constructor = YAMLException$1;
YAMLException$1.prototype.toString = function toString(compact) {
	return this.name + ": " + formatError(this, compact);
};
var exception = YAMLException$1;
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
	var head = "";
	var tail = "";
	var maxHalfLength = Math.floor(maxLineLength / 2) - 1;
	if (position - lineStart > maxHalfLength) {
		head = " ... ";
		lineStart = position - maxHalfLength + head.length;
	}
	if (lineEnd - position > maxHalfLength) {
		tail = " ...";
		lineEnd = position + maxHalfLength - tail.length;
	}
	return {
		str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "→") + tail,
		pos: position - lineStart + head.length
	};
}
function padStart(string, max) {
	return common.repeat(" ", max - string.length) + string;
}
function makeSnippet(mark, options) {
	options = Object.create(options || null);
	if (!mark.buffer) return null;
	if (!options.maxLength) options.maxLength = 79;
	if (typeof options.indent !== "number") options.indent = 1;
	if (typeof options.linesBefore !== "number") options.linesBefore = 3;
	if (typeof options.linesAfter !== "number") options.linesAfter = 2;
	var re = /\r?\n|\r|\0/g;
	var lineStarts = [0];
	var lineEnds = [];
	var match;
	var foundLineNo = -1;
	while (match = re.exec(mark.buffer)) {
		lineEnds.push(match.index);
		lineStarts.push(match.index + match[0].length);
		if (mark.position <= match.index && foundLineNo < 0) foundLineNo = lineStarts.length - 2;
	}
	if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
	var result = "", i, line;
	var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
	var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
	for (i = 1; i <= options.linesBefore; i++) {
		if (foundLineNo - i < 0) break;
		line = getLine(mark.buffer, lineStarts[foundLineNo - i], lineEnds[foundLineNo - i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]), maxLineLength);
		result = common.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line.str + "\n" + result;
	}
	line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
	result += common.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
	result += common.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
	for (i = 1; i <= options.linesAfter; i++) {
		if (foundLineNo + i >= lineEnds.length) break;
		line = getLine(mark.buffer, lineStarts[foundLineNo + i], lineEnds[foundLineNo + i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]), maxLineLength);
		result += common.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line.str + "\n";
	}
	return result.replace(/\n$/, "");
}
var snippet = makeSnippet;
var TYPE_CONSTRUCTOR_OPTIONS = [
	"kind",
	"multi",
	"resolve",
	"construct",
	"instanceOf",
	"predicate",
	"represent",
	"representName",
	"defaultStyle",
	"styleAliases"
];
var YAML_NODE_KINDS = [
	"scalar",
	"sequence",
	"mapping"
];
function compileStyleAliases(map) {
	var result = {};
	if (map !== null) Object.keys(map).forEach(function(style) {
		map[style].forEach(function(alias) {
			result[String(alias)] = style;
		});
	});
	return result;
}
function Type$1(tag, options) {
	options = options || {};
	Object.keys(options).forEach(function(name) {
		if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) throw new exception("Unknown option \"" + name + "\" is met in definition of \"" + tag + "\" YAML type.");
	});
	this.options = options;
	this.tag = tag;
	this.kind = options["kind"] || null;
	this.resolve = options["resolve"] || function() {
		return true;
	};
	this.construct = options["construct"] || function(data) {
		return data;
	};
	this.instanceOf = options["instanceOf"] || null;
	this.predicate = options["predicate"] || null;
	this.represent = options["represent"] || null;
	this.representName = options["representName"] || null;
	this.defaultStyle = options["defaultStyle"] || null;
	this.multi = options["multi"] || false;
	this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
	if (YAML_NODE_KINDS.indexOf(this.kind) === -1) throw new exception("Unknown kind \"" + this.kind + "\" is specified for \"" + tag + "\" YAML type.");
}
var type = Type$1;
function compileList(schema, name) {
	var result = [];
	schema[name].forEach(function(currentType) {
		var newIndex = result.length;
		result.forEach(function(previousType, previousIndex) {
			if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) newIndex = previousIndex;
		});
		result[newIndex] = currentType;
	});
	return result;
}
function compileMap() {
	var result = {
		scalar: {},
		sequence: {},
		mapping: {},
		fallback: {},
		multi: {
			scalar: [],
			sequence: [],
			mapping: [],
			fallback: []
		}
	}, index, length;
	function collectType(type) {
		if (type.multi) {
			result.multi[type.kind].push(type);
			result.multi["fallback"].push(type);
		} else result[type.kind][type.tag] = result["fallback"][type.tag] = type;
	}
	for (index = 0, length = arguments.length; index < length; index += 1) arguments[index].forEach(collectType);
	return result;
}
function Schema$1(definition) {
	return this.extend(definition);
}
Schema$1.prototype.extend = function extend(definition) {
	var implicit = [];
	var explicit = [];
	if (definition instanceof type) explicit.push(definition);
	else if (Array.isArray(definition)) explicit = explicit.concat(definition);
	else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
		if (definition.implicit) implicit = implicit.concat(definition.implicit);
		if (definition.explicit) explicit = explicit.concat(definition.explicit);
	} else throw new exception("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
	implicit.forEach(function(type$1) {
		if (!(type$1 instanceof type)) throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
		if (type$1.loadKind && type$1.loadKind !== "scalar") throw new exception("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
		if (type$1.multi) throw new exception("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
	});
	explicit.forEach(function(type$1) {
		if (!(type$1 instanceof type)) throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
	});
	var result = Object.create(Schema$1.prototype);
	result.implicit = (this.implicit || []).concat(implicit);
	result.explicit = (this.explicit || []).concat(explicit);
	result.compiledImplicit = compileList(result, "implicit");
	result.compiledExplicit = compileList(result, "explicit");
	result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
	return result;
};
var schema = Schema$1;
var str = new type("tag:yaml.org,2002:str", {
	kind: "scalar",
	construct: function(data) {
		return data !== null ? data : "";
	}
});
var seq = new type("tag:yaml.org,2002:seq", {
	kind: "sequence",
	construct: function(data) {
		return data !== null ? data : [];
	}
});
var map = new type("tag:yaml.org,2002:map", {
	kind: "mapping",
	construct: function(data) {
		return data !== null ? data : {};
	}
});
var failsafe = new schema({ explicit: [
	str,
	seq,
	map
] });
function resolveYamlNull(data) {
	if (data === null) return true;
	var max = data.length;
	return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
}
function constructYamlNull() {
	return null;
}
function isNull(object) {
	return object === null;
}
var _null = new type("tag:yaml.org,2002:null", {
	kind: "scalar",
	resolve: resolveYamlNull,
	construct: constructYamlNull,
	predicate: isNull,
	represent: {
		canonical: function() {
			return "~";
		},
		lowercase: function() {
			return "null";
		},
		uppercase: function() {
			return "NULL";
		},
		camelcase: function() {
			return "Null";
		},
		empty: function() {
			return "";
		}
	},
	defaultStyle: "lowercase"
});
function resolveYamlBoolean(data) {
	if (data === null) return false;
	var max = data.length;
	return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
}
function constructYamlBoolean(data) {
	return data === "true" || data === "True" || data === "TRUE";
}
function isBoolean(object) {
	return Object.prototype.toString.call(object) === "[object Boolean]";
}
var bool = new type("tag:yaml.org,2002:bool", {
	kind: "scalar",
	resolve: resolveYamlBoolean,
	construct: constructYamlBoolean,
	predicate: isBoolean,
	represent: {
		lowercase: function(object) {
			return object ? "true" : "false";
		},
		uppercase: function(object) {
			return object ? "TRUE" : "FALSE";
		},
		camelcase: function(object) {
			return object ? "True" : "False";
		}
	},
	defaultStyle: "lowercase"
});
function isHexCode(c) {
	return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
}
function isOctCode(c) {
	return 48 <= c && c <= 55;
}
function isDecCode(c) {
	return 48 <= c && c <= 57;
}
function resolveYamlInteger(data) {
	if (data === null) return false;
	var max = data.length, index = 0, hasDigits = false, ch;
	if (!max) return false;
	ch = data[index];
	if (ch === "-" || ch === "+") ch = data[++index];
	if (ch === "0") {
		if (index + 1 === max) return true;
		ch = data[++index];
		if (ch === "b") {
			index++;
			for (; index < max; index++) {
				ch = data[index];
				if (ch === "_") continue;
				if (ch !== "0" && ch !== "1") return false;
				hasDigits = true;
			}
			return hasDigits && ch !== "_";
		}
		if (ch === "x") {
			index++;
			for (; index < max; index++) {
				ch = data[index];
				if (ch === "_") continue;
				if (!isHexCode(data.charCodeAt(index))) return false;
				hasDigits = true;
			}
			return hasDigits && ch !== "_";
		}
		if (ch === "o") {
			index++;
			for (; index < max; index++) {
				ch = data[index];
				if (ch === "_") continue;
				if (!isOctCode(data.charCodeAt(index))) return false;
				hasDigits = true;
			}
			return hasDigits && ch !== "_";
		}
	}
	if (ch === "_") return false;
	for (; index < max; index++) {
		ch = data[index];
		if (ch === "_") continue;
		if (!isDecCode(data.charCodeAt(index))) return false;
		hasDigits = true;
	}
	if (!hasDigits || ch === "_") return false;
	return true;
}
function constructYamlInteger(data) {
	var value = data, sign = 1, ch;
	if (value.indexOf("_") !== -1) value = value.replace(/_/g, "");
	ch = value[0];
	if (ch === "-" || ch === "+") {
		if (ch === "-") sign = -1;
		value = value.slice(1);
		ch = value[0];
	}
	if (value === "0") return 0;
	if (ch === "0") {
		if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
		if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
		if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
	}
	return sign * parseInt(value, 10);
}
function isInteger(object) {
	return Object.prototype.toString.call(object) === "[object Number]" && object % 1 === 0 && !common.isNegativeZero(object);
}
var int = new type("tag:yaml.org,2002:int", {
	kind: "scalar",
	resolve: resolveYamlInteger,
	construct: constructYamlInteger,
	predicate: isInteger,
	represent: {
		binary: function(obj) {
			return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
		},
		octal: function(obj) {
			return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
		},
		decimal: function(obj) {
			return obj.toString(10);
		},
		hexadecimal: function(obj) {
			return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
		}
	},
	defaultStyle: "decimal",
	styleAliases: {
		binary: [2, "bin"],
		octal: [8, "oct"],
		decimal: [10, "dec"],
		hexadecimal: [16, "hex"]
	}
});
var YAML_FLOAT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
function resolveYamlFloat(data) {
	if (data === null) return false;
	if (!YAML_FLOAT_PATTERN.test(data) || data[data.length - 1] === "_") return false;
	return true;
}
function constructYamlFloat(data) {
	var value = data.replace(/_/g, "").toLowerCase(), sign = value[0] === "-" ? -1 : 1;
	if ("+-".indexOf(value[0]) >= 0) value = value.slice(1);
	if (value === ".inf") return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
	else if (value === ".nan") return NaN;
	return sign * parseFloat(value, 10);
}
var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
function representYamlFloat(object, style) {
	var res;
	if (isNaN(object)) switch (style) {
		case "lowercase": return ".nan";
		case "uppercase": return ".NAN";
		case "camelcase": return ".NaN";
	}
	else if (Number.POSITIVE_INFINITY === object) switch (style) {
		case "lowercase": return ".inf";
		case "uppercase": return ".INF";
		case "camelcase": return ".Inf";
	}
	else if (Number.NEGATIVE_INFINITY === object) switch (style) {
		case "lowercase": return "-.inf";
		case "uppercase": return "-.INF";
		case "camelcase": return "-.Inf";
	}
	else if (common.isNegativeZero(object)) return "-0.0";
	res = object.toString(10);
	return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
}
function isFloat(object) {
	return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
}
var float = new type("tag:yaml.org,2002:float", {
	kind: "scalar",
	resolve: resolveYamlFloat,
	construct: constructYamlFloat,
	predicate: isFloat,
	represent: representYamlFloat,
	defaultStyle: "lowercase"
});
var json = failsafe.extend({ implicit: [
	_null,
	bool,
	int,
	float
] });
var core = json;
var YAML_DATE_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
var YAML_TIMESTAMP_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
function resolveYamlTimestamp(data) {
	if (data === null) return false;
	if (YAML_DATE_REGEXP.exec(data) !== null) return true;
	if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
	return false;
}
function constructYamlTimestamp(data) {
	var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
	match = YAML_DATE_REGEXP.exec(data);
	if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
	if (match === null) throw new Error("Date resolve error");
	year = +match[1];
	month = +match[2] - 1;
	day = +match[3];
	if (!match[4]) return new Date(Date.UTC(year, month, day));
	hour = +match[4];
	minute = +match[5];
	second = +match[6];
	if (match[7]) {
		fraction = match[7].slice(0, 3);
		while (fraction.length < 3) fraction += "0";
		fraction = +fraction;
	}
	if (match[9]) {
		tz_hour = +match[10];
		tz_minute = +(match[11] || 0);
		delta = (tz_hour * 60 + tz_minute) * 6e4;
		if (match[9] === "-") delta = -delta;
	}
	date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
	if (delta) date.setTime(date.getTime() - delta);
	return date;
}
function representYamlTimestamp(object) {
	return object.toISOString();
}
var timestamp = new type("tag:yaml.org,2002:timestamp", {
	kind: "scalar",
	resolve: resolveYamlTimestamp,
	construct: constructYamlTimestamp,
	instanceOf: Date,
	represent: representYamlTimestamp
});
function resolveYamlMerge(data) {
	return data === "<<" || data === null;
}
var merge = new type("tag:yaml.org,2002:merge", {
	kind: "scalar",
	resolve: resolveYamlMerge
});
var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
function resolveYamlBinary(data) {
	if (data === null) return false;
	var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;
	for (idx = 0; idx < max; idx++) {
		code = map.indexOf(data.charAt(idx));
		if (code > 64) continue;
		if (code < 0) return false;
		bitlen += 6;
	}
	return bitlen % 8 === 0;
}
function constructYamlBinary(data) {
	var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map = BASE64_MAP, bits = 0, result = [];
	for (idx = 0; idx < max; idx++) {
		if (idx % 4 === 0 && idx) {
			result.push(bits >> 16 & 255);
			result.push(bits >> 8 & 255);
			result.push(bits & 255);
		}
		bits = bits << 6 | map.indexOf(input.charAt(idx));
	}
	tailbits = max % 4 * 6;
	if (tailbits === 0) {
		result.push(bits >> 16 & 255);
		result.push(bits >> 8 & 255);
		result.push(bits & 255);
	} else if (tailbits === 18) {
		result.push(bits >> 10 & 255);
		result.push(bits >> 2 & 255);
	} else if (tailbits === 12) result.push(bits >> 4 & 255);
	return new Uint8Array(result);
}
function representYamlBinary(object) {
	var result = "", bits = 0, idx, tail, max = object.length, map = BASE64_MAP;
	for (idx = 0; idx < max; idx++) {
		if (idx % 3 === 0 && idx) {
			result += map[bits >> 18 & 63];
			result += map[bits >> 12 & 63];
			result += map[bits >> 6 & 63];
			result += map[bits & 63];
		}
		bits = (bits << 8) + object[idx];
	}
	tail = max % 3;
	if (tail === 0) {
		result += map[bits >> 18 & 63];
		result += map[bits >> 12 & 63];
		result += map[bits >> 6 & 63];
		result += map[bits & 63];
	} else if (tail === 2) {
		result += map[bits >> 10 & 63];
		result += map[bits >> 4 & 63];
		result += map[bits << 2 & 63];
		result += map[64];
	} else if (tail === 1) {
		result += map[bits >> 2 & 63];
		result += map[bits << 4 & 63];
		result += map[64];
		result += map[64];
	}
	return result;
}
function isBinary(obj) {
	return Object.prototype.toString.call(obj) === "[object Uint8Array]";
}
var binary = new type("tag:yaml.org,2002:binary", {
	kind: "scalar",
	resolve: resolveYamlBinary,
	construct: constructYamlBinary,
	predicate: isBinary,
	represent: representYamlBinary
});
var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
var _toString$2 = Object.prototype.toString;
function resolveYamlOmap(data) {
	if (data === null) return true;
	var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
	for (index = 0, length = object.length; index < length; index += 1) {
		pair = object[index];
		pairHasKey = false;
		if (_toString$2.call(pair) !== "[object Object]") return false;
		for (pairKey in pair) if (_hasOwnProperty$3.call(pair, pairKey)) if (!pairHasKey) pairHasKey = true;
		else return false;
		if (!pairHasKey) return false;
		if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
		else return false;
	}
	return true;
}
function constructYamlOmap(data) {
	return data !== null ? data : [];
}
var omap = new type("tag:yaml.org,2002:omap", {
	kind: "sequence",
	resolve: resolveYamlOmap,
	construct: constructYamlOmap
});
var _toString$1 = Object.prototype.toString;
function resolveYamlPairs(data) {
	if (data === null) return true;
	var index, length, pair, keys, result, object = data;
	result = new Array(object.length);
	for (index = 0, length = object.length; index < length; index += 1) {
		pair = object[index];
		if (_toString$1.call(pair) !== "[object Object]") return false;
		keys = Object.keys(pair);
		if (keys.length !== 1) return false;
		result[index] = [keys[0], pair[keys[0]]];
	}
	return true;
}
function constructYamlPairs(data) {
	if (data === null) return [];
	var index, length, pair, keys, result, object = data;
	result = new Array(object.length);
	for (index = 0, length = object.length; index < length; index += 1) {
		pair = object[index];
		keys = Object.keys(pair);
		result[index] = [keys[0], pair[keys[0]]];
	}
	return result;
}
var pairs = new type("tag:yaml.org,2002:pairs", {
	kind: "sequence",
	resolve: resolveYamlPairs,
	construct: constructYamlPairs
});
var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;
function resolveYamlSet(data) {
	if (data === null) return true;
	var key, object = data;
	for (key in object) if (_hasOwnProperty$2.call(object, key)) {
		if (object[key] !== null) return false;
	}
	return true;
}
function constructYamlSet(data) {
	return data !== null ? data : {};
}
var set = new type("tag:yaml.org,2002:set", {
	kind: "mapping",
	resolve: resolveYamlSet,
	construct: constructYamlSet
});
var _default = core.extend({
	implicit: [timestamp, merge],
	explicit: [
		binary,
		omap,
		pairs,
		set
	]
});
var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var CONTEXT_FLOW_IN = 1;
var CONTEXT_FLOW_OUT = 2;
var CONTEXT_BLOCK_IN = 3;
var CONTEXT_BLOCK_OUT = 4;
var CHOMPING_CLIP = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP = 3;
var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function _class(obj) {
	return Object.prototype.toString.call(obj);
}
function is_EOL(c) {
	return c === 10 || c === 13;
}
function is_WHITE_SPACE(c) {
	return c === 9 || c === 32;
}
function is_WS_OR_EOL(c) {
	return c === 9 || c === 32 || c === 10 || c === 13;
}
function is_FLOW_INDICATOR(c) {
	return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
}
function fromHexCode(c) {
	var lc;
	if (48 <= c && c <= 57) return c - 48;
	lc = c | 32;
	if (97 <= lc && lc <= 102) return lc - 97 + 10;
	return -1;
}
function escapedHexLen(c) {
	if (c === 120) return 2;
	if (c === 117) return 4;
	if (c === 85) return 8;
	return 0;
}
function fromDecimalCode(c) {
	if (48 <= c && c <= 57) return c - 48;
	return -1;
}
function simpleEscapeSequence(c) {
	return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? "\"" : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
}
function charFromCodepoint(c) {
	if (c <= 65535) return String.fromCharCode(c);
	return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
}
function setProperty(object, key, value) {
	if (key === "__proto__") Object.defineProperty(object, key, {
		configurable: true,
		enumerable: true,
		writable: true,
		value
	});
	else object[key] = value;
}
var simpleEscapeCheck = new Array(256);
var simpleEscapeMap = new Array(256);
for (var i = 0; i < 256; i++) {
	simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
	simpleEscapeMap[i] = simpleEscapeSequence(i);
}
function State$1(input, options) {
	this.input = input;
	this.filename = options["filename"] || null;
	this.schema = options["schema"] || _default;
	this.onWarning = options["onWarning"] || null;
	this.legacy = options["legacy"] || false;
	this.json = options["json"] || false;
	this.listener = options["listener"] || null;
	this.implicitTypes = this.schema.compiledImplicit;
	this.typeMap = this.schema.compiledTypeMap;
	this.length = input.length;
	this.position = 0;
	this.line = 0;
	this.lineStart = 0;
	this.lineIndent = 0;
	this.firstTabInLine = -1;
	this.documents = [];
}
function generateError(state, message) {
	var mark = {
		name: state.filename,
		buffer: state.input.slice(0, -1),
		position: state.position,
		line: state.line,
		column: state.position - state.lineStart
	};
	mark.snippet = snippet(mark);
	return new exception(message, mark);
}
function throwError(state, message) {
	throw generateError(state, message);
}
function throwWarning(state, message) {
	if (state.onWarning) state.onWarning.call(null, generateError(state, message));
}
var directiveHandlers = {
	YAML: function handleYamlDirective(state, name, args) {
		var match, major, minor;
		if (state.version !== null) throwError(state, "duplication of %YAML directive");
		if (args.length !== 1) throwError(state, "YAML directive accepts exactly one argument");
		match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
		if (match === null) throwError(state, "ill-formed argument of the YAML directive");
		major = parseInt(match[1], 10);
		minor = parseInt(match[2], 10);
		if (major !== 1) throwError(state, "unacceptable YAML version of the document");
		state.version = args[0];
		state.checkLineBreaks = minor < 2;
		if (minor !== 1 && minor !== 2) throwWarning(state, "unsupported YAML version of the document");
	},
	TAG: function handleTagDirective(state, name, args) {
		var handle, prefix;
		if (args.length !== 2) throwError(state, "TAG directive accepts exactly two arguments");
		handle = args[0];
		prefix = args[1];
		if (!PATTERN_TAG_HANDLE.test(handle)) throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
		if (_hasOwnProperty$1.call(state.tagMap, handle)) throwError(state, "there is a previously declared suffix for \"" + handle + "\" tag handle");
		if (!PATTERN_TAG_URI.test(prefix)) throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
		try {
			prefix = decodeURIComponent(prefix);
		} catch (err) {
			throwError(state, "tag prefix is malformed: " + prefix);
		}
		state.tagMap[handle] = prefix;
	}
};
function captureSegment(state, start, end, checkJson) {
	var _position, _length, _character, _result;
	if (start < end) {
		_result = state.input.slice(start, end);
		if (checkJson) for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
			_character = _result.charCodeAt(_position);
			if (!(_character === 9 || 32 <= _character && _character <= 1114111)) throwError(state, "expected valid JSON character");
		}
		else if (PATTERN_NON_PRINTABLE.test(_result)) throwError(state, "the stream contains non-printable characters");
		state.result += _result;
	}
}
function mergeMappings(state, destination, source, overridableKeys) {
	var sourceKeys, key, index, quantity;
	if (!common.isObject(source)) throwError(state, "cannot merge mappings; the provided source object is unacceptable");
	sourceKeys = Object.keys(source);
	for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
		key = sourceKeys[index];
		if (!_hasOwnProperty$1.call(destination, key)) {
			setProperty(destination, key, source[key]);
			overridableKeys[key] = true;
		}
	}
}
function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
	var index, quantity;
	if (Array.isArray(keyNode)) {
		keyNode = Array.prototype.slice.call(keyNode);
		for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
			if (Array.isArray(keyNode[index])) throwError(state, "nested arrays are not supported inside keys");
			if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") keyNode[index] = "[object Object]";
		}
	}
	if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") keyNode = "[object Object]";
	keyNode = String(keyNode);
	if (_result === null) _result = {};
	if (keyTag === "tag:yaml.org,2002:merge") if (Array.isArray(valueNode)) for (index = 0, quantity = valueNode.length; index < quantity; index += 1) mergeMappings(state, _result, valueNode[index], overridableKeys);
	else mergeMappings(state, _result, valueNode, overridableKeys);
	else {
		if (!state.json && !_hasOwnProperty$1.call(overridableKeys, keyNode) && _hasOwnProperty$1.call(_result, keyNode)) {
			state.line = startLine || state.line;
			state.lineStart = startLineStart || state.lineStart;
			state.position = startPos || state.position;
			throwError(state, "duplicated mapping key");
		}
		setProperty(_result, keyNode, valueNode);
		delete overridableKeys[keyNode];
	}
	return _result;
}
function readLineBreak(state) {
	var ch = state.input.charCodeAt(state.position);
	if (ch === 10) state.position++;
	else if (ch === 13) {
		state.position++;
		if (state.input.charCodeAt(state.position) === 10) state.position++;
	} else throwError(state, "a line break is expected");
	state.line += 1;
	state.lineStart = state.position;
	state.firstTabInLine = -1;
}
function skipSeparationSpace(state, allowComments, checkIndent) {
	var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
	while (ch !== 0) {
		while (is_WHITE_SPACE(ch)) {
			if (ch === 9 && state.firstTabInLine === -1) state.firstTabInLine = state.position;
			ch = state.input.charCodeAt(++state.position);
		}
		if (allowComments && ch === 35) do
			ch = state.input.charCodeAt(++state.position);
		while (ch !== 10 && ch !== 13 && ch !== 0);
		if (is_EOL(ch)) {
			readLineBreak(state);
			ch = state.input.charCodeAt(state.position);
			lineBreaks++;
			state.lineIndent = 0;
			while (ch === 32) {
				state.lineIndent++;
				ch = state.input.charCodeAt(++state.position);
			}
		} else break;
	}
	if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) throwWarning(state, "deficient indentation");
	return lineBreaks;
}
function testDocumentSeparator(state) {
	var _position = state.position, ch = state.input.charCodeAt(_position);
	if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
		_position += 3;
		ch = state.input.charCodeAt(_position);
		if (ch === 0 || is_WS_OR_EOL(ch)) return true;
	}
	return false;
}
function writeFoldedLines(state, count) {
	if (count === 1) state.result += " ";
	else if (count > 1) state.result += common.repeat("\n", count - 1);
}
function readPlainScalar(state, nodeIndent, withinFlowCollection) {
	var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch = state.input.charCodeAt(state.position);
	if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) return false;
	if (ch === 63 || ch === 45) {
		following = state.input.charCodeAt(state.position + 1);
		if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) return false;
	}
	state.kind = "scalar";
	state.result = "";
	captureStart = captureEnd = state.position;
	hasPendingContent = false;
	while (ch !== 0) {
		if (ch === 58) {
			following = state.input.charCodeAt(state.position + 1);
			if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) break;
		} else if (ch === 35) {
			preceding = state.input.charCodeAt(state.position - 1);
			if (is_WS_OR_EOL(preceding)) break;
		} else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) break;
		else if (is_EOL(ch)) {
			_line = state.line;
			_lineStart = state.lineStart;
			_lineIndent = state.lineIndent;
			skipSeparationSpace(state, false, -1);
			if (state.lineIndent >= nodeIndent) {
				hasPendingContent = true;
				ch = state.input.charCodeAt(state.position);
				continue;
			} else {
				state.position = captureEnd;
				state.line = _line;
				state.lineStart = _lineStart;
				state.lineIndent = _lineIndent;
				break;
			}
		}
		if (hasPendingContent) {
			captureSegment(state, captureStart, captureEnd, false);
			writeFoldedLines(state, state.line - _line);
			captureStart = captureEnd = state.position;
			hasPendingContent = false;
		}
		if (!is_WHITE_SPACE(ch)) captureEnd = state.position + 1;
		ch = state.input.charCodeAt(++state.position);
	}
	captureSegment(state, captureStart, captureEnd, false);
	if (state.result) return true;
	state.kind = _kind;
	state.result = _result;
	return false;
}
function readSingleQuotedScalar(state, nodeIndent) {
	var ch = state.input.charCodeAt(state.position), captureStart, captureEnd;
	if (ch !== 39) return false;
	state.kind = "scalar";
	state.result = "";
	state.position++;
	captureStart = captureEnd = state.position;
	while ((ch = state.input.charCodeAt(state.position)) !== 0) if (ch === 39) {
		captureSegment(state, captureStart, state.position, true);
		ch = state.input.charCodeAt(++state.position);
		if (ch === 39) {
			captureStart = state.position;
			state.position++;
			captureEnd = state.position;
		} else return true;
	} else if (is_EOL(ch)) {
		captureSegment(state, captureStart, captureEnd, true);
		writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
		captureStart = captureEnd = state.position;
	} else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a single quoted scalar");
	else {
		state.position++;
		captureEnd = state.position;
	}
	throwError(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state, nodeIndent) {
	var captureStart, captureEnd, hexLength, hexResult, tmp, ch = state.input.charCodeAt(state.position);
	if (ch !== 34) return false;
	state.kind = "scalar";
	state.result = "";
	state.position++;
	captureStart = captureEnd = state.position;
	while ((ch = state.input.charCodeAt(state.position)) !== 0) if (ch === 34) {
		captureSegment(state, captureStart, state.position, true);
		state.position++;
		return true;
	} else if (ch === 92) {
		captureSegment(state, captureStart, state.position, true);
		ch = state.input.charCodeAt(++state.position);
		if (is_EOL(ch)) skipSeparationSpace(state, false, nodeIndent);
		else if (ch < 256 && simpleEscapeCheck[ch]) {
			state.result += simpleEscapeMap[ch];
			state.position++;
		} else if ((tmp = escapedHexLen(ch)) > 0) {
			hexLength = tmp;
			hexResult = 0;
			for (; hexLength > 0; hexLength--) {
				ch = state.input.charCodeAt(++state.position);
				if ((tmp = fromHexCode(ch)) >= 0) hexResult = (hexResult << 4) + tmp;
				else throwError(state, "expected hexadecimal character");
			}
			state.result += charFromCodepoint(hexResult);
			state.position++;
		} else throwError(state, "unknown escape sequence");
		captureStart = captureEnd = state.position;
	} else if (is_EOL(ch)) {
		captureSegment(state, captureStart, captureEnd, true);
		writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
		captureStart = captureEnd = state.position;
	} else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a double quoted scalar");
	else {
		state.position++;
		captureEnd = state.position;
	}
	throwError(state, "unexpected end of the stream within a double quoted scalar");
}
function readFlowCollection(state, nodeIndent) {
	var readNext = true, _line, _lineStart, _pos, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = Object.create(null), keyNode, keyTag, valueNode, ch = state.input.charCodeAt(state.position);
	if (ch === 91) {
		terminator = 93;
		isMapping = false;
		_result = [];
	} else if (ch === 123) {
		terminator = 125;
		isMapping = true;
		_result = {};
	} else return false;
	if (state.anchor !== null) state.anchorMap[state.anchor] = _result;
	ch = state.input.charCodeAt(++state.position);
	while (ch !== 0) {
		skipSeparationSpace(state, true, nodeIndent);
		ch = state.input.charCodeAt(state.position);
		if (ch === terminator) {
			state.position++;
			state.tag = _tag;
			state.anchor = _anchor;
			state.kind = isMapping ? "mapping" : "sequence";
			state.result = _result;
			return true;
		} else if (!readNext) throwError(state, "missed comma between flow collection entries");
		else if (ch === 44) throwError(state, "expected the node content, but found ','");
		keyTag = keyNode = valueNode = null;
		isPair = isExplicitPair = false;
		if (ch === 63) {
			following = state.input.charCodeAt(state.position + 1);
			if (is_WS_OR_EOL(following)) {
				isPair = isExplicitPair = true;
				state.position++;
				skipSeparationSpace(state, true, nodeIndent);
			}
		}
		_line = state.line;
		_lineStart = state.lineStart;
		_pos = state.position;
		composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
		keyTag = state.tag;
		keyNode = state.result;
		skipSeparationSpace(state, true, nodeIndent);
		ch = state.input.charCodeAt(state.position);
		if ((isExplicitPair || state.line === _line) && ch === 58) {
			isPair = true;
			ch = state.input.charCodeAt(++state.position);
			skipSeparationSpace(state, true, nodeIndent);
			composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
			valueNode = state.result;
		}
		if (isMapping) storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
		else if (isPair) _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
		else _result.push(keyNode);
		skipSeparationSpace(state, true, nodeIndent);
		ch = state.input.charCodeAt(state.position);
		if (ch === 44) {
			readNext = true;
			ch = state.input.charCodeAt(++state.position);
		} else readNext = false;
	}
	throwError(state, "unexpected end of the stream within a flow collection");
}
function readBlockScalar(state, nodeIndent) {
	var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch = state.input.charCodeAt(state.position);
	if (ch === 124) folding = false;
	else if (ch === 62) folding = true;
	else return false;
	state.kind = "scalar";
	state.result = "";
	while (ch !== 0) {
		ch = state.input.charCodeAt(++state.position);
		if (ch === 43 || ch === 45) if (CHOMPING_CLIP === chomping) chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
		else throwError(state, "repeat of a chomping mode identifier");
		else if ((tmp = fromDecimalCode(ch)) >= 0) if (tmp === 0) throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
		else if (!detectedIndent) {
			textIndent = nodeIndent + tmp - 1;
			detectedIndent = true;
		} else throwError(state, "repeat of an indentation width identifier");
		else break;
	}
	if (is_WHITE_SPACE(ch)) {
		do
			ch = state.input.charCodeAt(++state.position);
		while (is_WHITE_SPACE(ch));
		if (ch === 35) do
			ch = state.input.charCodeAt(++state.position);
		while (!is_EOL(ch) && ch !== 0);
	}
	while (ch !== 0) {
		readLineBreak(state);
		state.lineIndent = 0;
		ch = state.input.charCodeAt(state.position);
		while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
			state.lineIndent++;
			ch = state.input.charCodeAt(++state.position);
		}
		if (!detectedIndent && state.lineIndent > textIndent) textIndent = state.lineIndent;
		if (is_EOL(ch)) {
			emptyLines++;
			continue;
		}
		if (state.lineIndent < textIndent) {
			if (chomping === CHOMPING_KEEP) state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
			else if (chomping === CHOMPING_CLIP) {
				if (didReadContent) state.result += "\n";
			}
			break;
		}
		if (folding) if (is_WHITE_SPACE(ch)) {
			atMoreIndented = true;
			state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
		} else if (atMoreIndented) {
			atMoreIndented = false;
			state.result += common.repeat("\n", emptyLines + 1);
		} else if (emptyLines === 0) {
			if (didReadContent) state.result += " ";
		} else state.result += common.repeat("\n", emptyLines);
		else state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
		didReadContent = true;
		detectedIndent = true;
		emptyLines = 0;
		captureStart = state.position;
		while (!is_EOL(ch) && ch !== 0) ch = state.input.charCodeAt(++state.position);
		captureSegment(state, captureStart, state.position, false);
	}
	return true;
}
function readBlockSequence(state, nodeIndent) {
	var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
	if (state.firstTabInLine !== -1) return false;
	if (state.anchor !== null) state.anchorMap[state.anchor] = _result;
	ch = state.input.charCodeAt(state.position);
	while (ch !== 0) {
		if (state.firstTabInLine !== -1) {
			state.position = state.firstTabInLine;
			throwError(state, "tab characters must not be used in indentation");
		}
		if (ch !== 45) break;
		following = state.input.charCodeAt(state.position + 1);
		if (!is_WS_OR_EOL(following)) break;
		detected = true;
		state.position++;
		if (skipSeparationSpace(state, true, -1)) {
			if (state.lineIndent <= nodeIndent) {
				_result.push(null);
				ch = state.input.charCodeAt(state.position);
				continue;
			}
		}
		_line = state.line;
		composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
		_result.push(state.result);
		skipSeparationSpace(state, true, -1);
		ch = state.input.charCodeAt(state.position);
		if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) throwError(state, "bad indentation of a sequence entry");
		else if (state.lineIndent < nodeIndent) break;
	}
	if (detected) {
		state.tag = _tag;
		state.anchor = _anchor;
		state.kind = "sequence";
		state.result = _result;
		return true;
	}
	return false;
}
function readBlockMapping(state, nodeIndent, flowIndent) {
	var following, allowCompact, _line, _keyLine, _keyLineStart, _keyPos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = Object.create(null), keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
	if (state.firstTabInLine !== -1) return false;
	if (state.anchor !== null) state.anchorMap[state.anchor] = _result;
	ch = state.input.charCodeAt(state.position);
	while (ch !== 0) {
		if (!atExplicitKey && state.firstTabInLine !== -1) {
			state.position = state.firstTabInLine;
			throwError(state, "tab characters must not be used in indentation");
		}
		following = state.input.charCodeAt(state.position + 1);
		_line = state.line;
		if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
			if (ch === 63) {
				if (atExplicitKey) {
					storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
					keyTag = keyNode = valueNode = null;
				}
				detected = true;
				atExplicitKey = true;
				allowCompact = true;
			} else if (atExplicitKey) {
				atExplicitKey = false;
				allowCompact = true;
			} else throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
			state.position += 1;
			ch = following;
		} else {
			_keyLine = state.line;
			_keyLineStart = state.lineStart;
			_keyPos = state.position;
			if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) break;
			if (state.line === _line) {
				ch = state.input.charCodeAt(state.position);
				while (is_WHITE_SPACE(ch)) ch = state.input.charCodeAt(++state.position);
				if (ch === 58) {
					ch = state.input.charCodeAt(++state.position);
					if (!is_WS_OR_EOL(ch)) throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
					if (atExplicitKey) {
						storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
						keyTag = keyNode = valueNode = null;
					}
					detected = true;
					atExplicitKey = false;
					allowCompact = false;
					keyTag = state.tag;
					keyNode = state.result;
				} else if (detected) throwError(state, "can not read an implicit mapping pair; a colon is missed");
				else {
					state.tag = _tag;
					state.anchor = _anchor;
					return true;
				}
			} else if (detected) throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
			else {
				state.tag = _tag;
				state.anchor = _anchor;
				return true;
			}
		}
		if (state.line === _line || state.lineIndent > nodeIndent) {
			if (atExplicitKey) {
				_keyLine = state.line;
				_keyLineStart = state.lineStart;
				_keyPos = state.position;
			}
			if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) if (atExplicitKey) keyNode = state.result;
			else valueNode = state.result;
			if (!atExplicitKey) {
				storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
				keyTag = keyNode = valueNode = null;
			}
			skipSeparationSpace(state, true, -1);
			ch = state.input.charCodeAt(state.position);
		}
		if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) throwError(state, "bad indentation of a mapping entry");
		else if (state.lineIndent < nodeIndent) break;
	}
	if (atExplicitKey) storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
	if (detected) {
		state.tag = _tag;
		state.anchor = _anchor;
		state.kind = "mapping";
		state.result = _result;
	}
	return detected;
}
function readTagProperty(state) {
	var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch = state.input.charCodeAt(state.position);
	if (ch !== 33) return false;
	if (state.tag !== null) throwError(state, "duplication of a tag property");
	ch = state.input.charCodeAt(++state.position);
	if (ch === 60) {
		isVerbatim = true;
		ch = state.input.charCodeAt(++state.position);
	} else if (ch === 33) {
		isNamed = true;
		tagHandle = "!!";
		ch = state.input.charCodeAt(++state.position);
	} else tagHandle = "!";
	_position = state.position;
	if (isVerbatim) {
		do
			ch = state.input.charCodeAt(++state.position);
		while (ch !== 0 && ch !== 62);
		if (state.position < state.length) {
			tagName = state.input.slice(_position, state.position);
			ch = state.input.charCodeAt(++state.position);
		} else throwError(state, "unexpected end of the stream within a verbatim tag");
	} else {
		while (ch !== 0 && !is_WS_OR_EOL(ch)) {
			if (ch === 33) if (!isNamed) {
				tagHandle = state.input.slice(_position - 1, state.position + 1);
				if (!PATTERN_TAG_HANDLE.test(tagHandle)) throwError(state, "named tag handle cannot contain such characters");
				isNamed = true;
				_position = state.position + 1;
			} else throwError(state, "tag suffix cannot contain exclamation marks");
			ch = state.input.charCodeAt(++state.position);
		}
		tagName = state.input.slice(_position, state.position);
		if (PATTERN_FLOW_INDICATORS.test(tagName)) throwError(state, "tag suffix cannot contain flow indicator characters");
	}
	if (tagName && !PATTERN_TAG_URI.test(tagName)) throwError(state, "tag name cannot contain such characters: " + tagName);
	try {
		tagName = decodeURIComponent(tagName);
	} catch (err) {
		throwError(state, "tag name is malformed: " + tagName);
	}
	if (isVerbatim) state.tag = tagName;
	else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) state.tag = state.tagMap[tagHandle] + tagName;
	else if (tagHandle === "!") state.tag = "!" + tagName;
	else if (tagHandle === "!!") state.tag = "tag:yaml.org,2002:" + tagName;
	else throwError(state, "undeclared tag handle \"" + tagHandle + "\"");
	return true;
}
function readAnchorProperty(state) {
	var _position, ch = state.input.charCodeAt(state.position);
	if (ch !== 38) return false;
	if (state.anchor !== null) throwError(state, "duplication of an anchor property");
	ch = state.input.charCodeAt(++state.position);
	_position = state.position;
	while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) ch = state.input.charCodeAt(++state.position);
	if (state.position === _position) throwError(state, "name of an anchor node must contain at least one character");
	state.anchor = state.input.slice(_position, state.position);
	return true;
}
function readAlias(state) {
	var _position, alias, ch = state.input.charCodeAt(state.position);
	if (ch !== 42) return false;
	ch = state.input.charCodeAt(++state.position);
	_position = state.position;
	while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) ch = state.input.charCodeAt(++state.position);
	if (state.position === _position) throwError(state, "name of an alias node must contain at least one character");
	alias = state.input.slice(_position, state.position);
	if (!_hasOwnProperty$1.call(state.anchorMap, alias)) throwError(state, "unidentified alias \"" + alias + "\"");
	state.result = state.anchorMap[alias];
	skipSeparationSpace(state, true, -1);
	return true;
}
function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
	var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, typeList, type, flowIndent, blockIndent;
	if (state.listener !== null) state.listener("open", state);
	state.tag = null;
	state.anchor = null;
	state.kind = null;
	state.result = null;
	allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
	if (allowToSeek) {
		if (skipSeparationSpace(state, true, -1)) {
			atNewLine = true;
			if (state.lineIndent > parentIndent) indentStatus = 1;
			else if (state.lineIndent === parentIndent) indentStatus = 0;
			else if (state.lineIndent < parentIndent) indentStatus = -1;
		}
	}
	if (indentStatus === 1) while (readTagProperty(state) || readAnchorProperty(state)) if (skipSeparationSpace(state, true, -1)) {
		atNewLine = true;
		allowBlockCollections = allowBlockStyles;
		if (state.lineIndent > parentIndent) indentStatus = 1;
		else if (state.lineIndent === parentIndent) indentStatus = 0;
		else if (state.lineIndent < parentIndent) indentStatus = -1;
	} else allowBlockCollections = false;
	if (allowBlockCollections) allowBlockCollections = atNewLine || allowCompact;
	if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
		if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) flowIndent = parentIndent;
		else flowIndent = parentIndent + 1;
		blockIndent = state.position - state.lineStart;
		if (indentStatus === 1) if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) hasContent = true;
		else {
			if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) hasContent = true;
			else if (readAlias(state)) {
				hasContent = true;
				if (state.tag !== null || state.anchor !== null) throwError(state, "alias node should not have any properties");
			} else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
				hasContent = true;
				if (state.tag === null) state.tag = "?";
			}
			if (state.anchor !== null) state.anchorMap[state.anchor] = state.result;
		}
		else if (indentStatus === 0) hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
	}
	if (state.tag === null) {
		if (state.anchor !== null) state.anchorMap[state.anchor] = state.result;
	} else if (state.tag === "?") {
		if (state.result !== null && state.kind !== "scalar") throwError(state, "unacceptable node kind for !<?> tag; it should be \"scalar\", not \"" + state.kind + "\"");
		for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
			type = state.implicitTypes[typeIndex];
			if (type.resolve(state.result)) {
				state.result = type.construct(state.result);
				state.tag = type.tag;
				if (state.anchor !== null) state.anchorMap[state.anchor] = state.result;
				break;
			}
		}
	} else if (state.tag !== "!") {
		if (_hasOwnProperty$1.call(state.typeMap[state.kind || "fallback"], state.tag)) type = state.typeMap[state.kind || "fallback"][state.tag];
		else {
			type = null;
			typeList = state.typeMap.multi[state.kind || "fallback"];
			for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
				type = typeList[typeIndex];
				break;
			}
		}
		if (!type) throwError(state, "unknown tag !<" + state.tag + ">");
		if (state.result !== null && type.kind !== state.kind) throwError(state, "unacceptable node kind for !<" + state.tag + "> tag; it should be \"" + type.kind + "\", not \"" + state.kind + "\"");
		if (!type.resolve(state.result, state.tag)) throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
		else {
			state.result = type.construct(state.result, state.tag);
			if (state.anchor !== null) state.anchorMap[state.anchor] = state.result;
		}
	}
	if (state.listener !== null) state.listener("close", state);
	return state.tag !== null || state.anchor !== null || hasContent;
}
function readDocument(state) {
	var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
	state.version = null;
	state.checkLineBreaks = state.legacy;
	state.tagMap = Object.create(null);
	state.anchorMap = Object.create(null);
	while ((ch = state.input.charCodeAt(state.position)) !== 0) {
		skipSeparationSpace(state, true, -1);
		ch = state.input.charCodeAt(state.position);
		if (state.lineIndent > 0 || ch !== 37) break;
		hasDirectives = true;
		ch = state.input.charCodeAt(++state.position);
		_position = state.position;
		while (ch !== 0 && !is_WS_OR_EOL(ch)) ch = state.input.charCodeAt(++state.position);
		directiveName = state.input.slice(_position, state.position);
		directiveArgs = [];
		if (directiveName.length < 1) throwError(state, "directive name must not be less than one character in length");
		while (ch !== 0) {
			while (is_WHITE_SPACE(ch)) ch = state.input.charCodeAt(++state.position);
			if (ch === 35) {
				do
					ch = state.input.charCodeAt(++state.position);
				while (ch !== 0 && !is_EOL(ch));
				break;
			}
			if (is_EOL(ch)) break;
			_position = state.position;
			while (ch !== 0 && !is_WS_OR_EOL(ch)) ch = state.input.charCodeAt(++state.position);
			directiveArgs.push(state.input.slice(_position, state.position));
		}
		if (ch !== 0) readLineBreak(state);
		if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) directiveHandlers[directiveName](state, directiveName, directiveArgs);
		else throwWarning(state, "unknown document directive \"" + directiveName + "\"");
	}
	skipSeparationSpace(state, true, -1);
	if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
		state.position += 3;
		skipSeparationSpace(state, true, -1);
	} else if (hasDirectives) throwError(state, "directives end mark is expected");
	composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
	skipSeparationSpace(state, true, -1);
	if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) throwWarning(state, "non-ASCII line breaks are interpreted as content");
	state.documents.push(state.result);
	if (state.position === state.lineStart && testDocumentSeparator(state)) {
		if (state.input.charCodeAt(state.position) === 46) {
			state.position += 3;
			skipSeparationSpace(state, true, -1);
		}
		return;
	}
	if (state.position < state.length - 1) throwError(state, "end of the stream or a document separator is expected");
	else return;
}
function loadDocuments(input, options) {
	input = String(input);
	options = options || {};
	if (input.length !== 0) {
		if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) input += "\n";
		if (input.charCodeAt(0) === 65279) input = input.slice(1);
	}
	var state = new State$1(input, options);
	var nullpos = input.indexOf("\0");
	if (nullpos !== -1) {
		state.position = nullpos;
		throwError(state, "null byte is not allowed in input");
	}
	state.input += "\0";
	while (state.input.charCodeAt(state.position) === 32) {
		state.lineIndent += 1;
		state.position += 1;
	}
	while (state.position < state.length - 1) readDocument(state);
	return state.documents;
}
function loadAll$1(input, iterator, options) {
	if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
		options = iterator;
		iterator = null;
	}
	var documents = loadDocuments(input, options);
	if (typeof iterator !== "function") return documents;
	for (var index = 0, length = documents.length; index < length; index += 1) iterator(documents[index]);
}
function load$1(input, options) {
	var documents = loadDocuments(input, options);
	if (documents.length === 0) return;
	else if (documents.length === 1) return documents[0];
	throw new exception("expected a single document in the stream, but found more");
}
var loader = {
	loadAll: loadAll$1,
	load: load$1
};
var _toString = Object.prototype.toString;
var _hasOwnProperty = Object.prototype.hasOwnProperty;
var CHAR_BOM = 65279;
var CHAR_TAB = 9;
var CHAR_LINE_FEED = 10;
var CHAR_CARRIAGE_RETURN = 13;
var CHAR_SPACE = 32;
var CHAR_EXCLAMATION = 33;
var CHAR_DOUBLE_QUOTE = 34;
var CHAR_SHARP = 35;
var CHAR_PERCENT = 37;
var CHAR_AMPERSAND = 38;
var CHAR_SINGLE_QUOTE = 39;
var CHAR_ASTERISK = 42;
var CHAR_COMMA = 44;
var CHAR_MINUS = 45;
var CHAR_COLON = 58;
var CHAR_EQUALS = 61;
var CHAR_GREATER_THAN = 62;
var CHAR_QUESTION = 63;
var CHAR_COMMERCIAL_AT = 64;
var CHAR_LEFT_SQUARE_BRACKET = 91;
var CHAR_RIGHT_SQUARE_BRACKET = 93;
var CHAR_GRAVE_ACCENT = 96;
var CHAR_LEFT_CURLY_BRACKET = 123;
var CHAR_VERTICAL_LINE = 124;
var CHAR_RIGHT_CURLY_BRACKET = 125;
var ESCAPE_SEQUENCES = {};
ESCAPE_SEQUENCES[0] = "\\0";
ESCAPE_SEQUENCES[7] = "\\a";
ESCAPE_SEQUENCES[8] = "\\b";
ESCAPE_SEQUENCES[9] = "\\t";
ESCAPE_SEQUENCES[10] = "\\n";
ESCAPE_SEQUENCES[11] = "\\v";
ESCAPE_SEQUENCES[12] = "\\f";
ESCAPE_SEQUENCES[13] = "\\r";
ESCAPE_SEQUENCES[27] = "\\e";
ESCAPE_SEQUENCES[34] = "\\\"";
ESCAPE_SEQUENCES[92] = "\\\\";
ESCAPE_SEQUENCES[133] = "\\N";
ESCAPE_SEQUENCES[160] = "\\_";
ESCAPE_SEQUENCES[8232] = "\\L";
ESCAPE_SEQUENCES[8233] = "\\P";
var DEPRECATED_BOOLEANS_SYNTAX = [
	"y",
	"Y",
	"yes",
	"Yes",
	"YES",
	"on",
	"On",
	"ON",
	"n",
	"N",
	"no",
	"No",
	"NO",
	"off",
	"Off",
	"OFF"
];
var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function compileStyleMap(schema, map) {
	var result, keys, index, length, tag, style, type;
	if (map === null) return {};
	result = {};
	keys = Object.keys(map);
	for (index = 0, length = keys.length; index < length; index += 1) {
		tag = keys[index];
		style = String(map[tag]);
		if (tag.slice(0, 2) === "!!") tag = "tag:yaml.org,2002:" + tag.slice(2);
		type = schema.compiledTypeMap["fallback"][tag];
		if (type && _hasOwnProperty.call(type.styleAliases, style)) style = type.styleAliases[style];
		result[tag] = style;
	}
	return result;
}
function encodeHex(character) {
	var string = character.toString(16).toUpperCase(), handle, length;
	if (character <= 255) {
		handle = "x";
		length = 2;
	} else if (character <= 65535) {
		handle = "u";
		length = 4;
	} else if (character <= 4294967295) {
		handle = "U";
		length = 8;
	} else throw new exception("code point within a string may not be greater than 0xFFFFFFFF");
	return "\\" + handle + common.repeat("0", length - string.length) + string;
}
var QUOTING_TYPE_SINGLE = 1, QUOTING_TYPE_DOUBLE = 2;
function State(options) {
	this.schema = options["schema"] || _default;
	this.indent = Math.max(1, options["indent"] || 2);
	this.noArrayIndent = options["noArrayIndent"] || false;
	this.skipInvalid = options["skipInvalid"] || false;
	this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
	this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
	this.sortKeys = options["sortKeys"] || false;
	this.lineWidth = options["lineWidth"] || 80;
	this.noRefs = options["noRefs"] || false;
	this.noCompatMode = options["noCompatMode"] || false;
	this.condenseFlow = options["condenseFlow"] || false;
	this.quotingType = options["quotingType"] === "\"" ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
	this.forceQuotes = options["forceQuotes"] || false;
	this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
	this.implicitTypes = this.schema.compiledImplicit;
	this.explicitTypes = this.schema.compiledExplicit;
	this.tag = null;
	this.result = "";
	this.duplicates = [];
	this.usedDuplicates = null;
}
function indentString(string, spaces) {
	var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
	while (position < length) {
		next = string.indexOf("\n", position);
		if (next === -1) {
			line = string.slice(position);
			position = length;
		} else {
			line = string.slice(position, next + 1);
			position = next + 1;
		}
		if (line.length && line !== "\n") result += ind;
		result += line;
	}
	return result;
}
function generateNextLine(state, level) {
	return "\n" + common.repeat(" ", state.indent * level);
}
function testImplicitResolving(state, str) {
	var index, length, type;
	for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
		type = state.implicitTypes[index];
		if (type.resolve(str)) return true;
	}
	return false;
}
function isWhitespace(c) {
	return c === CHAR_SPACE || c === CHAR_TAB;
}
function isPrintable(c) {
	return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== CHAR_BOM || 65536 <= c && c <= 1114111;
}
function isNsCharOrWhitespace(c) {
	return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
}
function isPlainSafe(c, prev, inblock) {
	var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
	var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
	return (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar;
}
function isPlainSafeFirst(c) {
	return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
}
function isPlainSafeLast(c) {
	return !isWhitespace(c) && c !== CHAR_COLON;
}
function codePointAt(string, pos) {
	var first = string.charCodeAt(pos), second;
	if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
		second = string.charCodeAt(pos + 1);
		if (second >= 56320 && second <= 57343) return (first - 55296) * 1024 + second - 56320 + 65536;
	}
	return first;
}
function needIndentIndicator(string) {
	return /^\n* /.test(string);
}
var STYLE_PLAIN = 1, STYLE_SINGLE = 2, STYLE_LITERAL = 3, STYLE_FOLDED = 4, STYLE_DOUBLE = 5;
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
	var i;
	var char = 0;
	var prevChar = null;
	var hasLineBreak = false;
	var hasFoldableLine = false;
	var shouldTrackWidth = lineWidth !== -1;
	var previousLineBreak = -1;
	var plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
	if (singleLineOnly || forceQuotes) for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
		char = codePointAt(string, i);
		if (!isPrintable(char)) return STYLE_DOUBLE;
		plain = plain && isPlainSafe(char, prevChar, inblock);
		prevChar = char;
	}
	else {
		for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
			char = codePointAt(string, i);
			if (char === CHAR_LINE_FEED) {
				hasLineBreak = true;
				if (shouldTrackWidth) {
					hasFoldableLine = hasFoldableLine || i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
					previousLineBreak = i;
				}
			} else if (!isPrintable(char)) return STYLE_DOUBLE;
			plain = plain && isPlainSafe(char, prevChar, inblock);
			prevChar = char;
		}
		hasFoldableLine = hasFoldableLine || shouldTrackWidth && i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
	}
	if (!hasLineBreak && !hasFoldableLine) {
		if (plain && !forceQuotes && !testAmbiguousType(string)) return STYLE_PLAIN;
		return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
	}
	if (indentPerLevel > 9 && needIndentIndicator(string)) return STYLE_DOUBLE;
	if (!forceQuotes) return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
	return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
}
function writeScalar(state, string, level, iskey, inblock) {
	state.dump = function() {
		if (string.length === 0) return state.quotingType === QUOTING_TYPE_DOUBLE ? "\"\"" : "''";
		if (!state.noCompatMode) {
			if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) return state.quotingType === QUOTING_TYPE_DOUBLE ? "\"" + string + "\"" : "'" + string + "'";
		}
		var indent = state.indent * Math.max(1, level);
		var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
		var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
		function testAmbiguity(string) {
			return testImplicitResolving(state, string);
		}
		switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {
			case STYLE_PLAIN: return string;
			case STYLE_SINGLE: return "'" + string.replace(/'/g, "''") + "'";
			case STYLE_LITERAL: return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
			case STYLE_FOLDED: return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
			case STYLE_DOUBLE: return "\"" + escapeString(string) + "\"";
			default: throw new exception("impossible error: invalid scalar style");
		}
	}();
}
function blockHeader(string, indentPerLevel) {
	var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
	var clip = string[string.length - 1] === "\n";
	return indentIndicator + (clip && (string[string.length - 2] === "\n" || string === "\n") ? "+" : clip ? "" : "-") + "\n";
}
function dropEndingNewline(string) {
	return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
}
function foldString(string, width) {
	var lineRe = /(\n+)([^\n]*)/g;
	var result = function() {
		var nextLF = string.indexOf("\n");
		nextLF = nextLF !== -1 ? nextLF : string.length;
		lineRe.lastIndex = nextLF;
		return foldLine(string.slice(0, nextLF), width);
	}();
	var prevMoreIndented = string[0] === "\n" || string[0] === " ";
	var moreIndented;
	var match;
	while (match = lineRe.exec(string)) {
		var prefix = match[1], line = match[2];
		moreIndented = line[0] === " ";
		result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
		prevMoreIndented = moreIndented;
	}
	return result;
}
function foldLine(line, width) {
	if (line === "" || line[0] === " ") return line;
	var breakRe = / [^ ]/g;
	var match;
	var start = 0, end, curr = 0, next = 0;
	var result = "";
	while (match = breakRe.exec(line)) {
		next = match.index;
		if (next - start > width) {
			end = curr > start ? curr : next;
			result += "\n" + line.slice(start, end);
			start = end + 1;
		}
		curr = next;
	}
	result += "\n";
	if (line.length - start > width && curr > start) result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
	else result += line.slice(start);
	return result.slice(1);
}
function escapeString(string) {
	var result = "";
	var char = 0;
	var escapeSeq;
	for (var i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
		char = codePointAt(string, i);
		escapeSeq = ESCAPE_SEQUENCES[char];
		if (!escapeSeq && isPrintable(char)) {
			result += string[i];
			if (char >= 65536) result += string[i + 1];
		} else result += escapeSeq || encodeHex(char);
	}
	return result;
}
function writeFlowSequence(state, level, object) {
	var _result = "", _tag = state.tag, index, length, value;
	for (index = 0, length = object.length; index < length; index += 1) {
		value = object[index];
		if (state.replacer) value = state.replacer.call(object, String(index), value);
		if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
			if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
			_result += state.dump;
		}
	}
	state.tag = _tag;
	state.dump = "[" + _result + "]";
}
function writeBlockSequence(state, level, object, compact) {
	var _result = "", _tag = state.tag, index, length, value;
	for (index = 0, length = object.length; index < length; index += 1) {
		value = object[index];
		if (state.replacer) value = state.replacer.call(object, String(index), value);
		if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
			if (!compact || _result !== "") _result += generateNextLine(state, level);
			if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) _result += "-";
			else _result += "- ";
			_result += state.dump;
		}
	}
	state.tag = _tag;
	state.dump = _result || "[]";
}
function writeFlowMapping(state, level, object) {
	var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
	for (index = 0, length = objectKeyList.length; index < length; index += 1) {
		pairBuffer = "";
		if (_result !== "") pairBuffer += ", ";
		if (state.condenseFlow) pairBuffer += "\"";
		objectKey = objectKeyList[index];
		objectValue = object[objectKey];
		if (state.replacer) objectValue = state.replacer.call(object, objectKey, objectValue);
		if (!writeNode(state, level, objectKey, false, false)) continue;
		if (state.dump.length > 1024) pairBuffer += "? ";
		pairBuffer += state.dump + (state.condenseFlow ? "\"" : "") + ":" + (state.condenseFlow ? "" : " ");
		if (!writeNode(state, level, objectValue, false, false)) continue;
		pairBuffer += state.dump;
		_result += pairBuffer;
	}
	state.tag = _tag;
	state.dump = "{" + _result + "}";
}
function writeBlockMapping(state, level, object, compact) {
	var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
	if (state.sortKeys === true) objectKeyList.sort();
	else if (typeof state.sortKeys === "function") objectKeyList.sort(state.sortKeys);
	else if (state.sortKeys) throw new exception("sortKeys must be a boolean or a function");
	for (index = 0, length = objectKeyList.length; index < length; index += 1) {
		pairBuffer = "";
		if (!compact || _result !== "") pairBuffer += generateNextLine(state, level);
		objectKey = objectKeyList[index];
		objectValue = object[objectKey];
		if (state.replacer) objectValue = state.replacer.call(object, objectKey, objectValue);
		if (!writeNode(state, level + 1, objectKey, true, true, true)) continue;
		explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
		if (explicitPair) if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) pairBuffer += "?";
		else pairBuffer += "? ";
		pairBuffer += state.dump;
		if (explicitPair) pairBuffer += generateNextLine(state, level);
		if (!writeNode(state, level + 1, objectValue, true, explicitPair)) continue;
		if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) pairBuffer += ":";
		else pairBuffer += ": ";
		pairBuffer += state.dump;
		_result += pairBuffer;
	}
	state.tag = _tag;
	state.dump = _result || "{}";
}
function detectType(state, object, explicit) {
	var _result, typeList = explicit ? state.explicitTypes : state.implicitTypes, index, length, type, style;
	for (index = 0, length = typeList.length; index < length; index += 1) {
		type = typeList[index];
		if ((type.instanceOf || type.predicate) && (!type.instanceOf || typeof object === "object" && object instanceof type.instanceOf) && (!type.predicate || type.predicate(object))) {
			if (explicit) if (type.multi && type.representName) state.tag = type.representName(object);
			else state.tag = type.tag;
			else state.tag = "?";
			if (type.represent) {
				style = state.styleMap[type.tag] || type.defaultStyle;
				if (_toString.call(type.represent) === "[object Function]") _result = type.represent(object, style);
				else if (_hasOwnProperty.call(type.represent, style)) _result = type.represent[style](object, style);
				else throw new exception("!<" + type.tag + "> tag resolver accepts not \"" + style + "\" style");
				state.dump = _result;
			}
			return true;
		}
	}
	return false;
}
function writeNode(state, level, object, block, compact, iskey, isblockseq) {
	state.tag = null;
	state.dump = object;
	if (!detectType(state, object, false)) detectType(state, object, true);
	var type = _toString.call(state.dump);
	var inblock = block;
	var tagStr;
	if (block) block = state.flowLevel < 0 || state.flowLevel > level;
	var objectOrArray = type === "[object Object]" || type === "[object Array]", duplicateIndex, duplicate;
	if (objectOrArray) {
		duplicateIndex = state.duplicates.indexOf(object);
		duplicate = duplicateIndex !== -1;
	}
	if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) compact = false;
	if (duplicate && state.usedDuplicates[duplicateIndex]) state.dump = "*ref_" + duplicateIndex;
	else {
		if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) state.usedDuplicates[duplicateIndex] = true;
		if (type === "[object Object]") if (block && Object.keys(state.dump).length !== 0) {
			writeBlockMapping(state, level, state.dump, compact);
			if (duplicate) state.dump = "&ref_" + duplicateIndex + state.dump;
		} else {
			writeFlowMapping(state, level, state.dump);
			if (duplicate) state.dump = "&ref_" + duplicateIndex + " " + state.dump;
		}
		else if (type === "[object Array]") if (block && state.dump.length !== 0) {
			if (state.noArrayIndent && !isblockseq && level > 0) writeBlockSequence(state, level - 1, state.dump, compact);
			else writeBlockSequence(state, level, state.dump, compact);
			if (duplicate) state.dump = "&ref_" + duplicateIndex + state.dump;
		} else {
			writeFlowSequence(state, level, state.dump);
			if (duplicate) state.dump = "&ref_" + duplicateIndex + " " + state.dump;
		}
		else if (type === "[object String]") {
			if (state.tag !== "?") writeScalar(state, state.dump, level, iskey, inblock);
		} else if (type === "[object Undefined]") return false;
		else {
			if (state.skipInvalid) return false;
			throw new exception("unacceptable kind of an object to dump " + type);
		}
		if (state.tag !== null && state.tag !== "?") {
			tagStr = encodeURI(state.tag[0] === "!" ? state.tag.slice(1) : state.tag).replace(/!/g, "%21");
			if (state.tag[0] === "!") tagStr = "!" + tagStr;
			else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") tagStr = "!!" + tagStr.slice(18);
			else tagStr = "!<" + tagStr + ">";
			state.dump = tagStr + " " + state.dump;
		}
	}
	return true;
}
function getDuplicateReferences(object, state) {
	var objects = [], duplicatesIndexes = [], index, length;
	inspectNode(object, objects, duplicatesIndexes);
	for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) state.duplicates.push(objects[duplicatesIndexes[index]]);
	state.usedDuplicates = new Array(length);
}
function inspectNode(object, objects, duplicatesIndexes) {
	var objectKeyList, index, length;
	if (object !== null && typeof object === "object") {
		index = objects.indexOf(object);
		if (index !== -1) {
			if (duplicatesIndexes.indexOf(index) === -1) duplicatesIndexes.push(index);
		} else {
			objects.push(object);
			if (Array.isArray(object)) for (index = 0, length = object.length; index < length; index += 1) inspectNode(object[index], objects, duplicatesIndexes);
			else {
				objectKeyList = Object.keys(object);
				for (index = 0, length = objectKeyList.length; index < length; index += 1) inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
			}
		}
	}
}
function dump$1(input, options) {
	options = options || {};
	var state = new State(options);
	if (!state.noRefs) getDuplicateReferences(input, state);
	var value = input;
	if (state.replacer) value = state.replacer.call({ "": value }, "", value);
	if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
	return "";
}
var dumper = { dump: dump$1 };
function renamed(from, to) {
	return function() {
		throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
	};
}
var jsYaml = {
	Type: type,
	Schema: schema,
	FAILSAFE_SCHEMA: failsafe,
	JSON_SCHEMA: json,
	CORE_SCHEMA: core,
	DEFAULT_SCHEMA: _default,
	load: loader.load,
	loadAll: loader.loadAll,
	dump: dumper.dump,
	YAMLException: exception,
	types: {
		binary,
		float,
		map,
		null: _null,
		pairs,
		set,
		timestamp,
		bool,
		int,
		merge,
		omap,
		seq,
		str
	},
	safeLoad: renamed("safeLoad", "load"),
	safeLoadAll: renamed("safeLoadAll", "loadAll"),
	safeDump: renamed("safeDump", "dump")
};
//#endregion
//#region ../../ImageParser/demo/opencv-browser-shim.js
var import_clipper = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	/*******************************************************************************
	*                                                                              *
	* Author    :  Angus Johnson                                                   *
	* Version   :  6.4.2                                                           *
	* Date      :  27 February 2017                                                *
	* Website   :  http://www.angusj.com                                           *
	* Copyright :  Angus Johnson 2010-2017                                         *
	*                                                                              *
	* License:                                                                     *
	* Use, modification & distribution is subject to Boost Software License Ver 1. *
	* http://www.boost.org/LICENSE_1_0.txt                                         *
	*                                                                              *
	* Attributions:                                                                *
	* The code in this library is an extension of Bala Vatti's clipping algorithm: *
	* "A generic solution to polygon clipping"                                     *
	* Communications of the ACM, Vol 35, Issue 7 (July 1992) pp 56-63.             *
	* http://portal.acm.org/citation.cfm?id=129906                                 *
	*                                                                              *
	* Computer graphics and geometric modeling: implementation and algorithms      *
	* By Max K. Agoston                                                            *
	* Springer; 1 edition (January 4, 2005)                                        *
	* http://books.google.com/books?q=vatti+clipping+agoston                       *
	*                                                                              *
	* See also:                                                                    *
	* "Polygon Offsetting by Computing Winding Numbers"                            *
	* Paper no. DETC2005-85513 pp. 565-575                                         *
	* ASME 2005 International Design Engineering Technical Conferences             *
	* and Computers and Information in Engineering Conference (IDETC/CIE2005)      *
	* September 24-28, 2005 , Long Beach, California, USA                          *
	* http://www.me.berkeley.edu/~mcmains/pubs/DAC05OffsetPolygon.pdf              *
	*                                                                              *
	*******************************************************************************/
	/*******************************************************************************
	*                                                                              *
	* Author    :  Timo                                                            *
	* Version   :  6.4.2.2                                                         *
	* Date      :  8 September 2017                                                 *
	*                                                                              *
	* This is a translation of the C# Clipper library to Javascript.               *
	* Int128 struct of C# is implemented using JSBN of Tom Wu.                     *
	* Because Javascript lacks support for 64-bit integers, the space              *
	* is a little more restricted than in C# version.                              *
	*                                                                              *
	* C# version has support for coordinate space:                                 *
	* +-4611686018427387903 ( sqrt(2^127 -1)/2 )                                   *
	* while Javascript version has support for space:                              *
	* +-4503599627370495 ( sqrt(2^106 -1)/2 )                                      *
	*                                                                              *
	* Tom Wu's JSBN proved to be the fastest big integer library:                  *
	* http://jsperf.com/big-integer-library-test                                   *
	*                                                                              *
	* This class can be made simpler when (if ever) 64-bit integer support comes   *
	* or floating point Clipper is released.                                       *
	*                                                                              *
	*******************************************************************************/
	/*******************************************************************************
	*                                                                              *
	* Basic JavaScript BN library - subset useful for RSA encryption.              *
	* http://www-cs-students.stanford.edu/~tjw/jsbn/                               *
	* Copyright (c) 2005  Tom Wu                                                   *
	* All Rights Reserved.                                                         *
	* See "LICENSE" for details:                                                   *
	* http://www-cs-students.stanford.edu/~tjw/jsbn/LICENSE                        *
	*                                                                              *
	*******************************************************************************/
	(function() {
		"use strict";
		var ClipperLib = {};
		ClipperLib.version = "6.4.2.2";
		ClipperLib.use_lines = true;
		ClipperLib.use_xyz = false;
		var isNode = false;
		if (typeof module !== "undefined" && module.exports) {
			module.exports = ClipperLib;
			isNode = true;
		} else {
			if (typeof define === "function" && define.amd) define(ClipperLib);
			if (typeof document !== "undefined") window.ClipperLib = ClipperLib;
			else self["ClipperLib"] = ClipperLib;
		}
		var navigator_appName;
		if (!isNode) {
			var nav = navigator.userAgent.toString().toLowerCase();
			navigator_appName = navigator.appName;
		} else {
			var nav = "chrome";
			navigator_appName = "Netscape";
		}
		var browser = {};
		if (nav.indexOf("chrome") != -1 && nav.indexOf("chromium") == -1) browser.chrome = 1;
		else browser.chrome = 0;
		if (nav.indexOf("chromium") != -1) browser.chromium = 1;
		else browser.chromium = 0;
		if (nav.indexOf("safari") != -1 && nav.indexOf("chrome") == -1 && nav.indexOf("chromium") == -1) browser.safari = 1;
		else browser.safari = 0;
		if (nav.indexOf("firefox") != -1) browser.firefox = 1;
		else browser.firefox = 0;
		if (nav.indexOf("firefox/17") != -1) browser.firefox17 = 1;
		else browser.firefox17 = 0;
		if (nav.indexOf("firefox/15") != -1) browser.firefox15 = 1;
		else browser.firefox15 = 0;
		if (nav.indexOf("firefox/3") != -1) browser.firefox3 = 1;
		else browser.firefox3 = 0;
		if (nav.indexOf("opera") != -1) browser.opera = 1;
		else browser.opera = 0;
		if (nav.indexOf("msie 10") != -1) browser.msie10 = 1;
		else browser.msie10 = 0;
		if (nav.indexOf("msie 9") != -1) browser.msie9 = 1;
		else browser.msie9 = 0;
		if (nav.indexOf("msie 8") != -1) browser.msie8 = 1;
		else browser.msie8 = 0;
		if (nav.indexOf("msie 7") != -1) browser.msie7 = 1;
		else browser.msie7 = 0;
		if (nav.indexOf("msie ") != -1) browser.msie = 1;
		else browser.msie = 0;
		ClipperLib.biginteger_used = null;
		var dbits;
		var j_lm = true;
		/**
		* @constructor
		*/
		function BigInteger(a, b, c) {
			ClipperLib.biginteger_used = 1;
			if (a != null) if ("number" == typeof a && "undefined" == typeof b) this.fromInt(a);
			else if ("number" == typeof a) this.fromNumber(a, b, c);
			else if (b == null && "string" != typeof a) this.fromString(a, 256);
			else this.fromString(a, b);
		}
		function nbi() {
			return new BigInteger(null, void 0, void 0);
		}
		function am1(i, x, w, j, c, n) {
			while (--n >= 0) {
				var v = x * this[i++] + w[j] + c;
				c = Math.floor(v / 67108864);
				w[j++] = v & 67108863;
			}
			return c;
		}
		function am2(i, x, w, j, c, n) {
			var xl = x & 32767, xh = x >> 15;
			while (--n >= 0) {
				var l = this[i] & 32767;
				var h = this[i++] >> 15;
				var m = xh * l + h * xl;
				l = xl * l + ((m & 32767) << 15) + w[j] + (c & 1073741823);
				c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
				w[j++] = l & 1073741823;
			}
			return c;
		}
		function am3(i, x, w, j, c, n) {
			var xl = x & 16383, xh = x >> 14;
			while (--n >= 0) {
				var l = this[i] & 16383;
				var h = this[i++] >> 14;
				var m = xh * l + h * xl;
				l = xl * l + ((m & 16383) << 14) + w[j] + c;
				c = (l >> 28) + (m >> 14) + xh * h;
				w[j++] = l & 268435455;
			}
			return c;
		}
		if (j_lm && navigator_appName == "Microsoft Internet Explorer") {
			BigInteger.prototype.am = am2;
			dbits = 30;
		} else if (j_lm && navigator_appName != "Netscape") {
			BigInteger.prototype.am = am1;
			dbits = 26;
		} else {
			BigInteger.prototype.am = am3;
			dbits = 28;
		}
		BigInteger.prototype.DB = dbits;
		BigInteger.prototype.DM = (1 << dbits) - 1;
		BigInteger.prototype.DV = 1 << dbits;
		var BI_FP = 52;
		BigInteger.prototype.FV = Math.pow(2, BI_FP);
		BigInteger.prototype.F1 = BI_FP - dbits;
		BigInteger.prototype.F2 = 2 * dbits - BI_FP;
		var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
		var BI_RC = new Array();
		var rr = "0".charCodeAt(0), vv;
		for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
		rr = "a".charCodeAt(0);
		for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
		rr = "A".charCodeAt(0);
		for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
		function int2char(n) {
			return BI_RM.charAt(n);
		}
		function intAt(s, i) {
			var c = BI_RC[s.charCodeAt(i)];
			return c == null ? -1 : c;
		}
		function bnpCopyTo(r) {
			for (var i = this.t - 1; i >= 0; --i) r[i] = this[i];
			r.t = this.t;
			r.s = this.s;
		}
		function bnpFromInt(x) {
			this.t = 1;
			this.s = x < 0 ? -1 : 0;
			if (x > 0) this[0] = x;
			else if (x < -1) this[0] = x + this.DV;
			else this.t = 0;
		}
		function nbv(i) {
			var r = nbi();
			r.fromInt(i);
			return r;
		}
		function bnpFromString(s, b) {
			var k;
			if (b == 16) k = 4;
			else if (b == 8) k = 3;
			else if (b == 256) k = 8;
			else if (b == 2) k = 1;
			else if (b == 32) k = 5;
			else if (b == 4) k = 2;
			else {
				this.fromRadix(s, b);
				return;
			}
			this.t = 0;
			this.s = 0;
			var i = s.length, mi = false, sh = 0;
			while (--i >= 0) {
				var x = k == 8 ? s[i] & 255 : intAt(s, i);
				if (x < 0) {
					if (s.charAt(i) == "-") mi = true;
					continue;
				}
				mi = false;
				if (sh == 0) this[this.t++] = x;
				else if (sh + k > this.DB) {
					this[this.t - 1] |= (x & (1 << this.DB - sh) - 1) << sh;
					this[this.t++] = x >> this.DB - sh;
				} else this[this.t - 1] |= x << sh;
				sh += k;
				if (sh >= this.DB) sh -= this.DB;
			}
			if (k == 8 && (s[0] & 128) != 0) {
				this.s = -1;
				if (sh > 0) this[this.t - 1] |= (1 << this.DB - sh) - 1 << sh;
			}
			this.clamp();
			if (mi) BigInteger.ZERO.subTo(this, this);
		}
		function bnpClamp() {
			var c = this.s & this.DM;
			while (this.t > 0 && this[this.t - 1] == c) --this.t;
		}
		function bnToString(b) {
			if (this.s < 0) return "-" + this.negate().toString(b);
			var k;
			if (b == 16) k = 4;
			else if (b == 8) k = 3;
			else if (b == 2) k = 1;
			else if (b == 32) k = 5;
			else if (b == 4) k = 2;
			else return this.toRadix(b);
			var km = (1 << k) - 1, d, m = false, r = "", i = this.t;
			var p = this.DB - i * this.DB % k;
			if (i-- > 0) {
				if (p < this.DB && (d = this[i] >> p) > 0) {
					m = true;
					r = int2char(d);
				}
				while (i >= 0) {
					if (p < k) {
						d = (this[i] & (1 << p) - 1) << k - p;
						d |= this[--i] >> (p += this.DB - k);
					} else {
						d = this[i] >> (p -= k) & km;
						if (p <= 0) {
							p += this.DB;
							--i;
						}
					}
					if (d > 0) m = true;
					if (m) r += int2char(d);
				}
			}
			return m ? r : "0";
		}
		function bnNegate() {
			var r = nbi();
			BigInteger.ZERO.subTo(this, r);
			return r;
		}
		function bnAbs() {
			return this.s < 0 ? this.negate() : this;
		}
		function bnCompareTo(a) {
			var r = this.s - a.s;
			if (r != 0) return r;
			var i = this.t;
			r = i - a.t;
			if (r != 0) return this.s < 0 ? -r : r;
			while (--i >= 0) if ((r = this[i] - a[i]) != 0) return r;
			return 0;
		}
		function nbits(x) {
			var r = 1, t;
			if ((t = x >>> 16) != 0) {
				x = t;
				r += 16;
			}
			if ((t = x >> 8) != 0) {
				x = t;
				r += 8;
			}
			if ((t = x >> 4) != 0) {
				x = t;
				r += 4;
			}
			if ((t = x >> 2) != 0) {
				x = t;
				r += 2;
			}
			if ((t = x >> 1) != 0) {
				x = t;
				r += 1;
			}
			return r;
		}
		function bnBitLength() {
			if (this.t <= 0) return 0;
			return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ this.s & this.DM);
		}
		function bnpDLShiftTo(n, r) {
			var i;
			for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i];
			for (i = n - 1; i >= 0; --i) r[i] = 0;
			r.t = this.t + n;
			r.s = this.s;
		}
		function bnpDRShiftTo(n, r) {
			for (var i = n; i < this.t; ++i) r[i - n] = this[i];
			r.t = Math.max(this.t - n, 0);
			r.s = this.s;
		}
		function bnpLShiftTo(n, r) {
			var bs = n % this.DB;
			var cbs = this.DB - bs;
			var bm = (1 << cbs) - 1;
			var ds = Math.floor(n / this.DB), c = this.s << bs & this.DM, i;
			for (i = this.t - 1; i >= 0; --i) {
				r[i + ds + 1] = this[i] >> cbs | c;
				c = (this[i] & bm) << bs;
			}
			for (i = ds - 1; i >= 0; --i) r[i] = 0;
			r[ds] = c;
			r.t = this.t + ds + 1;
			r.s = this.s;
			r.clamp();
		}
		function bnpRShiftTo(n, r) {
			r.s = this.s;
			var ds = Math.floor(n / this.DB);
			if (ds >= this.t) {
				r.t = 0;
				return;
			}
			var bs = n % this.DB;
			var cbs = this.DB - bs;
			var bm = (1 << bs) - 1;
			r[0] = this[ds] >> bs;
			for (var i = ds + 1; i < this.t; ++i) {
				r[i - ds - 1] |= (this[i] & bm) << cbs;
				r[i - ds] = this[i] >> bs;
			}
			if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
			r.t = this.t - ds;
			r.clamp();
		}
		function bnpSubTo(a, r) {
			var i = 0, c = 0, m = Math.min(a.t, this.t);
			while (i < m) {
				c += this[i] - a[i];
				r[i++] = c & this.DM;
				c >>= this.DB;
			}
			if (a.t < this.t) {
				c -= a.s;
				while (i < this.t) {
					c += this[i];
					r[i++] = c & this.DM;
					c >>= this.DB;
				}
				c += this.s;
			} else {
				c += this.s;
				while (i < a.t) {
					c -= a[i];
					r[i++] = c & this.DM;
					c >>= this.DB;
				}
				c -= a.s;
			}
			r.s = c < 0 ? -1 : 0;
			if (c < -1) r[i++] = this.DV + c;
			else if (c > 0) r[i++] = c;
			r.t = i;
			r.clamp();
		}
		function bnpMultiplyTo(a, r) {
			var x = this.abs(), y = a.abs();
			var i = x.t;
			r.t = i + y.t;
			while (--i >= 0) r[i] = 0;
			for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
			r.s = 0;
			r.clamp();
			if (this.s != a.s) BigInteger.ZERO.subTo(r, r);
		}
		function bnpSquareTo(r) {
			var x = this.abs();
			var i = r.t = 2 * x.t;
			while (--i >= 0) r[i] = 0;
			for (i = 0; i < x.t - 1; ++i) {
				var c = x.am(i, x[i], r, 2 * i, 0, 1);
				if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
					r[i + x.t] -= x.DV;
					r[i + x.t + 1] = 1;
				}
			}
			if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
			r.s = 0;
			r.clamp();
		}
		function bnpDivRemTo(m, q, r) {
			var pm = m.abs();
			if (pm.t <= 0) return;
			var pt = this.abs();
			if (pt.t < pm.t) {
				if (q != null) q.fromInt(0);
				if (r != null) this.copyTo(r);
				return;
			}
			if (r == null) r = nbi();
			var y = nbi(), ts = this.s, ms = m.s;
			var nsh = this.DB - nbits(pm[pm.t - 1]);
			if (nsh > 0) {
				pm.lShiftTo(nsh, y);
				pt.lShiftTo(nsh, r);
			} else {
				pm.copyTo(y);
				pt.copyTo(r);
			}
			var ys = y.t;
			var y0 = y[ys - 1];
			if (y0 == 0) return;
			var yt = y0 * (1 << this.F1) + (ys > 1 ? y[ys - 2] >> this.F2 : 0);
			var d1 = this.FV / yt, d2 = (1 << this.F1) / yt, e = 1 << this.F2;
			var i = r.t, j = i - ys, t = q == null ? nbi() : q;
			y.dlShiftTo(j, t);
			if (r.compareTo(t) >= 0) {
				r[r.t++] = 1;
				r.subTo(t, r);
			}
			BigInteger.ONE.dlShiftTo(ys, t);
			t.subTo(y, y);
			while (y.t < ys) y[y.t++] = 0;
			while (--j >= 0) {
				var qd = r[--i] == y0 ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
				if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {
					y.dlShiftTo(j, t);
					r.subTo(t, r);
					while (r[i] < --qd) r.subTo(t, r);
				}
			}
			if (q != null) {
				r.drShiftTo(ys, q);
				if (ts != ms) BigInteger.ZERO.subTo(q, q);
			}
			r.t = ys;
			r.clamp();
			if (nsh > 0) r.rShiftTo(nsh, r);
			if (ts < 0) BigInteger.ZERO.subTo(r, r);
		}
		function bnMod(a) {
			var r = nbi();
			this.abs().divRemTo(a, null, r);
			if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r);
			return r;
		}
		/**
		* @constructor
		*/
		function Classic(m) {
			this.m = m;
		}
		function cConvert(x) {
			if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
			else return x;
		}
		function cRevert(x) {
			return x;
		}
		function cReduce(x) {
			x.divRemTo(this.m, null, x);
		}
		function cMulTo(x, y, r) {
			x.multiplyTo(y, r);
			this.reduce(r);
		}
		function cSqrTo(x, r) {
			x.squareTo(r);
			this.reduce(r);
		}
		Classic.prototype.convert = cConvert;
		Classic.prototype.revert = cRevert;
		Classic.prototype.reduce = cReduce;
		Classic.prototype.mulTo = cMulTo;
		Classic.prototype.sqrTo = cSqrTo;
		function bnpInvDigit() {
			if (this.t < 1) return 0;
			var x = this[0];
			if ((x & 1) == 0) return 0;
			var y = x & 3;
			y = y * (2 - (x & 15) * y) & 15;
			y = y * (2 - (x & 255) * y) & 255;
			y = y * (2 - ((x & 65535) * y & 65535)) & 65535;
			y = y * (2 - x * y % this.DV) % this.DV;
			return y > 0 ? this.DV - y : -y;
		}
		/**
		* @constructor
		*/
		function Montgomery(m) {
			this.m = m;
			this.mp = m.invDigit();
			this.mpl = this.mp & 32767;
			this.mph = this.mp >> 15;
			this.um = (1 << m.DB - 15) - 1;
			this.mt2 = 2 * m.t;
		}
		function montConvert(x) {
			var r = nbi();
			x.abs().dlShiftTo(this.m.t, r);
			r.divRemTo(this.m, null, r);
			if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r);
			return r;
		}
		function montRevert(x) {
			var r = nbi();
			x.copyTo(r);
			this.reduce(r);
			return r;
		}
		function montReduce(x) {
			while (x.t <= this.mt2) x[x.t++] = 0;
			for (var i = 0; i < this.m.t; ++i) {
				var j = x[i] & 32767;
				var u0 = j * this.mpl + ((j * this.mph + (x[i] >> 15) * this.mpl & this.um) << 15) & x.DM;
				j = i + this.m.t;
				x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
				while (x[j] >= x.DV) {
					x[j] -= x.DV;
					x[++j]++;
				}
			}
			x.clamp();
			x.drShiftTo(this.m.t, x);
			if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
		}
		function montSqrTo(x, r) {
			x.squareTo(r);
			this.reduce(r);
		}
		function montMulTo(x, y, r) {
			x.multiplyTo(y, r);
			this.reduce(r);
		}
		Montgomery.prototype.convert = montConvert;
		Montgomery.prototype.revert = montRevert;
		Montgomery.prototype.reduce = montReduce;
		Montgomery.prototype.mulTo = montMulTo;
		Montgomery.prototype.sqrTo = montSqrTo;
		function bnpIsEven() {
			return (this.t > 0 ? this[0] & 1 : this.s) == 0;
		}
		function bnpExp(e, z) {
			if (e > 4294967295 || e < 1) return BigInteger.ONE;
			var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e) - 1;
			g.copyTo(r);
			while (--i >= 0) {
				z.sqrTo(r, r2);
				if ((e & 1 << i) > 0) z.mulTo(r2, g, r);
				else {
					var t = r;
					r = r2;
					r2 = t;
				}
			}
			return z.revert(r);
		}
		function bnModPowInt(e, m) {
			var z;
			if (e < 256 || m.isEven()) z = new Classic(m);
			else z = new Montgomery(m);
			return this.exp(e, z);
		}
		BigInteger.prototype.copyTo = bnpCopyTo;
		BigInteger.prototype.fromInt = bnpFromInt;
		BigInteger.prototype.fromString = bnpFromString;
		BigInteger.prototype.clamp = bnpClamp;
		BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
		BigInteger.prototype.drShiftTo = bnpDRShiftTo;
		BigInteger.prototype.lShiftTo = bnpLShiftTo;
		BigInteger.prototype.rShiftTo = bnpRShiftTo;
		BigInteger.prototype.subTo = bnpSubTo;
		BigInteger.prototype.multiplyTo = bnpMultiplyTo;
		BigInteger.prototype.squareTo = bnpSquareTo;
		BigInteger.prototype.divRemTo = bnpDivRemTo;
		BigInteger.prototype.invDigit = bnpInvDigit;
		BigInteger.prototype.isEven = bnpIsEven;
		BigInteger.prototype.exp = bnpExp;
		BigInteger.prototype.toString = bnToString;
		BigInteger.prototype.negate = bnNegate;
		BigInteger.prototype.abs = bnAbs;
		BigInteger.prototype.compareTo = bnCompareTo;
		BigInteger.prototype.bitLength = bnBitLength;
		BigInteger.prototype.mod = bnMod;
		BigInteger.prototype.modPowInt = bnModPowInt;
		BigInteger.ZERO = nbv(0);
		BigInteger.ONE = nbv(1);
		function bnClone() {
			var r = nbi();
			this.copyTo(r);
			return r;
		}
		function bnIntValue() {
			if (this.s < 0) {
				if (this.t == 1) return this[0] - this.DV;
				else if (this.t == 0) return -1;
			} else if (this.t == 1) return this[0];
			else if (this.t == 0) return 0;
			return (this[1] & (1 << 32 - this.DB) - 1) << this.DB | this[0];
		}
		function bnByteValue() {
			return this.t == 0 ? this.s : this[0] << 24 >> 24;
		}
		function bnShortValue() {
			return this.t == 0 ? this.s : this[0] << 16 >> 16;
		}
		function bnpChunkSize(r) {
			return Math.floor(Math.LN2 * this.DB / Math.log(r));
		}
		function bnSigNum() {
			if (this.s < 0) return -1;
			else if (this.t <= 0 || this.t == 1 && this[0] <= 0) return 0;
			else return 1;
		}
		function bnpToRadix(b) {
			if (b == null) b = 10;
			if (this.signum() == 0 || b < 2 || b > 36) return "0";
			var cs = this.chunkSize(b);
			var a = Math.pow(b, cs);
			var d = nbv(a), y = nbi(), z = nbi(), r = "";
			this.divRemTo(d, y, z);
			while (y.signum() > 0) {
				r = (a + z.intValue()).toString(b).substr(1) + r;
				y.divRemTo(d, y, z);
			}
			return z.intValue().toString(b) + r;
		}
		function bnpFromRadix(s, b) {
			this.fromInt(0);
			if (b == null) b = 10;
			var cs = this.chunkSize(b);
			var d = Math.pow(b, cs), mi = false, j = 0, w = 0;
			for (var i = 0; i < s.length; ++i) {
				var x = intAt(s, i);
				if (x < 0) {
					if (s.charAt(i) == "-" && this.signum() == 0) mi = true;
					continue;
				}
				w = b * w + x;
				if (++j >= cs) {
					this.dMultiply(d);
					this.dAddOffset(w, 0);
					j = 0;
					w = 0;
				}
			}
			if (j > 0) {
				this.dMultiply(Math.pow(b, j));
				this.dAddOffset(w, 0);
			}
			if (mi) BigInteger.ZERO.subTo(this, this);
		}
		function bnpFromNumber(a, b, c) {
			if ("number" == typeof b) if (a < 2) this.fromInt(1);
			else {
				this.fromNumber(a, c);
				if (!this.testBit(a - 1)) this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
				if (this.isEven()) this.dAddOffset(1, 0);
				while (!this.isProbablePrime(b)) {
					this.dAddOffset(2, 0);
					if (this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
				}
			}
			else {
				var x = new Array(), t = a & 7;
				x.length = (a >> 3) + 1;
				b.nextBytes(x);
				if (t > 0) x[0] &= (1 << t) - 1;
				else x[0] = 0;
				this.fromString(x, 256);
			}
		}
		function bnToByteArray() {
			var i = this.t, r = new Array();
			r[0] = this.s;
			var p = this.DB - i * this.DB % 8, d, k = 0;
			if (i-- > 0) {
				if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p) r[k++] = d | this.s << this.DB - p;
				while (i >= 0) {
					if (p < 8) {
						d = (this[i] & (1 << p) - 1) << 8 - p;
						d |= this[--i] >> (p += this.DB - 8);
					} else {
						d = this[i] >> (p -= 8) & 255;
						if (p <= 0) {
							p += this.DB;
							--i;
						}
					}
					if ((d & 128) != 0) d |= -256;
					if (k == 0 && (this.s & 128) != (d & 128)) ++k;
					if (k > 0 || d != this.s) r[k++] = d;
				}
			}
			return r;
		}
		function bnEquals(a) {
			return this.compareTo(a) == 0;
		}
		function bnMin(a) {
			return this.compareTo(a) < 0 ? this : a;
		}
		function bnMax(a) {
			return this.compareTo(a) > 0 ? this : a;
		}
		function bnpBitwiseTo(a, op, r) {
			var i, f, m = Math.min(a.t, this.t);
			for (i = 0; i < m; ++i) r[i] = op(this[i], a[i]);
			if (a.t < this.t) {
				f = a.s & this.DM;
				for (i = m; i < this.t; ++i) r[i] = op(this[i], f);
				r.t = this.t;
			} else {
				f = this.s & this.DM;
				for (i = m; i < a.t; ++i) r[i] = op(f, a[i]);
				r.t = a.t;
			}
			r.s = op(this.s, a.s);
			r.clamp();
		}
		function op_and(x, y) {
			return x & y;
		}
		function bnAnd(a) {
			var r = nbi();
			this.bitwiseTo(a, op_and, r);
			return r;
		}
		function op_or(x, y) {
			return x | y;
		}
		function bnOr(a) {
			var r = nbi();
			this.bitwiseTo(a, op_or, r);
			return r;
		}
		function op_xor(x, y) {
			return x ^ y;
		}
		function bnXor(a) {
			var r = nbi();
			this.bitwiseTo(a, op_xor, r);
			return r;
		}
		function op_andnot(x, y) {
			return x & ~y;
		}
		function bnAndNot(a) {
			var r = nbi();
			this.bitwiseTo(a, op_andnot, r);
			return r;
		}
		function bnNot() {
			var r = nbi();
			for (var i = 0; i < this.t; ++i) r[i] = this.DM & ~this[i];
			r.t = this.t;
			r.s = ~this.s;
			return r;
		}
		function bnShiftLeft(n) {
			var r = nbi();
			if (n < 0) this.rShiftTo(-n, r);
			else this.lShiftTo(n, r);
			return r;
		}
		function bnShiftRight(n) {
			var r = nbi();
			if (n < 0) this.lShiftTo(-n, r);
			else this.rShiftTo(n, r);
			return r;
		}
		function lbit(x) {
			if (x == 0) return -1;
			var r = 0;
			if ((x & 65535) == 0) {
				x >>= 16;
				r += 16;
			}
			if ((x & 255) == 0) {
				x >>= 8;
				r += 8;
			}
			if ((x & 15) == 0) {
				x >>= 4;
				r += 4;
			}
			if ((x & 3) == 0) {
				x >>= 2;
				r += 2;
			}
			if ((x & 1) == 0) ++r;
			return r;
		}
		function bnGetLowestSetBit() {
			for (var i = 0; i < this.t; ++i) if (this[i] != 0) return i * this.DB + lbit(this[i]);
			if (this.s < 0) return this.t * this.DB;
			return -1;
		}
		function cbit(x) {
			var r = 0;
			while (x != 0) {
				x &= x - 1;
				++r;
			}
			return r;
		}
		function bnBitCount() {
			var r = 0, x = this.s & this.DM;
			for (var i = 0; i < this.t; ++i) r += cbit(this[i] ^ x);
			return r;
		}
		function bnTestBit(n) {
			var j = Math.floor(n / this.DB);
			if (j >= this.t) return this.s != 0;
			return (this[j] & 1 << n % this.DB) != 0;
		}
		function bnpChangeBit(n, op) {
			var r = BigInteger.ONE.shiftLeft(n);
			this.bitwiseTo(r, op, r);
			return r;
		}
		function bnSetBit(n) {
			return this.changeBit(n, op_or);
		}
		function bnClearBit(n) {
			return this.changeBit(n, op_andnot);
		}
		function bnFlipBit(n) {
			return this.changeBit(n, op_xor);
		}
		function bnpAddTo(a, r) {
			var i = 0, c = 0, m = Math.min(a.t, this.t);
			while (i < m) {
				c += this[i] + a[i];
				r[i++] = c & this.DM;
				c >>= this.DB;
			}
			if (a.t < this.t) {
				c += a.s;
				while (i < this.t) {
					c += this[i];
					r[i++] = c & this.DM;
					c >>= this.DB;
				}
				c += this.s;
			} else {
				c += this.s;
				while (i < a.t) {
					c += a[i];
					r[i++] = c & this.DM;
					c >>= this.DB;
				}
				c += a.s;
			}
			r.s = c < 0 ? -1 : 0;
			if (c > 0) r[i++] = c;
			else if (c < -1) r[i++] = this.DV + c;
			r.t = i;
			r.clamp();
		}
		function bnAdd(a) {
			var r = nbi();
			this.addTo(a, r);
			return r;
		}
		function bnSubtract(a) {
			var r = nbi();
			this.subTo(a, r);
			return r;
		}
		function bnMultiply(a) {
			var r = nbi();
			this.multiplyTo(a, r);
			return r;
		}
		function bnSquare() {
			var r = nbi();
			this.squareTo(r);
			return r;
		}
		function bnDivide(a) {
			var r = nbi();
			this.divRemTo(a, r, null);
			return r;
		}
		function bnRemainder(a) {
			var r = nbi();
			this.divRemTo(a, null, r);
			return r;
		}
		function bnDivideAndRemainder(a) {
			var q = nbi(), r = nbi();
			this.divRemTo(a, q, r);
			return new Array(q, r);
		}
		function bnpDMultiply(n) {
			this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
			++this.t;
			this.clamp();
		}
		function bnpDAddOffset(n, w) {
			if (n == 0) return;
			while (this.t <= w) this[this.t++] = 0;
			this[w] += n;
			while (this[w] >= this.DV) {
				this[w] -= this.DV;
				if (++w >= this.t) this[this.t++] = 0;
				++this[w];
			}
		}
		/**
		* @constructor
		*/
		function NullExp() {}
		function nNop(x) {
			return x;
		}
		function nMulTo(x, y, r) {
			x.multiplyTo(y, r);
		}
		function nSqrTo(x, r) {
			x.squareTo(r);
		}
		NullExp.prototype.convert = nNop;
		NullExp.prototype.revert = nNop;
		NullExp.prototype.mulTo = nMulTo;
		NullExp.prototype.sqrTo = nSqrTo;
		function bnPow(e) {
			return this.exp(e, new NullExp());
		}
		function bnpMultiplyLowerTo(a, n, r) {
			var i = Math.min(this.t + a.t, n);
			r.s = 0;
			r.t = i;
			while (i > 0) r[--i] = 0;
			var j;
			for (j = r.t - this.t; i < j; ++i) r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
			for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r, i, 0, n - i);
			r.clamp();
		}
		function bnpMultiplyUpperTo(a, n, r) {
			--n;
			var i = r.t = this.t + a.t - n;
			r.s = 0;
			while (--i >= 0) r[i] = 0;
			for (i = Math.max(n - this.t, 0); i < a.t; ++i) r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
			r.clamp();
			r.drShiftTo(1, r);
		}
		/**
		* @constructor
		*/
		function Barrett(m) {
			this.r2 = nbi();
			this.q3 = nbi();
			BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
			this.mu = this.r2.divide(m);
			this.m = m;
		}
		function barrettConvert(x) {
			if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m);
			else if (x.compareTo(this.m) < 0) return x;
			else {
				var r = nbi();
				x.copyTo(r);
				this.reduce(r);
				return r;
			}
		}
		function barrettRevert(x) {
			return x;
		}
		function barrettReduce(x) {
			x.drShiftTo(this.m.t - 1, this.r2);
			if (x.t > this.m.t + 1) {
				x.t = this.m.t + 1;
				x.clamp();
			}
			this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
			this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
			while (x.compareTo(this.r2) < 0) x.dAddOffset(1, this.m.t + 1);
			x.subTo(this.r2, x);
			while (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
		}
		function barrettSqrTo(x, r) {
			x.squareTo(r);
			this.reduce(r);
		}
		function barrettMulTo(x, y, r) {
			x.multiplyTo(y, r);
			this.reduce(r);
		}
		Barrett.prototype.convert = barrettConvert;
		Barrett.prototype.revert = barrettRevert;
		Barrett.prototype.reduce = barrettReduce;
		Barrett.prototype.mulTo = barrettMulTo;
		Barrett.prototype.sqrTo = barrettSqrTo;
		function bnModPow(e, m) {
			var i = e.bitLength(), k, r = nbv(1), z;
			if (i <= 0) return r;
			else if (i < 18) k = 1;
			else if (i < 48) k = 3;
			else if (i < 144) k = 4;
			else if (i < 768) k = 5;
			else k = 6;
			if (i < 8) z = new Classic(m);
			else if (m.isEven()) z = new Barrett(m);
			else z = new Montgomery(m);
			var g = new Array(), n = 3, k1 = k - 1, km = (1 << k) - 1;
			g[1] = z.convert(this);
			if (k > 1) {
				var g2 = nbi();
				z.sqrTo(g[1], g2);
				while (n <= km) {
					g[n] = nbi();
					z.mulTo(g2, g[n - 2], g[n]);
					n += 2;
				}
			}
			var j = e.t - 1, w, is1 = true, r2 = nbi(), t;
			i = nbits(e[j]) - 1;
			while (j >= 0) {
				if (i >= k1) w = e[j] >> i - k1 & km;
				else {
					w = (e[j] & (1 << i + 1) - 1) << k1 - i;
					if (j > 0) w |= e[j - 1] >> this.DB + i - k1;
				}
				n = k;
				while ((w & 1) == 0) {
					w >>= 1;
					--n;
				}
				if ((i -= n) < 0) {
					i += this.DB;
					--j;
				}
				if (is1) {
					g[w].copyTo(r);
					is1 = false;
				} else {
					while (n > 1) {
						z.sqrTo(r, r2);
						z.sqrTo(r2, r);
						n -= 2;
					}
					if (n > 0) z.sqrTo(r, r2);
					else {
						t = r;
						r = r2;
						r2 = t;
					}
					z.mulTo(r2, g[w], r);
				}
				while (j >= 0 && (e[j] & 1 << i) == 0) {
					z.sqrTo(r, r2);
					t = r;
					r = r2;
					r2 = t;
					if (--i < 0) {
						i = this.DB - 1;
						--j;
					}
				}
			}
			return z.revert(r);
		}
		function bnGCD(a) {
			var x = this.s < 0 ? this.negate() : this.clone();
			var y = a.s < 0 ? a.negate() : a.clone();
			if (x.compareTo(y) < 0) {
				var t = x;
				x = y;
				y = t;
			}
			var i = x.getLowestSetBit(), g = y.getLowestSetBit();
			if (g < 0) return x;
			if (i < g) g = i;
			if (g > 0) {
				x.rShiftTo(g, x);
				y.rShiftTo(g, y);
			}
			while (x.signum() > 0) {
				if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x);
				if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y);
				if (x.compareTo(y) >= 0) {
					x.subTo(y, x);
					x.rShiftTo(1, x);
				} else {
					y.subTo(x, y);
					y.rShiftTo(1, y);
				}
			}
			if (g > 0) y.lShiftTo(g, y);
			return y;
		}
		function bnpModInt(n) {
			if (n <= 0) return 0;
			var d = this.DV % n, r = this.s < 0 ? n - 1 : 0;
			if (this.t > 0) if (d == 0) r = this[0] % n;
			else for (var i = this.t - 1; i >= 0; --i) r = (d * r + this[i]) % n;
			return r;
		}
		function bnModInverse(m) {
			var ac = m.isEven();
			if (this.isEven() && ac || m.signum() == 0) return BigInteger.ZERO;
			var u = m.clone(), v = this.clone();
			var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
			while (u.signum() != 0) {
				while (u.isEven()) {
					u.rShiftTo(1, u);
					if (ac) {
						if (!a.isEven() || !b.isEven()) {
							a.addTo(this, a);
							b.subTo(m, b);
						}
						a.rShiftTo(1, a);
					} else if (!b.isEven()) b.subTo(m, b);
					b.rShiftTo(1, b);
				}
				while (v.isEven()) {
					v.rShiftTo(1, v);
					if (ac) {
						if (!c.isEven() || !d.isEven()) {
							c.addTo(this, c);
							d.subTo(m, d);
						}
						c.rShiftTo(1, c);
					} else if (!d.isEven()) d.subTo(m, d);
					d.rShiftTo(1, d);
				}
				if (u.compareTo(v) >= 0) {
					u.subTo(v, u);
					if (ac) a.subTo(c, a);
					b.subTo(d, b);
				} else {
					v.subTo(u, v);
					if (ac) c.subTo(a, c);
					d.subTo(b, d);
				}
			}
			if (v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
			if (d.compareTo(m) >= 0) return d.subtract(m);
			if (d.signum() < 0) d.addTo(m, d);
			else return d;
			if (d.signum() < 0) return d.add(m);
			else return d;
		}
		var lowprimes = [
			2,
			3,
			5,
			7,
			11,
			13,
			17,
			19,
			23,
			29,
			31,
			37,
			41,
			43,
			47,
			53,
			59,
			61,
			67,
			71,
			73,
			79,
			83,
			89,
			97,
			101,
			103,
			107,
			109,
			113,
			127,
			131,
			137,
			139,
			149,
			151,
			157,
			163,
			167,
			173,
			179,
			181,
			191,
			193,
			197,
			199,
			211,
			223,
			227,
			229,
			233,
			239,
			241,
			251,
			257,
			263,
			269,
			271,
			277,
			281,
			283,
			293,
			307,
			311,
			313,
			317,
			331,
			337,
			347,
			349,
			353,
			359,
			367,
			373,
			379,
			383,
			389,
			397,
			401,
			409,
			419,
			421,
			431,
			433,
			439,
			443,
			449,
			457,
			461,
			463,
			467,
			479,
			487,
			491,
			499,
			503,
			509,
			521,
			523,
			541,
			547,
			557,
			563,
			569,
			571,
			577,
			587,
			593,
			599,
			601,
			607,
			613,
			617,
			619,
			631,
			641,
			643,
			647,
			653,
			659,
			661,
			673,
			677,
			683,
			691,
			701,
			709,
			719,
			727,
			733,
			739,
			743,
			751,
			757,
			761,
			769,
			773,
			787,
			797,
			809,
			811,
			821,
			823,
			827,
			829,
			839,
			853,
			857,
			859,
			863,
			877,
			881,
			883,
			887,
			907,
			911,
			919,
			929,
			937,
			941,
			947,
			953,
			967,
			971,
			977,
			983,
			991,
			997
		];
		var lplim = (1 << 26) / lowprimes[lowprimes.length - 1];
		function bnIsProbablePrime(t) {
			var i, x = this.abs();
			if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
				for (i = 0; i < lowprimes.length; ++i) if (x[0] == lowprimes[i]) return true;
				return false;
			}
			if (x.isEven()) return false;
			i = 1;
			while (i < lowprimes.length) {
				var m = lowprimes[i], j = i + 1;
				while (j < lowprimes.length && m < lplim) m *= lowprimes[j++];
				m = x.modInt(m);
				while (i < j) if (m % lowprimes[i++] == 0) return false;
			}
			return x.millerRabin(t);
		}
		function bnpMillerRabin(t) {
			var n1 = this.subtract(BigInteger.ONE);
			var k = n1.getLowestSetBit();
			if (k <= 0) return false;
			var r = n1.shiftRight(k);
			t = t + 1 >> 1;
			if (t > lowprimes.length) t = lowprimes.length;
			var a = nbi();
			for (var i = 0; i < t; ++i) {
				a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
				var y = a.modPow(r, this);
				if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
					var j = 1;
					while (j++ < k && y.compareTo(n1) != 0) {
						y = y.modPowInt(2, this);
						if (y.compareTo(BigInteger.ONE) == 0) return false;
					}
					if (y.compareTo(n1) != 0) return false;
				}
			}
			return true;
		}
		BigInteger.prototype.chunkSize = bnpChunkSize;
		BigInteger.prototype.toRadix = bnpToRadix;
		BigInteger.prototype.fromRadix = bnpFromRadix;
		BigInteger.prototype.fromNumber = bnpFromNumber;
		BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
		BigInteger.prototype.changeBit = bnpChangeBit;
		BigInteger.prototype.addTo = bnpAddTo;
		BigInteger.prototype.dMultiply = bnpDMultiply;
		BigInteger.prototype.dAddOffset = bnpDAddOffset;
		BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
		BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
		BigInteger.prototype.modInt = bnpModInt;
		BigInteger.prototype.millerRabin = bnpMillerRabin;
		BigInteger.prototype.clone = bnClone;
		BigInteger.prototype.intValue = bnIntValue;
		BigInteger.prototype.byteValue = bnByteValue;
		BigInteger.prototype.shortValue = bnShortValue;
		BigInteger.prototype.signum = bnSigNum;
		BigInteger.prototype.toByteArray = bnToByteArray;
		BigInteger.prototype.equals = bnEquals;
		BigInteger.prototype.min = bnMin;
		BigInteger.prototype.max = bnMax;
		BigInteger.prototype.and = bnAnd;
		BigInteger.prototype.or = bnOr;
		BigInteger.prototype.xor = bnXor;
		BigInteger.prototype.andNot = bnAndNot;
		BigInteger.prototype.not = bnNot;
		BigInteger.prototype.shiftLeft = bnShiftLeft;
		BigInteger.prototype.shiftRight = bnShiftRight;
		BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
		BigInteger.prototype.bitCount = bnBitCount;
		BigInteger.prototype.testBit = bnTestBit;
		BigInteger.prototype.setBit = bnSetBit;
		BigInteger.prototype.clearBit = bnClearBit;
		BigInteger.prototype.flipBit = bnFlipBit;
		BigInteger.prototype.add = bnAdd;
		BigInteger.prototype.subtract = bnSubtract;
		BigInteger.prototype.multiply = bnMultiply;
		BigInteger.prototype.divide = bnDivide;
		BigInteger.prototype.remainder = bnRemainder;
		BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
		BigInteger.prototype.modPow = bnModPow;
		BigInteger.prototype.modInverse = bnModInverse;
		BigInteger.prototype.pow = bnPow;
		BigInteger.prototype.gcd = bnGCD;
		BigInteger.prototype.isProbablePrime = bnIsProbablePrime;
		BigInteger.prototype.square = bnSquare;
		var Int128 = BigInteger;
		Int128.prototype.IsNegative = function() {
			if (this.compareTo(Int128.ZERO) == -1) return true;
			else return false;
		};
		Int128.op_Equality = function(val1, val2) {
			if (val1.compareTo(val2) == 0) return true;
			else return false;
		};
		Int128.op_Inequality = function(val1, val2) {
			if (val1.compareTo(val2) != 0) return true;
			else return false;
		};
		Int128.op_GreaterThan = function(val1, val2) {
			if (val1.compareTo(val2) > 0) return true;
			else return false;
		};
		Int128.op_LessThan = function(val1, val2) {
			if (val1.compareTo(val2) < 0) return true;
			else return false;
		};
		Int128.op_Addition = function(lhs, rhs) {
			return new Int128(lhs, void 0, void 0).add(new Int128(rhs, void 0, void 0));
		};
		Int128.op_Subtraction = function(lhs, rhs) {
			return new Int128(lhs, void 0, void 0).subtract(new Int128(rhs, void 0, void 0));
		};
		Int128.Int128Mul = function(lhs, rhs) {
			return new Int128(lhs, void 0, void 0).multiply(new Int128(rhs, void 0, void 0));
		};
		Int128.op_Division = function(lhs, rhs) {
			return lhs.divide(rhs);
		};
		Int128.prototype.ToDouble = function() {
			return parseFloat(this.toString());
		};
		var Inherit = function(ce, ce2) {
			var p;
			if (typeof Object.getOwnPropertyNames === "undefined") {
				for (p in ce2.prototype) if (typeof ce.prototype[p] === "undefined" || ce.prototype[p] === Object.prototype[p]) ce.prototype[p] = ce2.prototype[p];
				for (p in ce2) if (typeof ce[p] === "undefined") ce[p] = ce2[p];
				ce.$baseCtor = ce2;
			} else {
				var props = Object.getOwnPropertyNames(ce2.prototype);
				for (var i = 0; i < props.length; i++) if (typeof Object.getOwnPropertyDescriptor(ce.prototype, props[i]) === "undefined") Object.defineProperty(ce.prototype, props[i], Object.getOwnPropertyDescriptor(ce2.prototype, props[i]));
				for (p in ce2) if (typeof ce[p] === "undefined") ce[p] = ce2[p];
				ce.$baseCtor = ce2;
			}
		};
		/**
		* @constructor
		*/
		ClipperLib.Path = function() {
			return [];
		};
		ClipperLib.Path.prototype.push = Array.prototype.push;
		/**
		* @constructor
		*/
		ClipperLib.Paths = function() {
			return [];
		};
		ClipperLib.Paths.prototype.push = Array.prototype.push;
		/**
		* @constructor
		*/
		ClipperLib.DoublePoint = function() {
			var a = arguments;
			this.X = 0;
			this.Y = 0;
			if (a.length === 1) {
				this.X = a[0].X;
				this.Y = a[0].Y;
			} else if (a.length === 2) {
				this.X = a[0];
				this.Y = a[1];
			}
		};
		/**
		* @constructor
		*/
		ClipperLib.DoublePoint0 = function() {
			this.X = 0;
			this.Y = 0;
		};
		ClipperLib.DoublePoint0.prototype = ClipperLib.DoublePoint.prototype;
		/**
		* @constructor
		*/
		ClipperLib.DoublePoint1 = function(dp) {
			this.X = dp.X;
			this.Y = dp.Y;
		};
		ClipperLib.DoublePoint1.prototype = ClipperLib.DoublePoint.prototype;
		/**
		* @constructor
		*/
		ClipperLib.DoublePoint2 = function(x, y) {
			this.X = x;
			this.Y = y;
		};
		ClipperLib.DoublePoint2.prototype = ClipperLib.DoublePoint.prototype;
		/**
		* @suppress {missingProperties}
		*/
		ClipperLib.PolyNode = function() {
			this.m_Parent = null;
			this.m_polygon = new ClipperLib.Path();
			this.m_Index = 0;
			this.m_jointype = 0;
			this.m_endtype = 0;
			this.m_Childs = [];
			this.IsOpen = false;
		};
		ClipperLib.PolyNode.prototype.IsHoleNode = function() {
			var result = true;
			var node = this.m_Parent;
			while (node !== null) {
				result = !result;
				node = node.m_Parent;
			}
			return result;
		};
		ClipperLib.PolyNode.prototype.ChildCount = function() {
			return this.m_Childs.length;
		};
		ClipperLib.PolyNode.prototype.Contour = function() {
			return this.m_polygon;
		};
		ClipperLib.PolyNode.prototype.AddChild = function(Child) {
			var cnt = this.m_Childs.length;
			this.m_Childs.push(Child);
			Child.m_Parent = this;
			Child.m_Index = cnt;
		};
		ClipperLib.PolyNode.prototype.GetNext = function() {
			if (this.m_Childs.length > 0) return this.m_Childs[0];
			else return this.GetNextSiblingUp();
		};
		ClipperLib.PolyNode.prototype.GetNextSiblingUp = function() {
			if (this.m_Parent === null) return null;
			else if (this.m_Index === this.m_Parent.m_Childs.length - 1) return this.m_Parent.GetNextSiblingUp();
			else return this.m_Parent.m_Childs[this.m_Index + 1];
		};
		ClipperLib.PolyNode.prototype.Childs = function() {
			return this.m_Childs;
		};
		ClipperLib.PolyNode.prototype.Parent = function() {
			return this.m_Parent;
		};
		ClipperLib.PolyNode.prototype.IsHole = function() {
			return this.IsHoleNode();
		};
		/**
		* @suppress {missingProperties}
		* @constructor
		*/
		ClipperLib.PolyTree = function() {
			this.m_AllPolys = [];
			ClipperLib.PolyNode.call(this);
		};
		ClipperLib.PolyTree.prototype.Clear = function() {
			for (var i = 0, ilen = this.m_AllPolys.length; i < ilen; i++) this.m_AllPolys[i] = null;
			this.m_AllPolys.length = 0;
			this.m_Childs.length = 0;
		};
		ClipperLib.PolyTree.prototype.GetFirst = function() {
			if (this.m_Childs.length > 0) return this.m_Childs[0];
			else return null;
		};
		ClipperLib.PolyTree.prototype.Total = function() {
			var result = this.m_AllPolys.length;
			if (result > 0 && this.m_Childs[0] !== this.m_AllPolys[0]) result--;
			return result;
		};
		Inherit(ClipperLib.PolyTree, ClipperLib.PolyNode);
		ClipperLib.Math_Abs_Int64 = ClipperLib.Math_Abs_Int32 = ClipperLib.Math_Abs_Double = function(a) {
			return Math.abs(a);
		};
		ClipperLib.Math_Max_Int32_Int32 = function(a, b) {
			return Math.max(a, b);
		};
		if (browser.msie || browser.opera || browser.safari) ClipperLib.Cast_Int32 = function(a) {
			return a | 0;
		};
		else ClipperLib.Cast_Int32 = function(a) {
			return ~~a;
		};
		if (typeof Number.toInteger === "undefined") Number.toInteger = null;
		if (browser.chrome) ClipperLib.Cast_Int64 = function(a) {
			if (a < -2147483648 || a > 2147483647) return a < 0 ? Math.ceil(a) : Math.floor(a);
			else return ~~a;
		};
		else if (browser.firefox && typeof Number.toInteger === "function") ClipperLib.Cast_Int64 = function(a) {
			return Number.toInteger(a);
		};
		else if (browser.msie7 || browser.msie8) ClipperLib.Cast_Int64 = function(a) {
			return parseInt(a, 10);
		};
		else if (browser.msie) ClipperLib.Cast_Int64 = function(a) {
			if (a < -2147483648 || a > 2147483647) return a < 0 ? Math.ceil(a) : Math.floor(a);
			return a | 0;
		};
		else ClipperLib.Cast_Int64 = function(a) {
			return a < 0 ? Math.ceil(a) : Math.floor(a);
		};
		ClipperLib.Clear = function(a) {
			a.length = 0;
		};
		ClipperLib.PI = 3.141592653589793;
		ClipperLib.PI2 = 2 * 3.141592653589793;
		/**
		* @constructor
		*/
		ClipperLib.IntPoint = function() {
			var a = arguments, alen = a.length;
			this.X = 0;
			this.Y = 0;
			if (ClipperLib.use_xyz) {
				this.Z = 0;
				if (alen === 3) {
					this.X = a[0];
					this.Y = a[1];
					this.Z = a[2];
				} else if (alen === 2) {
					this.X = a[0];
					this.Y = a[1];
					this.Z = 0;
				} else if (alen === 1) if (a[0] instanceof ClipperLib.DoublePoint) {
					var dp = a[0];
					this.X = ClipperLib.Clipper.Round(dp.X);
					this.Y = ClipperLib.Clipper.Round(dp.Y);
					this.Z = 0;
				} else {
					var pt = a[0];
					if (typeof pt.Z === "undefined") pt.Z = 0;
					this.X = pt.X;
					this.Y = pt.Y;
					this.Z = pt.Z;
				}
				else {
					this.X = 0;
					this.Y = 0;
					this.Z = 0;
				}
			} else if (alen === 2) {
				this.X = a[0];
				this.Y = a[1];
			} else if (alen === 1) if (a[0] instanceof ClipperLib.DoublePoint) {
				var dp = a[0];
				this.X = ClipperLib.Clipper.Round(dp.X);
				this.Y = ClipperLib.Clipper.Round(dp.Y);
			} else {
				var pt = a[0];
				this.X = pt.X;
				this.Y = pt.Y;
			}
			else {
				this.X = 0;
				this.Y = 0;
			}
		};
		ClipperLib.IntPoint.op_Equality = function(a, b) {
			return a.X === b.X && a.Y === b.Y;
		};
		ClipperLib.IntPoint.op_Inequality = function(a, b) {
			return a.X !== b.X || a.Y !== b.Y;
		};
		/**
		* @constructor
		*/
		ClipperLib.IntPoint0 = function() {
			this.X = 0;
			this.Y = 0;
			if (ClipperLib.use_xyz) this.Z = 0;
		};
		ClipperLib.IntPoint0.prototype = ClipperLib.IntPoint.prototype;
		/**
		* @constructor
		*/
		ClipperLib.IntPoint1 = function(pt) {
			this.X = pt.X;
			this.Y = pt.Y;
			if (ClipperLib.use_xyz) if (typeof pt.Z === "undefined") this.Z = 0;
			else this.Z = pt.Z;
		};
		ClipperLib.IntPoint1.prototype = ClipperLib.IntPoint.prototype;
		/**
		* @constructor
		*/
		ClipperLib.IntPoint1dp = function(dp) {
			this.X = ClipperLib.Clipper.Round(dp.X);
			this.Y = ClipperLib.Clipper.Round(dp.Y);
			if (ClipperLib.use_xyz) this.Z = 0;
		};
		ClipperLib.IntPoint1dp.prototype = ClipperLib.IntPoint.prototype;
		/**
		* @constructor
		*/
		ClipperLib.IntPoint2 = function(x, y, z) {
			this.X = x;
			this.Y = y;
			if (ClipperLib.use_xyz) if (typeof z === "undefined") this.Z = 0;
			else this.Z = z;
		};
		ClipperLib.IntPoint2.prototype = ClipperLib.IntPoint.prototype;
		/**
		* @constructor
		*/
		ClipperLib.IntRect = function() {
			var a = arguments, alen = a.length;
			if (alen === 4) {
				this.left = a[0];
				this.top = a[1];
				this.right = a[2];
				this.bottom = a[3];
			} else if (alen === 1) {
				var ir = a[0];
				this.left = ir.left;
				this.top = ir.top;
				this.right = ir.right;
				this.bottom = ir.bottom;
			} else {
				this.left = 0;
				this.top = 0;
				this.right = 0;
				this.bottom = 0;
			}
		};
		/**
		* @constructor
		*/
		ClipperLib.IntRect0 = function() {
			this.left = 0;
			this.top = 0;
			this.right = 0;
			this.bottom = 0;
		};
		ClipperLib.IntRect0.prototype = ClipperLib.IntRect.prototype;
		/**
		* @constructor
		*/
		ClipperLib.IntRect1 = function(ir) {
			this.left = ir.left;
			this.top = ir.top;
			this.right = ir.right;
			this.bottom = ir.bottom;
		};
		ClipperLib.IntRect1.prototype = ClipperLib.IntRect.prototype;
		/**
		* @constructor
		*/
		ClipperLib.IntRect4 = function(l, t, r, b) {
			this.left = l;
			this.top = t;
			this.right = r;
			this.bottom = b;
		};
		ClipperLib.IntRect4.prototype = ClipperLib.IntRect.prototype;
		ClipperLib.ClipType = {
			ctIntersection: 0,
			ctUnion: 1,
			ctDifference: 2,
			ctXor: 3
		};
		ClipperLib.PolyType = {
			ptSubject: 0,
			ptClip: 1
		};
		ClipperLib.PolyFillType = {
			pftEvenOdd: 0,
			pftNonZero: 1,
			pftPositive: 2,
			pftNegative: 3
		};
		ClipperLib.JoinType = {
			jtSquare: 0,
			jtRound: 1,
			jtMiter: 2
		};
		ClipperLib.EndType = {
			etOpenSquare: 0,
			etOpenRound: 1,
			etOpenButt: 2,
			etClosedLine: 3,
			etClosedPolygon: 4
		};
		ClipperLib.EdgeSide = {
			esLeft: 0,
			esRight: 1
		};
		ClipperLib.Direction = {
			dRightToLeft: 0,
			dLeftToRight: 1
		};
		/**
		* @constructor
		*/
		ClipperLib.TEdge = function() {
			this.Bot = new ClipperLib.IntPoint0();
			this.Curr = new ClipperLib.IntPoint0();
			this.Top = new ClipperLib.IntPoint0();
			this.Delta = new ClipperLib.IntPoint0();
			this.Dx = 0;
			this.PolyTyp = ClipperLib.PolyType.ptSubject;
			this.Side = ClipperLib.EdgeSide.esLeft;
			this.WindDelta = 0;
			this.WindCnt = 0;
			this.WindCnt2 = 0;
			this.OutIdx = 0;
			this.Next = null;
			this.Prev = null;
			this.NextInLML = null;
			this.NextInAEL = null;
			this.PrevInAEL = null;
			this.NextInSEL = null;
			this.PrevInSEL = null;
		};
		/**
		* @constructor
		*/
		ClipperLib.IntersectNode = function() {
			this.Edge1 = null;
			this.Edge2 = null;
			this.Pt = new ClipperLib.IntPoint0();
		};
		ClipperLib.MyIntersectNodeSort = function() {};
		ClipperLib.MyIntersectNodeSort.Compare = function(node1, node2) {
			var i = node2.Pt.Y - node1.Pt.Y;
			if (i > 0) return 1;
			else if (i < 0) return -1;
			else return 0;
		};
		/**
		* @constructor
		*/
		ClipperLib.LocalMinima = function() {
			this.Y = 0;
			this.LeftBound = null;
			this.RightBound = null;
			this.Next = null;
		};
		/**
		* @constructor
		*/
		ClipperLib.Scanbeam = function() {
			this.Y = 0;
			this.Next = null;
		};
		/**
		* @constructor
		*/
		ClipperLib.Maxima = function() {
			this.X = 0;
			this.Next = null;
			this.Prev = null;
		};
		/**
		* @constructor
		*/
		ClipperLib.OutRec = function() {
			this.Idx = 0;
			this.IsHole = false;
			this.IsOpen = false;
			this.FirstLeft = null;
			this.Pts = null;
			this.BottomPt = null;
			this.PolyNode = null;
		};
		/**
		* @constructor
		*/
		ClipperLib.OutPt = function() {
			this.Idx = 0;
			this.Pt = new ClipperLib.IntPoint0();
			this.Next = null;
			this.Prev = null;
		};
		/**
		* @constructor
		*/
		ClipperLib.Join = function() {
			this.OutPt1 = null;
			this.OutPt2 = null;
			this.OffPt = new ClipperLib.IntPoint0();
		};
		ClipperLib.ClipperBase = function() {
			this.m_MinimaList = null;
			this.m_CurrentLM = null;
			this.m_edges = new Array();
			this.m_UseFullRange = false;
			this.m_HasOpenPaths = false;
			this.PreserveCollinear = false;
			this.m_Scanbeam = null;
			this.m_PolyOuts = null;
			this.m_ActiveEdges = null;
		};
		ClipperLib.ClipperBase.horizontal = -9007199254740992;
		ClipperLib.ClipperBase.Skip = -2;
		ClipperLib.ClipperBase.Unassigned = -1;
		ClipperLib.ClipperBase.tolerance = 1e-20;
		ClipperLib.ClipperBase.loRange = 47453132;
		ClipperLib.ClipperBase.hiRange = 0xfffffffffffff;
		ClipperLib.ClipperBase.near_zero = function(val) {
			return val > -ClipperLib.ClipperBase.tolerance && val < ClipperLib.ClipperBase.tolerance;
		};
		ClipperLib.ClipperBase.IsHorizontal = function(e) {
			return e.Delta.Y === 0;
		};
		ClipperLib.ClipperBase.prototype.PointIsVertex = function(pt, pp) {
			var pp2 = pp;
			do {
				if (ClipperLib.IntPoint.op_Equality(pp2.Pt, pt)) return true;
				pp2 = pp2.Next;
			} while (pp2 !== pp);
			return false;
		};
		ClipperLib.ClipperBase.prototype.PointOnLineSegment = function(pt, linePt1, linePt2, UseFullRange) {
			if (UseFullRange) return pt.X === linePt1.X && pt.Y === linePt1.Y || pt.X === linePt2.X && pt.Y === linePt2.Y || pt.X > linePt1.X === pt.X < linePt2.X && pt.Y > linePt1.Y === pt.Y < linePt2.Y && Int128.op_Equality(Int128.Int128Mul(pt.X - linePt1.X, linePt2.Y - linePt1.Y), Int128.Int128Mul(linePt2.X - linePt1.X, pt.Y - linePt1.Y));
			else return pt.X === linePt1.X && pt.Y === linePt1.Y || pt.X === linePt2.X && pt.Y === linePt2.Y || pt.X > linePt1.X === pt.X < linePt2.X && pt.Y > linePt1.Y === pt.Y < linePt2.Y && (pt.X - linePt1.X) * (linePt2.Y - linePt1.Y) === (linePt2.X - linePt1.X) * (pt.Y - linePt1.Y);
		};
		ClipperLib.ClipperBase.prototype.PointOnPolygon = function(pt, pp, UseFullRange) {
			var pp2 = pp;
			while (true) {
				if (this.PointOnLineSegment(pt, pp2.Pt, pp2.Next.Pt, UseFullRange)) return true;
				pp2 = pp2.Next;
				if (pp2 === pp) break;
			}
			return false;
		};
		ClipperLib.ClipperBase.prototype.SlopesEqual = ClipperLib.ClipperBase.SlopesEqual = function() {
			var a = arguments, alen = a.length;
			var e1, e2, pt1, pt2, pt3, pt4, UseFullRange;
			if (alen === 3) {
				e1 = a[0];
				e2 = a[1];
				UseFullRange = a[2];
				if (UseFullRange) return Int128.op_Equality(Int128.Int128Mul(e1.Delta.Y, e2.Delta.X), Int128.Int128Mul(e1.Delta.X, e2.Delta.Y));
				else return ClipperLib.Cast_Int64(e1.Delta.Y * e2.Delta.X) === ClipperLib.Cast_Int64(e1.Delta.X * e2.Delta.Y);
			} else if (alen === 4) {
				pt1 = a[0];
				pt2 = a[1];
				pt3 = a[2];
				UseFullRange = a[3];
				if (UseFullRange) return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt2.X - pt3.X), Int128.Int128Mul(pt1.X - pt2.X, pt2.Y - pt3.Y));
				else return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt2.X - pt3.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt2.Y - pt3.Y)) === 0;
			} else {
				pt1 = a[0];
				pt2 = a[1];
				pt3 = a[2];
				pt4 = a[3];
				UseFullRange = a[4];
				if (UseFullRange) return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt3.X - pt4.X), Int128.Int128Mul(pt1.X - pt2.X, pt3.Y - pt4.Y));
				else return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt3.X - pt4.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt3.Y - pt4.Y)) === 0;
			}
		};
		ClipperLib.ClipperBase.SlopesEqual3 = function(e1, e2, UseFullRange) {
			if (UseFullRange) return Int128.op_Equality(Int128.Int128Mul(e1.Delta.Y, e2.Delta.X), Int128.Int128Mul(e1.Delta.X, e2.Delta.Y));
			else return ClipperLib.Cast_Int64(e1.Delta.Y * e2.Delta.X) === ClipperLib.Cast_Int64(e1.Delta.X * e2.Delta.Y);
		};
		ClipperLib.ClipperBase.SlopesEqual4 = function(pt1, pt2, pt3, UseFullRange) {
			if (UseFullRange) return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt2.X - pt3.X), Int128.Int128Mul(pt1.X - pt2.X, pt2.Y - pt3.Y));
			else return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt2.X - pt3.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt2.Y - pt3.Y)) === 0;
		};
		ClipperLib.ClipperBase.SlopesEqual5 = function(pt1, pt2, pt3, pt4, UseFullRange) {
			if (UseFullRange) return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt3.X - pt4.X), Int128.Int128Mul(pt1.X - pt2.X, pt3.Y - pt4.Y));
			else return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt3.X - pt4.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt3.Y - pt4.Y)) === 0;
		};
		ClipperLib.ClipperBase.prototype.Clear = function() {
			this.DisposeLocalMinimaList();
			for (var i = 0, ilen = this.m_edges.length; i < ilen; ++i) {
				for (var j = 0, jlen = this.m_edges[i].length; j < jlen; ++j) this.m_edges[i][j] = null;
				ClipperLib.Clear(this.m_edges[i]);
			}
			ClipperLib.Clear(this.m_edges);
			this.m_UseFullRange = false;
			this.m_HasOpenPaths = false;
		};
		ClipperLib.ClipperBase.prototype.DisposeLocalMinimaList = function() {
			while (this.m_MinimaList !== null) {
				var tmpLm = this.m_MinimaList.Next;
				this.m_MinimaList = null;
				this.m_MinimaList = tmpLm;
			}
			this.m_CurrentLM = null;
		};
		ClipperLib.ClipperBase.prototype.RangeTest = function(Pt, useFullRange) {
			if (useFullRange.Value) {
				if (Pt.X > ClipperLib.ClipperBase.hiRange || Pt.Y > ClipperLib.ClipperBase.hiRange || -Pt.X > ClipperLib.ClipperBase.hiRange || -Pt.Y > ClipperLib.ClipperBase.hiRange) ClipperLib.Error("Coordinate outside allowed range in RangeTest().");
			} else if (Pt.X > ClipperLib.ClipperBase.loRange || Pt.Y > ClipperLib.ClipperBase.loRange || -Pt.X > ClipperLib.ClipperBase.loRange || -Pt.Y > ClipperLib.ClipperBase.loRange) {
				useFullRange.Value = true;
				this.RangeTest(Pt, useFullRange);
			}
		};
		ClipperLib.ClipperBase.prototype.InitEdge = function(e, eNext, ePrev, pt) {
			e.Next = eNext;
			e.Prev = ePrev;
			e.Curr.X = pt.X;
			e.Curr.Y = pt.Y;
			if (ClipperLib.use_xyz) e.Curr.Z = pt.Z;
			e.OutIdx = -1;
		};
		ClipperLib.ClipperBase.prototype.InitEdge2 = function(e, polyType) {
			if (e.Curr.Y >= e.Next.Curr.Y) {
				e.Bot.X = e.Curr.X;
				e.Bot.Y = e.Curr.Y;
				if (ClipperLib.use_xyz) e.Bot.Z = e.Curr.Z;
				e.Top.X = e.Next.Curr.X;
				e.Top.Y = e.Next.Curr.Y;
				if (ClipperLib.use_xyz) e.Top.Z = e.Next.Curr.Z;
			} else {
				e.Top.X = e.Curr.X;
				e.Top.Y = e.Curr.Y;
				if (ClipperLib.use_xyz) e.Top.Z = e.Curr.Z;
				e.Bot.X = e.Next.Curr.X;
				e.Bot.Y = e.Next.Curr.Y;
				if (ClipperLib.use_xyz) e.Bot.Z = e.Next.Curr.Z;
			}
			this.SetDx(e);
			e.PolyTyp = polyType;
		};
		ClipperLib.ClipperBase.prototype.FindNextLocMin = function(E) {
			var E2;
			for (;;) {
				while (ClipperLib.IntPoint.op_Inequality(E.Bot, E.Prev.Bot) || ClipperLib.IntPoint.op_Equality(E.Curr, E.Top)) E = E.Next;
				if (E.Dx !== ClipperLib.ClipperBase.horizontal && E.Prev.Dx !== ClipperLib.ClipperBase.horizontal) break;
				while (E.Prev.Dx === ClipperLib.ClipperBase.horizontal) E = E.Prev;
				E2 = E;
				while (E.Dx === ClipperLib.ClipperBase.horizontal) E = E.Next;
				if (E.Top.Y === E.Prev.Bot.Y) continue;
				if (E2.Prev.Bot.X < E.Bot.X) E = E2;
				break;
			}
			return E;
		};
		ClipperLib.ClipperBase.prototype.ProcessBound = function(E, LeftBoundIsForward) {
			var EStart;
			var Result = E;
			var Horz;
			if (Result.OutIdx === ClipperLib.ClipperBase.Skip) {
				E = Result;
				if (LeftBoundIsForward) {
					while (E.Top.Y === E.Next.Bot.Y) E = E.Next;
					while (E !== Result && E.Dx === ClipperLib.ClipperBase.horizontal) E = E.Prev;
				} else {
					while (E.Top.Y === E.Prev.Bot.Y) E = E.Prev;
					while (E !== Result && E.Dx === ClipperLib.ClipperBase.horizontal) E = E.Next;
				}
				if (E === Result) if (LeftBoundIsForward) Result = E.Next;
				else Result = E.Prev;
				else {
					if (LeftBoundIsForward) E = Result.Next;
					else E = Result.Prev;
					var locMin = new ClipperLib.LocalMinima();
					locMin.Next = null;
					locMin.Y = E.Bot.Y;
					locMin.LeftBound = null;
					locMin.RightBound = E;
					E.WindDelta = 0;
					Result = this.ProcessBound(E, LeftBoundIsForward);
					this.InsertLocalMinima(locMin);
				}
				return Result;
			}
			if (E.Dx === ClipperLib.ClipperBase.horizontal) {
				if (LeftBoundIsForward) EStart = E.Prev;
				else EStart = E.Next;
				if (EStart.Dx === ClipperLib.ClipperBase.horizontal) {
					if (EStart.Bot.X !== E.Bot.X && EStart.Top.X !== E.Bot.X) this.ReverseHorizontal(E);
				} else if (EStart.Bot.X !== E.Bot.X) this.ReverseHorizontal(E);
			}
			EStart = E;
			if (LeftBoundIsForward) {
				while (Result.Top.Y === Result.Next.Bot.Y && Result.Next.OutIdx !== ClipperLib.ClipperBase.Skip) Result = Result.Next;
				if (Result.Dx === ClipperLib.ClipperBase.horizontal && Result.Next.OutIdx !== ClipperLib.ClipperBase.Skip) {
					Horz = Result;
					while (Horz.Prev.Dx === ClipperLib.ClipperBase.horizontal) Horz = Horz.Prev;
					if (Horz.Prev.Top.X > Result.Next.Top.X) Result = Horz.Prev;
				}
				while (E !== Result) {
					E.NextInLML = E.Next;
					if (E.Dx === ClipperLib.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Prev.Top.X) this.ReverseHorizontal(E);
					E = E.Next;
				}
				if (E.Dx === ClipperLib.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Prev.Top.X) this.ReverseHorizontal(E);
				Result = Result.Next;
			} else {
				while (Result.Top.Y === Result.Prev.Bot.Y && Result.Prev.OutIdx !== ClipperLib.ClipperBase.Skip) Result = Result.Prev;
				if (Result.Dx === ClipperLib.ClipperBase.horizontal && Result.Prev.OutIdx !== ClipperLib.ClipperBase.Skip) {
					Horz = Result;
					while (Horz.Next.Dx === ClipperLib.ClipperBase.horizontal) Horz = Horz.Next;
					if (Horz.Next.Top.X === Result.Prev.Top.X || Horz.Next.Top.X > Result.Prev.Top.X) Result = Horz.Next;
				}
				while (E !== Result) {
					E.NextInLML = E.Prev;
					if (E.Dx === ClipperLib.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Next.Top.X) this.ReverseHorizontal(E);
					E = E.Prev;
				}
				if (E.Dx === ClipperLib.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Next.Top.X) this.ReverseHorizontal(E);
				Result = Result.Prev;
			}
			return Result;
		};
		ClipperLib.ClipperBase.prototype.AddPath = function(pg, polyType, Closed) {
			if (ClipperLib.use_lines) {
				if (!Closed && polyType === ClipperLib.PolyType.ptClip) ClipperLib.Error("AddPath: Open paths must be subject.");
			} else if (!Closed) ClipperLib.Error("AddPath: Open paths have been disabled.");
			var highI = pg.length - 1;
			if (Closed) while (highI > 0 && ClipperLib.IntPoint.op_Equality(pg[highI], pg[0])) --highI;
			while (highI > 0 && ClipperLib.IntPoint.op_Equality(pg[highI], pg[highI - 1])) --highI;
			if (Closed && highI < 2 || !Closed && highI < 1) return false;
			var edges = new Array();
			for (var i = 0; i <= highI; i++) edges.push(new ClipperLib.TEdge());
			var IsFlat = true;
			edges[1].Curr.X = pg[1].X;
			edges[1].Curr.Y = pg[1].Y;
			if (ClipperLib.use_xyz) edges[1].Curr.Z = pg[1].Z;
			var $1 = { Value: this.m_UseFullRange };
			this.RangeTest(pg[0], $1);
			this.m_UseFullRange = $1.Value;
			$1.Value = this.m_UseFullRange;
			this.RangeTest(pg[highI], $1);
			this.m_UseFullRange = $1.Value;
			this.InitEdge(edges[0], edges[1], edges[highI], pg[0]);
			this.InitEdge(edges[highI], edges[0], edges[highI - 1], pg[highI]);
			for (var i = highI - 1; i >= 1; --i) {
				$1.Value = this.m_UseFullRange;
				this.RangeTest(pg[i], $1);
				this.m_UseFullRange = $1.Value;
				this.InitEdge(edges[i], edges[i + 1], edges[i - 1], pg[i]);
			}
			var eStart = edges[0];
			var E = eStart, eLoopStop = eStart;
			for (;;) {
				if (E.Curr === E.Next.Curr && (Closed || E.Next !== eStart)) {
					if (E === E.Next) break;
					if (E === eStart) eStart = E.Next;
					E = this.RemoveEdge(E);
					eLoopStop = E;
					continue;
				}
				if (E.Prev === E.Next) break;
				else if (Closed && ClipperLib.ClipperBase.SlopesEqual4(E.Prev.Curr, E.Curr, E.Next.Curr, this.m_UseFullRange) && (!this.PreserveCollinear || !this.Pt2IsBetweenPt1AndPt3(E.Prev.Curr, E.Curr, E.Next.Curr))) {
					if (E === eStart) eStart = E.Next;
					E = this.RemoveEdge(E);
					E = E.Prev;
					eLoopStop = E;
					continue;
				}
				E = E.Next;
				if (E === eLoopStop || !Closed && E.Next === eStart) break;
			}
			if (!Closed && E === E.Next || Closed && E.Prev === E.Next) return false;
			if (!Closed) {
				this.m_HasOpenPaths = true;
				eStart.Prev.OutIdx = ClipperLib.ClipperBase.Skip;
			}
			E = eStart;
			do {
				this.InitEdge2(E, polyType);
				E = E.Next;
				if (IsFlat && E.Curr.Y !== eStart.Curr.Y) IsFlat = false;
			} while (E !== eStart);
			if (IsFlat) {
				if (Closed) return false;
				E.Prev.OutIdx = ClipperLib.ClipperBase.Skip;
				var locMin = new ClipperLib.LocalMinima();
				locMin.Next = null;
				locMin.Y = E.Bot.Y;
				locMin.LeftBound = null;
				locMin.RightBound = E;
				locMin.RightBound.Side = ClipperLib.EdgeSide.esRight;
				locMin.RightBound.WindDelta = 0;
				for (;;) {
					if (E.Bot.X !== E.Prev.Top.X) this.ReverseHorizontal(E);
					if (E.Next.OutIdx === ClipperLib.ClipperBase.Skip) break;
					E.NextInLML = E.Next;
					E = E.Next;
				}
				this.InsertLocalMinima(locMin);
				this.m_edges.push(edges);
				return true;
			}
			this.m_edges.push(edges);
			var leftBoundIsForward;
			var EMin = null;
			if (ClipperLib.IntPoint.op_Equality(E.Prev.Bot, E.Prev.Top)) E = E.Next;
			for (;;) {
				E = this.FindNextLocMin(E);
				if (E === EMin) break;
				else if (EMin === null) EMin = E;
				var locMin = new ClipperLib.LocalMinima();
				locMin.Next = null;
				locMin.Y = E.Bot.Y;
				if (E.Dx < E.Prev.Dx) {
					locMin.LeftBound = E.Prev;
					locMin.RightBound = E;
					leftBoundIsForward = false;
				} else {
					locMin.LeftBound = E;
					locMin.RightBound = E.Prev;
					leftBoundIsForward = true;
				}
				locMin.LeftBound.Side = ClipperLib.EdgeSide.esLeft;
				locMin.RightBound.Side = ClipperLib.EdgeSide.esRight;
				if (!Closed) locMin.LeftBound.WindDelta = 0;
				else if (locMin.LeftBound.Next === locMin.RightBound) locMin.LeftBound.WindDelta = -1;
				else locMin.LeftBound.WindDelta = 1;
				locMin.RightBound.WindDelta = -locMin.LeftBound.WindDelta;
				E = this.ProcessBound(locMin.LeftBound, leftBoundIsForward);
				if (E.OutIdx === ClipperLib.ClipperBase.Skip) E = this.ProcessBound(E, leftBoundIsForward);
				var E2 = this.ProcessBound(locMin.RightBound, !leftBoundIsForward);
				if (E2.OutIdx === ClipperLib.ClipperBase.Skip) E2 = this.ProcessBound(E2, !leftBoundIsForward);
				if (locMin.LeftBound.OutIdx === ClipperLib.ClipperBase.Skip) locMin.LeftBound = null;
				else if (locMin.RightBound.OutIdx === ClipperLib.ClipperBase.Skip) locMin.RightBound = null;
				this.InsertLocalMinima(locMin);
				if (!leftBoundIsForward) E = E2;
			}
			return true;
		};
		ClipperLib.ClipperBase.prototype.AddPaths = function(ppg, polyType, closed) {
			var result = false;
			for (var i = 0, ilen = ppg.length; i < ilen; ++i) if (this.AddPath(ppg[i], polyType, closed)) result = true;
			return result;
		};
		ClipperLib.ClipperBase.prototype.Pt2IsBetweenPt1AndPt3 = function(pt1, pt2, pt3) {
			if (ClipperLib.IntPoint.op_Equality(pt1, pt3) || ClipperLib.IntPoint.op_Equality(pt1, pt2) || ClipperLib.IntPoint.op_Equality(pt3, pt2)) return false;
			else if (pt1.X !== pt3.X) return pt2.X > pt1.X === pt2.X < pt3.X;
			else return pt2.Y > pt1.Y === pt2.Y < pt3.Y;
		};
		ClipperLib.ClipperBase.prototype.RemoveEdge = function(e) {
			e.Prev.Next = e.Next;
			e.Next.Prev = e.Prev;
			var result = e.Next;
			e.Prev = null;
			return result;
		};
		ClipperLib.ClipperBase.prototype.SetDx = function(e) {
			e.Delta.X = e.Top.X - e.Bot.X;
			e.Delta.Y = e.Top.Y - e.Bot.Y;
			if (e.Delta.Y === 0) e.Dx = ClipperLib.ClipperBase.horizontal;
			else e.Dx = e.Delta.X / e.Delta.Y;
		};
		ClipperLib.ClipperBase.prototype.InsertLocalMinima = function(newLm) {
			if (this.m_MinimaList === null) this.m_MinimaList = newLm;
			else if (newLm.Y >= this.m_MinimaList.Y) {
				newLm.Next = this.m_MinimaList;
				this.m_MinimaList = newLm;
			} else {
				var tmpLm = this.m_MinimaList;
				while (tmpLm.Next !== null && newLm.Y < tmpLm.Next.Y) tmpLm = tmpLm.Next;
				newLm.Next = tmpLm.Next;
				tmpLm.Next = newLm;
			}
		};
		ClipperLib.ClipperBase.prototype.PopLocalMinima = function(Y, current) {
			current.v = this.m_CurrentLM;
			if (this.m_CurrentLM !== null && this.m_CurrentLM.Y === Y) {
				this.m_CurrentLM = this.m_CurrentLM.Next;
				return true;
			}
			return false;
		};
		ClipperLib.ClipperBase.prototype.ReverseHorizontal = function(e) {
			var tmp = e.Top.X;
			e.Top.X = e.Bot.X;
			e.Bot.X = tmp;
			if (ClipperLib.use_xyz) {
				tmp = e.Top.Z;
				e.Top.Z = e.Bot.Z;
				e.Bot.Z = tmp;
			}
		};
		ClipperLib.ClipperBase.prototype.Reset = function() {
			this.m_CurrentLM = this.m_MinimaList;
			if (this.m_CurrentLM === null) return;
			this.m_Scanbeam = null;
			var lm = this.m_MinimaList;
			while (lm !== null) {
				this.InsertScanbeam(lm.Y);
				var e = lm.LeftBound;
				if (e !== null) {
					e.Curr.X = e.Bot.X;
					e.Curr.Y = e.Bot.Y;
					if (ClipperLib.use_xyz) e.Curr.Z = e.Bot.Z;
					e.OutIdx = ClipperLib.ClipperBase.Unassigned;
				}
				e = lm.RightBound;
				if (e !== null) {
					e.Curr.X = e.Bot.X;
					e.Curr.Y = e.Bot.Y;
					if (ClipperLib.use_xyz) e.Curr.Z = e.Bot.Z;
					e.OutIdx = ClipperLib.ClipperBase.Unassigned;
				}
				lm = lm.Next;
			}
			this.m_ActiveEdges = null;
		};
		ClipperLib.ClipperBase.prototype.InsertScanbeam = function(Y) {
			if (this.m_Scanbeam === null) {
				this.m_Scanbeam = new ClipperLib.Scanbeam();
				this.m_Scanbeam.Next = null;
				this.m_Scanbeam.Y = Y;
			} else if (Y > this.m_Scanbeam.Y) {
				var newSb = new ClipperLib.Scanbeam();
				newSb.Y = Y;
				newSb.Next = this.m_Scanbeam;
				this.m_Scanbeam = newSb;
			} else {
				var sb2 = this.m_Scanbeam;
				while (sb2.Next !== null && Y <= sb2.Next.Y) sb2 = sb2.Next;
				if (Y === sb2.Y) return;
				var newSb1 = new ClipperLib.Scanbeam();
				newSb1.Y = Y;
				newSb1.Next = sb2.Next;
				sb2.Next = newSb1;
			}
		};
		ClipperLib.ClipperBase.prototype.PopScanbeam = function(Y) {
			if (this.m_Scanbeam === null) {
				Y.v = 0;
				return false;
			}
			Y.v = this.m_Scanbeam.Y;
			this.m_Scanbeam = this.m_Scanbeam.Next;
			return true;
		};
		ClipperLib.ClipperBase.prototype.LocalMinimaPending = function() {
			return this.m_CurrentLM !== null;
		};
		ClipperLib.ClipperBase.prototype.CreateOutRec = function() {
			var result = new ClipperLib.OutRec();
			result.Idx = ClipperLib.ClipperBase.Unassigned;
			result.IsHole = false;
			result.IsOpen = false;
			result.FirstLeft = null;
			result.Pts = null;
			result.BottomPt = null;
			result.PolyNode = null;
			this.m_PolyOuts.push(result);
			result.Idx = this.m_PolyOuts.length - 1;
			return result;
		};
		ClipperLib.ClipperBase.prototype.DisposeOutRec = function(index) {
			var outRec = this.m_PolyOuts[index];
			outRec.Pts = null;
			outRec = null;
			this.m_PolyOuts[index] = null;
		};
		ClipperLib.ClipperBase.prototype.UpdateEdgeIntoAEL = function(e) {
			if (e.NextInLML === null) ClipperLib.Error("UpdateEdgeIntoAEL: invalid call");
			var AelPrev = e.PrevInAEL;
			var AelNext = e.NextInAEL;
			e.NextInLML.OutIdx = e.OutIdx;
			if (AelPrev !== null) AelPrev.NextInAEL = e.NextInLML;
			else this.m_ActiveEdges = e.NextInLML;
			if (AelNext !== null) AelNext.PrevInAEL = e.NextInLML;
			e.NextInLML.Side = e.Side;
			e.NextInLML.WindDelta = e.WindDelta;
			e.NextInLML.WindCnt = e.WindCnt;
			e.NextInLML.WindCnt2 = e.WindCnt2;
			e = e.NextInLML;
			e.Curr.X = e.Bot.X;
			e.Curr.Y = e.Bot.Y;
			e.PrevInAEL = AelPrev;
			e.NextInAEL = AelNext;
			if (!ClipperLib.ClipperBase.IsHorizontal(e)) this.InsertScanbeam(e.Top.Y);
			return e;
		};
		ClipperLib.ClipperBase.prototype.SwapPositionsInAEL = function(edge1, edge2) {
			if (edge1.NextInAEL === edge1.PrevInAEL || edge2.NextInAEL === edge2.PrevInAEL) return;
			if (edge1.NextInAEL === edge2) {
				var next = edge2.NextInAEL;
				if (next !== null) next.PrevInAEL = edge1;
				var prev = edge1.PrevInAEL;
				if (prev !== null) prev.NextInAEL = edge2;
				edge2.PrevInAEL = prev;
				edge2.NextInAEL = edge1;
				edge1.PrevInAEL = edge2;
				edge1.NextInAEL = next;
			} else if (edge2.NextInAEL === edge1) {
				var next1 = edge1.NextInAEL;
				if (next1 !== null) next1.PrevInAEL = edge2;
				var prev1 = edge2.PrevInAEL;
				if (prev1 !== null) prev1.NextInAEL = edge1;
				edge1.PrevInAEL = prev1;
				edge1.NextInAEL = edge2;
				edge2.PrevInAEL = edge1;
				edge2.NextInAEL = next1;
			} else {
				var next2 = edge1.NextInAEL;
				var prev2 = edge1.PrevInAEL;
				edge1.NextInAEL = edge2.NextInAEL;
				if (edge1.NextInAEL !== null) edge1.NextInAEL.PrevInAEL = edge1;
				edge1.PrevInAEL = edge2.PrevInAEL;
				if (edge1.PrevInAEL !== null) edge1.PrevInAEL.NextInAEL = edge1;
				edge2.NextInAEL = next2;
				if (edge2.NextInAEL !== null) edge2.NextInAEL.PrevInAEL = edge2;
				edge2.PrevInAEL = prev2;
				if (edge2.PrevInAEL !== null) edge2.PrevInAEL.NextInAEL = edge2;
			}
			if (edge1.PrevInAEL === null) this.m_ActiveEdges = edge1;
			else if (edge2.PrevInAEL === null) this.m_ActiveEdges = edge2;
		};
		ClipperLib.ClipperBase.prototype.DeleteFromAEL = function(e) {
			var AelPrev = e.PrevInAEL;
			var AelNext = e.NextInAEL;
			if (AelPrev === null && AelNext === null && e !== this.m_ActiveEdges) return;
			if (AelPrev !== null) AelPrev.NextInAEL = AelNext;
			else this.m_ActiveEdges = AelNext;
			if (AelNext !== null) AelNext.PrevInAEL = AelPrev;
			e.NextInAEL = null;
			e.PrevInAEL = null;
		};
		/**
		* @suppress {missingProperties}
		*/
		ClipperLib.Clipper = function(InitOptions) {
			if (typeof InitOptions === "undefined") InitOptions = 0;
			this.m_PolyOuts = null;
			this.m_ClipType = ClipperLib.ClipType.ctIntersection;
			this.m_Scanbeam = null;
			this.m_Maxima = null;
			this.m_ActiveEdges = null;
			this.m_SortedEdges = null;
			this.m_IntersectList = null;
			this.m_IntersectNodeComparer = null;
			this.m_ExecuteLocked = false;
			this.m_ClipFillType = ClipperLib.PolyFillType.pftEvenOdd;
			this.m_SubjFillType = ClipperLib.PolyFillType.pftEvenOdd;
			this.m_Joins = null;
			this.m_GhostJoins = null;
			this.m_UsingPolyTree = false;
			this.ReverseSolution = false;
			this.StrictlySimple = false;
			ClipperLib.ClipperBase.call(this);
			this.m_Scanbeam = null;
			this.m_Maxima = null;
			this.m_ActiveEdges = null;
			this.m_SortedEdges = null;
			this.m_IntersectList = new Array();
			this.m_IntersectNodeComparer = ClipperLib.MyIntersectNodeSort.Compare;
			this.m_ExecuteLocked = false;
			this.m_UsingPolyTree = false;
			this.m_PolyOuts = new Array();
			this.m_Joins = new Array();
			this.m_GhostJoins = new Array();
			this.ReverseSolution = (1 & InitOptions) !== 0;
			this.StrictlySimple = (2 & InitOptions) !== 0;
			this.PreserveCollinear = (4 & InitOptions) !== 0;
			if (ClipperLib.use_xyz) this.ZFillFunction = null;
		};
		ClipperLib.Clipper.ioReverseSolution = 1;
		ClipperLib.Clipper.ioStrictlySimple = 2;
		ClipperLib.Clipper.ioPreserveCollinear = 4;
		ClipperLib.Clipper.prototype.Clear = function() {
			if (this.m_edges.length === 0) return;
			this.DisposeAllPolyPts();
			ClipperLib.ClipperBase.prototype.Clear.call(this);
		};
		ClipperLib.Clipper.prototype.InsertMaxima = function(X) {
			var newMax = new ClipperLib.Maxima();
			newMax.X = X;
			if (this.m_Maxima === null) {
				this.m_Maxima = newMax;
				this.m_Maxima.Next = null;
				this.m_Maxima.Prev = null;
			} else if (X < this.m_Maxima.X) {
				newMax.Next = this.m_Maxima;
				newMax.Prev = null;
				this.m_Maxima = newMax;
			} else {
				var m = this.m_Maxima;
				while (m.Next !== null && X >= m.Next.X) m = m.Next;
				if (X === m.X) return;
				newMax.Next = m.Next;
				newMax.Prev = m;
				if (m.Next !== null) m.Next.Prev = newMax;
				m.Next = newMax;
			}
		};
		ClipperLib.Clipper.prototype.Execute = function() {
			var a = arguments, alen = a.length, ispolytree = a[1] instanceof ClipperLib.PolyTree;
			if (alen === 4 && !ispolytree) {
				var clipType = a[0], solution = a[1], subjFillType = a[2], clipFillType = a[3];
				if (this.m_ExecuteLocked) return false;
				if (this.m_HasOpenPaths) ClipperLib.Error("Error: PolyTree struct is needed for open path clipping.");
				this.m_ExecuteLocked = true;
				ClipperLib.Clear(solution);
				this.m_SubjFillType = subjFillType;
				this.m_ClipFillType = clipFillType;
				this.m_ClipType = clipType;
				this.m_UsingPolyTree = false;
				try {
					var succeeded = this.ExecuteInternal();
					if (succeeded) this.BuildResult(solution);
				} finally {
					this.DisposeAllPolyPts();
					this.m_ExecuteLocked = false;
				}
				return succeeded;
			} else if (alen === 4 && ispolytree) {
				var clipType = a[0], polytree = a[1], subjFillType = a[2], clipFillType = a[3];
				if (this.m_ExecuteLocked) return false;
				this.m_ExecuteLocked = true;
				this.m_SubjFillType = subjFillType;
				this.m_ClipFillType = clipFillType;
				this.m_ClipType = clipType;
				this.m_UsingPolyTree = true;
				try {
					var succeeded = this.ExecuteInternal();
					if (succeeded) this.BuildResult2(polytree);
				} finally {
					this.DisposeAllPolyPts();
					this.m_ExecuteLocked = false;
				}
				return succeeded;
			} else if (alen === 2 && !ispolytree) {
				var clipType = a[0], solution = a[1];
				return this.Execute(clipType, solution, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
			} else if (alen === 2 && ispolytree) {
				var clipType = a[0], polytree = a[1];
				return this.Execute(clipType, polytree, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
			}
		};
		ClipperLib.Clipper.prototype.FixHoleLinkage = function(outRec) {
			if (outRec.FirstLeft === null || outRec.IsHole !== outRec.FirstLeft.IsHole && outRec.FirstLeft.Pts !== null) return;
			var orfl = outRec.FirstLeft;
			while (orfl !== null && (orfl.IsHole === outRec.IsHole || orfl.Pts === null)) orfl = orfl.FirstLeft;
			outRec.FirstLeft = orfl;
		};
		ClipperLib.Clipper.prototype.ExecuteInternal = function() {
			try {
				this.Reset();
				this.m_SortedEdges = null;
				this.m_Maxima = null;
				var botY = {}, topY = {};
				if (!this.PopScanbeam(botY)) return false;
				this.InsertLocalMinimaIntoAEL(botY.v);
				while (this.PopScanbeam(topY) || this.LocalMinimaPending()) {
					this.ProcessHorizontals();
					this.m_GhostJoins.length = 0;
					if (!this.ProcessIntersections(topY.v)) return false;
					this.ProcessEdgesAtTopOfScanbeam(topY.v);
					botY.v = topY.v;
					this.InsertLocalMinimaIntoAEL(botY.v);
				}
				var outRec, i, ilen;
				for (i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
					outRec = this.m_PolyOuts[i];
					if (outRec.Pts === null || outRec.IsOpen) continue;
					if ((outRec.IsHole ^ this.ReverseSolution) == this.Area$1(outRec) > 0) this.ReversePolyPtLinks(outRec.Pts);
				}
				this.JoinCommonEdges();
				for (i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
					outRec = this.m_PolyOuts[i];
					if (outRec.Pts === null) continue;
					else if (outRec.IsOpen) this.FixupOutPolyline(outRec);
					else this.FixupOutPolygon(outRec);
				}
				if (this.StrictlySimple) this.DoSimplePolygons();
				return true;
			} finally {
				this.m_Joins.length = 0;
				this.m_GhostJoins.length = 0;
			}
		};
		ClipperLib.Clipper.prototype.DisposeAllPolyPts = function() {
			for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; ++i) this.DisposeOutRec(i);
			ClipperLib.Clear(this.m_PolyOuts);
		};
		ClipperLib.Clipper.prototype.AddJoin = function(Op1, Op2, OffPt) {
			var j = new ClipperLib.Join();
			j.OutPt1 = Op1;
			j.OutPt2 = Op2;
			j.OffPt.X = OffPt.X;
			j.OffPt.Y = OffPt.Y;
			if (ClipperLib.use_xyz) j.OffPt.Z = OffPt.Z;
			this.m_Joins.push(j);
		};
		ClipperLib.Clipper.prototype.AddGhostJoin = function(Op, OffPt) {
			var j = new ClipperLib.Join();
			j.OutPt1 = Op;
			j.OffPt.X = OffPt.X;
			j.OffPt.Y = OffPt.Y;
			if (ClipperLib.use_xyz) j.OffPt.Z = OffPt.Z;
			this.m_GhostJoins.push(j);
		};
		ClipperLib.Clipper.prototype.SetZ = function(pt, e1, e2) {
			if (this.ZFillFunction !== null) if (pt.Z !== 0 || this.ZFillFunction === null) return;
			else if (ClipperLib.IntPoint.op_Equality(pt, e1.Bot)) pt.Z = e1.Bot.Z;
			else if (ClipperLib.IntPoint.op_Equality(pt, e1.Top)) pt.Z = e1.Top.Z;
			else if (ClipperLib.IntPoint.op_Equality(pt, e2.Bot)) pt.Z = e2.Bot.Z;
			else if (ClipperLib.IntPoint.op_Equality(pt, e2.Top)) pt.Z = e2.Top.Z;
			else this.ZFillFunction(e1.Bot, e1.Top, e2.Bot, e2.Top, pt);
		};
		ClipperLib.Clipper.prototype.InsertLocalMinimaIntoAEL = function(botY) {
			var lm = {};
			var lb;
			var rb;
			while (this.PopLocalMinima(botY, lm)) {
				lb = lm.v.LeftBound;
				rb = lm.v.RightBound;
				var Op1 = null;
				if (lb === null) {
					this.InsertEdgeIntoAEL(rb, null);
					this.SetWindingCount(rb);
					if (this.IsContributing(rb)) Op1 = this.AddOutPt(rb, rb.Bot);
				} else if (rb === null) {
					this.InsertEdgeIntoAEL(lb, null);
					this.SetWindingCount(lb);
					if (this.IsContributing(lb)) Op1 = this.AddOutPt(lb, lb.Bot);
					this.InsertScanbeam(lb.Top.Y);
				} else {
					this.InsertEdgeIntoAEL(lb, null);
					this.InsertEdgeIntoAEL(rb, lb);
					this.SetWindingCount(lb);
					rb.WindCnt = lb.WindCnt;
					rb.WindCnt2 = lb.WindCnt2;
					if (this.IsContributing(lb)) Op1 = this.AddLocalMinPoly(lb, rb, lb.Bot);
					this.InsertScanbeam(lb.Top.Y);
				}
				if (rb !== null) if (ClipperLib.ClipperBase.IsHorizontal(rb)) {
					if (rb.NextInLML !== null) this.InsertScanbeam(rb.NextInLML.Top.Y);
					this.AddEdgeToSEL(rb);
				} else this.InsertScanbeam(rb.Top.Y);
				if (lb === null || rb === null) continue;
				if (Op1 !== null && ClipperLib.ClipperBase.IsHorizontal(rb) && this.m_GhostJoins.length > 0 && rb.WindDelta !== 0) for (var i = 0, ilen = this.m_GhostJoins.length; i < ilen; i++) {
					var j = this.m_GhostJoins[i];
					if (this.HorzSegmentsOverlap(j.OutPt1.Pt.X, j.OffPt.X, rb.Bot.X, rb.Top.X)) this.AddJoin(j.OutPt1, Op1, j.OffPt);
				}
				if (lb.OutIdx >= 0 && lb.PrevInAEL !== null && lb.PrevInAEL.Curr.X === lb.Bot.X && lb.PrevInAEL.OutIdx >= 0 && ClipperLib.ClipperBase.SlopesEqual5(lb.PrevInAEL.Curr, lb.PrevInAEL.Top, lb.Curr, lb.Top, this.m_UseFullRange) && lb.WindDelta !== 0 && lb.PrevInAEL.WindDelta !== 0) {
					var Op2 = this.AddOutPt(lb.PrevInAEL, lb.Bot);
					this.AddJoin(Op1, Op2, lb.Top);
				}
				if (lb.NextInAEL !== rb) {
					if (rb.OutIdx >= 0 && rb.PrevInAEL.OutIdx >= 0 && ClipperLib.ClipperBase.SlopesEqual5(rb.PrevInAEL.Curr, rb.PrevInAEL.Top, rb.Curr, rb.Top, this.m_UseFullRange) && rb.WindDelta !== 0 && rb.PrevInAEL.WindDelta !== 0) {
						var Op2 = this.AddOutPt(rb.PrevInAEL, rb.Bot);
						this.AddJoin(Op1, Op2, rb.Top);
					}
					var e = lb.NextInAEL;
					if (e !== null) while (e !== rb) {
						this.IntersectEdges(rb, e, lb.Curr);
						e = e.NextInAEL;
					}
				}
			}
		};
		ClipperLib.Clipper.prototype.InsertEdgeIntoAEL = function(edge, startEdge) {
			if (this.m_ActiveEdges === null) {
				edge.PrevInAEL = null;
				edge.NextInAEL = null;
				this.m_ActiveEdges = edge;
			} else if (startEdge === null && this.E2InsertsBeforeE1(this.m_ActiveEdges, edge)) {
				edge.PrevInAEL = null;
				edge.NextInAEL = this.m_ActiveEdges;
				this.m_ActiveEdges.PrevInAEL = edge;
				this.m_ActiveEdges = edge;
			} else {
				if (startEdge === null) startEdge = this.m_ActiveEdges;
				while (startEdge.NextInAEL !== null && !this.E2InsertsBeforeE1(startEdge.NextInAEL, edge)) startEdge = startEdge.NextInAEL;
				edge.NextInAEL = startEdge.NextInAEL;
				if (startEdge.NextInAEL !== null) startEdge.NextInAEL.PrevInAEL = edge;
				edge.PrevInAEL = startEdge;
				startEdge.NextInAEL = edge;
			}
		};
		ClipperLib.Clipper.prototype.E2InsertsBeforeE1 = function(e1, e2) {
			if (e2.Curr.X === e1.Curr.X) if (e2.Top.Y > e1.Top.Y) return e2.Top.X < ClipperLib.Clipper.TopX(e1, e2.Top.Y);
			else return e1.Top.X > ClipperLib.Clipper.TopX(e2, e1.Top.Y);
			else return e2.Curr.X < e1.Curr.X;
		};
		ClipperLib.Clipper.prototype.IsEvenOddFillType = function(edge) {
			if (edge.PolyTyp === ClipperLib.PolyType.ptSubject) return this.m_SubjFillType === ClipperLib.PolyFillType.pftEvenOdd;
			else return this.m_ClipFillType === ClipperLib.PolyFillType.pftEvenOdd;
		};
		ClipperLib.Clipper.prototype.IsEvenOddAltFillType = function(edge) {
			if (edge.PolyTyp === ClipperLib.PolyType.ptSubject) return this.m_ClipFillType === ClipperLib.PolyFillType.pftEvenOdd;
			else return this.m_SubjFillType === ClipperLib.PolyFillType.pftEvenOdd;
		};
		ClipperLib.Clipper.prototype.IsContributing = function(edge) {
			var pft, pft2;
			if (edge.PolyTyp === ClipperLib.PolyType.ptSubject) {
				pft = this.m_SubjFillType;
				pft2 = this.m_ClipFillType;
			} else {
				pft = this.m_ClipFillType;
				pft2 = this.m_SubjFillType;
			}
			switch (pft) {
				case ClipperLib.PolyFillType.pftEvenOdd:
					if (edge.WindDelta === 0 && edge.WindCnt !== 1) return false;
					break;
				case ClipperLib.PolyFillType.pftNonZero:
					if (Math.abs(edge.WindCnt) !== 1) return false;
					break;
				case ClipperLib.PolyFillType.pftPositive:
					if (edge.WindCnt !== 1) return false;
					break;
				default:
					if (edge.WindCnt !== -1) return false;
					break;
			}
			switch (this.m_ClipType) {
				case ClipperLib.ClipType.ctIntersection: switch (pft2) {
					case ClipperLib.PolyFillType.pftEvenOdd:
					case ClipperLib.PolyFillType.pftNonZero: return edge.WindCnt2 !== 0;
					case ClipperLib.PolyFillType.pftPositive: return edge.WindCnt2 > 0;
					default: return edge.WindCnt2 < 0;
				}
				case ClipperLib.ClipType.ctUnion: switch (pft2) {
					case ClipperLib.PolyFillType.pftEvenOdd:
					case ClipperLib.PolyFillType.pftNonZero: return edge.WindCnt2 === 0;
					case ClipperLib.PolyFillType.pftPositive: return edge.WindCnt2 <= 0;
					default: return edge.WindCnt2 >= 0;
				}
				case ClipperLib.ClipType.ctDifference: if (edge.PolyTyp === ClipperLib.PolyType.ptSubject) switch (pft2) {
					case ClipperLib.PolyFillType.pftEvenOdd:
					case ClipperLib.PolyFillType.pftNonZero: return edge.WindCnt2 === 0;
					case ClipperLib.PolyFillType.pftPositive: return edge.WindCnt2 <= 0;
					default: return edge.WindCnt2 >= 0;
				}
				else switch (pft2) {
					case ClipperLib.PolyFillType.pftEvenOdd:
					case ClipperLib.PolyFillType.pftNonZero: return edge.WindCnt2 !== 0;
					case ClipperLib.PolyFillType.pftPositive: return edge.WindCnt2 > 0;
					default: return edge.WindCnt2 < 0;
				}
				case ClipperLib.ClipType.ctXor: if (edge.WindDelta === 0) switch (pft2) {
					case ClipperLib.PolyFillType.pftEvenOdd:
					case ClipperLib.PolyFillType.pftNonZero: return edge.WindCnt2 === 0;
					case ClipperLib.PolyFillType.pftPositive: return edge.WindCnt2 <= 0;
					default: return edge.WindCnt2 >= 0;
				}
				else return true;
			}
			return true;
		};
		ClipperLib.Clipper.prototype.SetWindingCount = function(edge) {
			var e = edge.PrevInAEL;
			while (e !== null && (e.PolyTyp !== edge.PolyTyp || e.WindDelta === 0)) e = e.PrevInAEL;
			if (e === null) {
				var pft = edge.PolyTyp === ClipperLib.PolyType.ptSubject ? this.m_SubjFillType : this.m_ClipFillType;
				if (edge.WindDelta === 0) edge.WindCnt = pft === ClipperLib.PolyFillType.pftNegative ? -1 : 1;
				else edge.WindCnt = edge.WindDelta;
				edge.WindCnt2 = 0;
				e = this.m_ActiveEdges;
			} else if (edge.WindDelta === 0 && this.m_ClipType !== ClipperLib.ClipType.ctUnion) {
				edge.WindCnt = 1;
				edge.WindCnt2 = e.WindCnt2;
				e = e.NextInAEL;
			} else if (this.IsEvenOddFillType(edge)) {
				if (edge.WindDelta === 0) {
					var Inside = true;
					var e2 = e.PrevInAEL;
					while (e2 !== null) {
						if (e2.PolyTyp === e.PolyTyp && e2.WindDelta !== 0) Inside = !Inside;
						e2 = e2.PrevInAEL;
					}
					edge.WindCnt = Inside ? 0 : 1;
				} else edge.WindCnt = edge.WindDelta;
				edge.WindCnt2 = e.WindCnt2;
				e = e.NextInAEL;
			} else {
				if (e.WindCnt * e.WindDelta < 0) if (Math.abs(e.WindCnt) > 1) if (e.WindDelta * edge.WindDelta < 0) edge.WindCnt = e.WindCnt;
				else edge.WindCnt = e.WindCnt + edge.WindDelta;
				else edge.WindCnt = edge.WindDelta === 0 ? 1 : edge.WindDelta;
				else if (edge.WindDelta === 0) edge.WindCnt = e.WindCnt < 0 ? e.WindCnt - 1 : e.WindCnt + 1;
				else if (e.WindDelta * edge.WindDelta < 0) edge.WindCnt = e.WindCnt;
				else edge.WindCnt = e.WindCnt + edge.WindDelta;
				edge.WindCnt2 = e.WindCnt2;
				e = e.NextInAEL;
			}
			if (this.IsEvenOddAltFillType(edge)) while (e !== edge) {
				if (e.WindDelta !== 0) edge.WindCnt2 = edge.WindCnt2 === 0 ? 1 : 0;
				e = e.NextInAEL;
			}
			else while (e !== edge) {
				edge.WindCnt2 += e.WindDelta;
				e = e.NextInAEL;
			}
		};
		ClipperLib.Clipper.prototype.AddEdgeToSEL = function(edge) {
			if (this.m_SortedEdges === null) {
				this.m_SortedEdges = edge;
				edge.PrevInSEL = null;
				edge.NextInSEL = null;
			} else {
				edge.NextInSEL = this.m_SortedEdges;
				edge.PrevInSEL = null;
				this.m_SortedEdges.PrevInSEL = edge;
				this.m_SortedEdges = edge;
			}
		};
		ClipperLib.Clipper.prototype.PopEdgeFromSEL = function(e) {
			e.v = this.m_SortedEdges;
			if (e.v === null) return false;
			var oldE = e.v;
			this.m_SortedEdges = e.v.NextInSEL;
			if (this.m_SortedEdges !== null) this.m_SortedEdges.PrevInSEL = null;
			oldE.NextInSEL = null;
			oldE.PrevInSEL = null;
			return true;
		};
		ClipperLib.Clipper.prototype.CopyAELToSEL = function() {
			var e = this.m_ActiveEdges;
			this.m_SortedEdges = e;
			while (e !== null) {
				e.PrevInSEL = e.PrevInAEL;
				e.NextInSEL = e.NextInAEL;
				e = e.NextInAEL;
			}
		};
		ClipperLib.Clipper.prototype.SwapPositionsInSEL = function(edge1, edge2) {
			if (edge1.NextInSEL === null && edge1.PrevInSEL === null) return;
			if (edge2.NextInSEL === null && edge2.PrevInSEL === null) return;
			if (edge1.NextInSEL === edge2) {
				var next = edge2.NextInSEL;
				if (next !== null) next.PrevInSEL = edge1;
				var prev = edge1.PrevInSEL;
				if (prev !== null) prev.NextInSEL = edge2;
				edge2.PrevInSEL = prev;
				edge2.NextInSEL = edge1;
				edge1.PrevInSEL = edge2;
				edge1.NextInSEL = next;
			} else if (edge2.NextInSEL === edge1) {
				var next = edge1.NextInSEL;
				if (next !== null) next.PrevInSEL = edge2;
				var prev = edge2.PrevInSEL;
				if (prev !== null) prev.NextInSEL = edge1;
				edge1.PrevInSEL = prev;
				edge1.NextInSEL = edge2;
				edge2.PrevInSEL = edge1;
				edge2.NextInSEL = next;
			} else {
				var next = edge1.NextInSEL;
				var prev = edge1.PrevInSEL;
				edge1.NextInSEL = edge2.NextInSEL;
				if (edge1.NextInSEL !== null) edge1.NextInSEL.PrevInSEL = edge1;
				edge1.PrevInSEL = edge2.PrevInSEL;
				if (edge1.PrevInSEL !== null) edge1.PrevInSEL.NextInSEL = edge1;
				edge2.NextInSEL = next;
				if (edge2.NextInSEL !== null) edge2.NextInSEL.PrevInSEL = edge2;
				edge2.PrevInSEL = prev;
				if (edge2.PrevInSEL !== null) edge2.PrevInSEL.NextInSEL = edge2;
			}
			if (edge1.PrevInSEL === null) this.m_SortedEdges = edge1;
			else if (edge2.PrevInSEL === null) this.m_SortedEdges = edge2;
		};
		ClipperLib.Clipper.prototype.AddLocalMaxPoly = function(e1, e2, pt) {
			this.AddOutPt(e1, pt);
			if (e2.WindDelta === 0) this.AddOutPt(e2, pt);
			if (e1.OutIdx === e2.OutIdx) {
				e1.OutIdx = -1;
				e2.OutIdx = -1;
			} else if (e1.OutIdx < e2.OutIdx) this.AppendPolygon(e1, e2);
			else this.AppendPolygon(e2, e1);
		};
		ClipperLib.Clipper.prototype.AddLocalMinPoly = function(e1, e2, pt) {
			var result;
			var e, prevE;
			if (ClipperLib.ClipperBase.IsHorizontal(e2) || e1.Dx > e2.Dx) {
				result = this.AddOutPt(e1, pt);
				e2.OutIdx = e1.OutIdx;
				e1.Side = ClipperLib.EdgeSide.esLeft;
				e2.Side = ClipperLib.EdgeSide.esRight;
				e = e1;
				if (e.PrevInAEL === e2) prevE = e2.PrevInAEL;
				else prevE = e.PrevInAEL;
			} else {
				result = this.AddOutPt(e2, pt);
				e1.OutIdx = e2.OutIdx;
				e1.Side = ClipperLib.EdgeSide.esRight;
				e2.Side = ClipperLib.EdgeSide.esLeft;
				e = e2;
				if (e.PrevInAEL === e1) prevE = e1.PrevInAEL;
				else prevE = e.PrevInAEL;
			}
			if (prevE !== null && prevE.OutIdx >= 0 && prevE.Top.Y < pt.Y && e.Top.Y < pt.Y) {
				var xPrev = ClipperLib.Clipper.TopX(prevE, pt.Y);
				var xE = ClipperLib.Clipper.TopX(e, pt.Y);
				if (xPrev === xE && e.WindDelta !== 0 && prevE.WindDelta !== 0 && ClipperLib.ClipperBase.SlopesEqual5(new ClipperLib.IntPoint2(xPrev, pt.Y), prevE.Top, new ClipperLib.IntPoint2(xE, pt.Y), e.Top, this.m_UseFullRange)) {
					var outPt = this.AddOutPt(prevE, pt);
					this.AddJoin(result, outPt, e.Top);
				}
			}
			return result;
		};
		ClipperLib.Clipper.prototype.AddOutPt = function(e, pt) {
			if (e.OutIdx < 0) {
				var outRec = this.CreateOutRec();
				outRec.IsOpen = e.WindDelta === 0;
				var newOp = new ClipperLib.OutPt();
				outRec.Pts = newOp;
				newOp.Idx = outRec.Idx;
				newOp.Pt.X = pt.X;
				newOp.Pt.Y = pt.Y;
				if (ClipperLib.use_xyz) newOp.Pt.Z = pt.Z;
				newOp.Next = newOp;
				newOp.Prev = newOp;
				if (!outRec.IsOpen) this.SetHoleState(e, outRec);
				e.OutIdx = outRec.Idx;
				return newOp;
			} else {
				var outRec = this.m_PolyOuts[e.OutIdx];
				var op = outRec.Pts;
				var ToFront = e.Side === ClipperLib.EdgeSide.esLeft;
				if (ToFront && ClipperLib.IntPoint.op_Equality(pt, op.Pt)) return op;
				else if (!ToFront && ClipperLib.IntPoint.op_Equality(pt, op.Prev.Pt)) return op.Prev;
				var newOp = new ClipperLib.OutPt();
				newOp.Idx = outRec.Idx;
				newOp.Pt.X = pt.X;
				newOp.Pt.Y = pt.Y;
				if (ClipperLib.use_xyz) newOp.Pt.Z = pt.Z;
				newOp.Next = op;
				newOp.Prev = op.Prev;
				newOp.Prev.Next = newOp;
				op.Prev = newOp;
				if (ToFront) outRec.Pts = newOp;
				return newOp;
			}
		};
		ClipperLib.Clipper.prototype.GetLastOutPt = function(e) {
			var outRec = this.m_PolyOuts[e.OutIdx];
			if (e.Side === ClipperLib.EdgeSide.esLeft) return outRec.Pts;
			else return outRec.Pts.Prev;
		};
		ClipperLib.Clipper.prototype.SwapPoints = function(pt1, pt2) {
			var tmp = new ClipperLib.IntPoint1(pt1.Value);
			pt1.Value.X = pt2.Value.X;
			pt1.Value.Y = pt2.Value.Y;
			if (ClipperLib.use_xyz) pt1.Value.Z = pt2.Value.Z;
			pt2.Value.X = tmp.X;
			pt2.Value.Y = tmp.Y;
			if (ClipperLib.use_xyz) pt2.Value.Z = tmp.Z;
		};
		ClipperLib.Clipper.prototype.HorzSegmentsOverlap = function(seg1a, seg1b, seg2a, seg2b) {
			var tmp;
			if (seg1a > seg1b) {
				tmp = seg1a;
				seg1a = seg1b;
				seg1b = tmp;
			}
			if (seg2a > seg2b) {
				tmp = seg2a;
				seg2a = seg2b;
				seg2b = tmp;
			}
			return seg1a < seg2b && seg2a < seg1b;
		};
		ClipperLib.Clipper.prototype.SetHoleState = function(e, outRec) {
			var e2 = e.PrevInAEL;
			var eTmp = null;
			while (e2 !== null) {
				if (e2.OutIdx >= 0 && e2.WindDelta !== 0) {
					if (eTmp === null) eTmp = e2;
					else if (eTmp.OutIdx === e2.OutIdx) eTmp = null;
				}
				e2 = e2.PrevInAEL;
			}
			if (eTmp === null) {
				outRec.FirstLeft = null;
				outRec.IsHole = false;
			} else {
				outRec.FirstLeft = this.m_PolyOuts[eTmp.OutIdx];
				outRec.IsHole = !outRec.FirstLeft.IsHole;
			}
		};
		ClipperLib.Clipper.prototype.GetDx = function(pt1, pt2) {
			if (pt1.Y === pt2.Y) return ClipperLib.ClipperBase.horizontal;
			else return (pt2.X - pt1.X) / (pt2.Y - pt1.Y);
		};
		ClipperLib.Clipper.prototype.FirstIsBottomPt = function(btmPt1, btmPt2) {
			var p = btmPt1.Prev;
			while (ClipperLib.IntPoint.op_Equality(p.Pt, btmPt1.Pt) && p !== btmPt1) p = p.Prev;
			var dx1p = Math.abs(this.GetDx(btmPt1.Pt, p.Pt));
			p = btmPt1.Next;
			while (ClipperLib.IntPoint.op_Equality(p.Pt, btmPt1.Pt) && p !== btmPt1) p = p.Next;
			var dx1n = Math.abs(this.GetDx(btmPt1.Pt, p.Pt));
			p = btmPt2.Prev;
			while (ClipperLib.IntPoint.op_Equality(p.Pt, btmPt2.Pt) && p !== btmPt2) p = p.Prev;
			var dx2p = Math.abs(this.GetDx(btmPt2.Pt, p.Pt));
			p = btmPt2.Next;
			while (ClipperLib.IntPoint.op_Equality(p.Pt, btmPt2.Pt) && p !== btmPt2) p = p.Next;
			var dx2n = Math.abs(this.GetDx(btmPt2.Pt, p.Pt));
			if (Math.max(dx1p, dx1n) === Math.max(dx2p, dx2n) && Math.min(dx1p, dx1n) === Math.min(dx2p, dx2n)) return this.Area(btmPt1) > 0;
			else return dx1p >= dx2p && dx1p >= dx2n || dx1n >= dx2p && dx1n >= dx2n;
		};
		ClipperLib.Clipper.prototype.GetBottomPt = function(pp) {
			var dups = null;
			var p = pp.Next;
			while (p !== pp) {
				if (p.Pt.Y > pp.Pt.Y) {
					pp = p;
					dups = null;
				} else if (p.Pt.Y === pp.Pt.Y && p.Pt.X <= pp.Pt.X) {
					if (p.Pt.X < pp.Pt.X) {
						dups = null;
						pp = p;
					} else if (p.Next !== pp && p.Prev !== pp) dups = p;
				}
				p = p.Next;
			}
			if (dups !== null) while (dups !== p) {
				if (!this.FirstIsBottomPt(p, dups)) pp = dups;
				dups = dups.Next;
				while (ClipperLib.IntPoint.op_Inequality(dups.Pt, pp.Pt)) dups = dups.Next;
			}
			return pp;
		};
		ClipperLib.Clipper.prototype.GetLowermostRec = function(outRec1, outRec2) {
			if (outRec1.BottomPt === null) outRec1.BottomPt = this.GetBottomPt(outRec1.Pts);
			if (outRec2.BottomPt === null) outRec2.BottomPt = this.GetBottomPt(outRec2.Pts);
			var bPt1 = outRec1.BottomPt;
			var bPt2 = outRec2.BottomPt;
			if (bPt1.Pt.Y > bPt2.Pt.Y) return outRec1;
			else if (bPt1.Pt.Y < bPt2.Pt.Y) return outRec2;
			else if (bPt1.Pt.X < bPt2.Pt.X) return outRec1;
			else if (bPt1.Pt.X > bPt2.Pt.X) return outRec2;
			else if (bPt1.Next === bPt1) return outRec2;
			else if (bPt2.Next === bPt2) return outRec1;
			else if (this.FirstIsBottomPt(bPt1, bPt2)) return outRec1;
			else return outRec2;
		};
		ClipperLib.Clipper.prototype.OutRec1RightOfOutRec2 = function(outRec1, outRec2) {
			do {
				outRec1 = outRec1.FirstLeft;
				if (outRec1 === outRec2) return true;
			} while (outRec1 !== null);
			return false;
		};
		ClipperLib.Clipper.prototype.GetOutRec = function(idx) {
			var outrec = this.m_PolyOuts[idx];
			while (outrec !== this.m_PolyOuts[outrec.Idx]) outrec = this.m_PolyOuts[outrec.Idx];
			return outrec;
		};
		ClipperLib.Clipper.prototype.AppendPolygon = function(e1, e2) {
			var outRec1 = this.m_PolyOuts[e1.OutIdx];
			var outRec2 = this.m_PolyOuts[e2.OutIdx];
			var holeStateRec;
			if (this.OutRec1RightOfOutRec2(outRec1, outRec2)) holeStateRec = outRec2;
			else if (this.OutRec1RightOfOutRec2(outRec2, outRec1)) holeStateRec = outRec1;
			else holeStateRec = this.GetLowermostRec(outRec1, outRec2);
			var p1_lft = outRec1.Pts;
			var p1_rt = p1_lft.Prev;
			var p2_lft = outRec2.Pts;
			var p2_rt = p2_lft.Prev;
			if (e1.Side === ClipperLib.EdgeSide.esLeft) if (e2.Side === ClipperLib.EdgeSide.esLeft) {
				this.ReversePolyPtLinks(p2_lft);
				p2_lft.Next = p1_lft;
				p1_lft.Prev = p2_lft;
				p1_rt.Next = p2_rt;
				p2_rt.Prev = p1_rt;
				outRec1.Pts = p2_rt;
			} else {
				p2_rt.Next = p1_lft;
				p1_lft.Prev = p2_rt;
				p2_lft.Prev = p1_rt;
				p1_rt.Next = p2_lft;
				outRec1.Pts = p2_lft;
			}
			else if (e2.Side === ClipperLib.EdgeSide.esRight) {
				this.ReversePolyPtLinks(p2_lft);
				p1_rt.Next = p2_rt;
				p2_rt.Prev = p1_rt;
				p2_lft.Next = p1_lft;
				p1_lft.Prev = p2_lft;
			} else {
				p1_rt.Next = p2_lft;
				p2_lft.Prev = p1_rt;
				p1_lft.Prev = p2_rt;
				p2_rt.Next = p1_lft;
			}
			outRec1.BottomPt = null;
			if (holeStateRec === outRec2) {
				if (outRec2.FirstLeft !== outRec1) outRec1.FirstLeft = outRec2.FirstLeft;
				outRec1.IsHole = outRec2.IsHole;
			}
			outRec2.Pts = null;
			outRec2.BottomPt = null;
			outRec2.FirstLeft = outRec1;
			var OKIdx = e1.OutIdx;
			var ObsoleteIdx = e2.OutIdx;
			e1.OutIdx = -1;
			e2.OutIdx = -1;
			var e = this.m_ActiveEdges;
			while (e !== null) {
				if (e.OutIdx === ObsoleteIdx) {
					e.OutIdx = OKIdx;
					e.Side = e1.Side;
					break;
				}
				e = e.NextInAEL;
			}
			outRec2.Idx = outRec1.Idx;
		};
		ClipperLib.Clipper.prototype.ReversePolyPtLinks = function(pp) {
			if (pp === null) return;
			var pp1;
			var pp2;
			pp1 = pp;
			do {
				pp2 = pp1.Next;
				pp1.Next = pp1.Prev;
				pp1.Prev = pp2;
				pp1 = pp2;
			} while (pp1 !== pp);
		};
		ClipperLib.Clipper.SwapSides = function(edge1, edge2) {
			var side = edge1.Side;
			edge1.Side = edge2.Side;
			edge2.Side = side;
		};
		ClipperLib.Clipper.SwapPolyIndexes = function(edge1, edge2) {
			var outIdx = edge1.OutIdx;
			edge1.OutIdx = edge2.OutIdx;
			edge2.OutIdx = outIdx;
		};
		ClipperLib.Clipper.prototype.IntersectEdges = function(e1, e2, pt) {
			var e1Contributing = e1.OutIdx >= 0;
			var e2Contributing = e2.OutIdx >= 0;
			if (ClipperLib.use_xyz) this.SetZ(pt, e1, e2);
			if (ClipperLib.use_lines) {
				if (e1.WindDelta === 0 || e2.WindDelta === 0) {
					if (e1.WindDelta === 0 && e2.WindDelta === 0) return;
					else if (e1.PolyTyp === e2.PolyTyp && e1.WindDelta !== e2.WindDelta && this.m_ClipType === ClipperLib.ClipType.ctUnion) {
						if (e1.WindDelta === 0) {
							if (e2Contributing) {
								this.AddOutPt(e1, pt);
								if (e1Contributing) e1.OutIdx = -1;
							}
						} else if (e1Contributing) {
							this.AddOutPt(e2, pt);
							if (e2Contributing) e2.OutIdx = -1;
						}
					} else if (e1.PolyTyp !== e2.PolyTyp) {
						if (e1.WindDelta === 0 && Math.abs(e2.WindCnt) === 1 && (this.m_ClipType !== ClipperLib.ClipType.ctUnion || e2.WindCnt2 === 0)) {
							this.AddOutPt(e1, pt);
							if (e1Contributing) e1.OutIdx = -1;
						} else if (e2.WindDelta === 0 && Math.abs(e1.WindCnt) === 1 && (this.m_ClipType !== ClipperLib.ClipType.ctUnion || e1.WindCnt2 === 0)) {
							this.AddOutPt(e2, pt);
							if (e2Contributing) e2.OutIdx = -1;
						}
					}
					return;
				}
			}
			if (e1.PolyTyp === e2.PolyTyp) if (this.IsEvenOddFillType(e1)) {
				var oldE1WindCnt = e1.WindCnt;
				e1.WindCnt = e2.WindCnt;
				e2.WindCnt = oldE1WindCnt;
			} else {
				if (e1.WindCnt + e2.WindDelta === 0) e1.WindCnt = -e1.WindCnt;
				else e1.WindCnt += e2.WindDelta;
				if (e2.WindCnt - e1.WindDelta === 0) e2.WindCnt = -e2.WindCnt;
				else e2.WindCnt -= e1.WindDelta;
			}
			else {
				if (!this.IsEvenOddFillType(e2)) e1.WindCnt2 += e2.WindDelta;
				else e1.WindCnt2 = e1.WindCnt2 === 0 ? 1 : 0;
				if (!this.IsEvenOddFillType(e1)) e2.WindCnt2 -= e1.WindDelta;
				else e2.WindCnt2 = e2.WindCnt2 === 0 ? 1 : 0;
			}
			var e1FillType, e2FillType, e1FillType2, e2FillType2;
			if (e1.PolyTyp === ClipperLib.PolyType.ptSubject) {
				e1FillType = this.m_SubjFillType;
				e1FillType2 = this.m_ClipFillType;
			} else {
				e1FillType = this.m_ClipFillType;
				e1FillType2 = this.m_SubjFillType;
			}
			if (e2.PolyTyp === ClipperLib.PolyType.ptSubject) {
				e2FillType = this.m_SubjFillType;
				e2FillType2 = this.m_ClipFillType;
			} else {
				e2FillType = this.m_ClipFillType;
				e2FillType2 = this.m_SubjFillType;
			}
			var e1Wc, e2Wc;
			switch (e1FillType) {
				case ClipperLib.PolyFillType.pftPositive:
					e1Wc = e1.WindCnt;
					break;
				case ClipperLib.PolyFillType.pftNegative:
					e1Wc = -e1.WindCnt;
					break;
				default:
					e1Wc = Math.abs(e1.WindCnt);
					break;
			}
			switch (e2FillType) {
				case ClipperLib.PolyFillType.pftPositive:
					e2Wc = e2.WindCnt;
					break;
				case ClipperLib.PolyFillType.pftNegative:
					e2Wc = -e2.WindCnt;
					break;
				default:
					e2Wc = Math.abs(e2.WindCnt);
					break;
			}
			if (e1Contributing && e2Contributing) if (e1Wc !== 0 && e1Wc !== 1 || e2Wc !== 0 && e2Wc !== 1 || e1.PolyTyp !== e2.PolyTyp && this.m_ClipType !== ClipperLib.ClipType.ctXor) this.AddLocalMaxPoly(e1, e2, pt);
			else {
				this.AddOutPt(e1, pt);
				this.AddOutPt(e2, pt);
				ClipperLib.Clipper.SwapSides(e1, e2);
				ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
			}
			else if (e1Contributing) {
				if (e2Wc === 0 || e2Wc === 1) {
					this.AddOutPt(e1, pt);
					ClipperLib.Clipper.SwapSides(e1, e2);
					ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
				}
			} else if (e2Contributing) {
				if (e1Wc === 0 || e1Wc === 1) {
					this.AddOutPt(e2, pt);
					ClipperLib.Clipper.SwapSides(e1, e2);
					ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
				}
			} else if ((e1Wc === 0 || e1Wc === 1) && (e2Wc === 0 || e2Wc === 1)) {
				var e1Wc2, e2Wc2;
				switch (e1FillType2) {
					case ClipperLib.PolyFillType.pftPositive:
						e1Wc2 = e1.WindCnt2;
						break;
					case ClipperLib.PolyFillType.pftNegative:
						e1Wc2 = -e1.WindCnt2;
						break;
					default:
						e1Wc2 = Math.abs(e1.WindCnt2);
						break;
				}
				switch (e2FillType2) {
					case ClipperLib.PolyFillType.pftPositive:
						e2Wc2 = e2.WindCnt2;
						break;
					case ClipperLib.PolyFillType.pftNegative:
						e2Wc2 = -e2.WindCnt2;
						break;
					default:
						e2Wc2 = Math.abs(e2.WindCnt2);
						break;
				}
				if (e1.PolyTyp !== e2.PolyTyp) this.AddLocalMinPoly(e1, e2, pt);
				else if (e1Wc === 1 && e2Wc === 1) switch (this.m_ClipType) {
					case ClipperLib.ClipType.ctIntersection:
						if (e1Wc2 > 0 && e2Wc2 > 0) this.AddLocalMinPoly(e1, e2, pt);
						break;
					case ClipperLib.ClipType.ctUnion:
						if (e1Wc2 <= 0 && e2Wc2 <= 0) this.AddLocalMinPoly(e1, e2, pt);
						break;
					case ClipperLib.ClipType.ctDifference:
						if (e1.PolyTyp === ClipperLib.PolyType.ptClip && e1Wc2 > 0 && e2Wc2 > 0 || e1.PolyTyp === ClipperLib.PolyType.ptSubject && e1Wc2 <= 0 && e2Wc2 <= 0) this.AddLocalMinPoly(e1, e2, pt);
						break;
					case ClipperLib.ClipType.ctXor:
						this.AddLocalMinPoly(e1, e2, pt);
						break;
				}
				else ClipperLib.Clipper.SwapSides(e1, e2);
			}
		};
		ClipperLib.Clipper.prototype.DeleteFromSEL = function(e) {
			var SelPrev = e.PrevInSEL;
			var SelNext = e.NextInSEL;
			if (SelPrev === null && SelNext === null && e !== this.m_SortedEdges) return;
			if (SelPrev !== null) SelPrev.NextInSEL = SelNext;
			else this.m_SortedEdges = SelNext;
			if (SelNext !== null) SelNext.PrevInSEL = SelPrev;
			e.NextInSEL = null;
			e.PrevInSEL = null;
		};
		ClipperLib.Clipper.prototype.ProcessHorizontals = function() {
			var horzEdge = {};
			while (this.PopEdgeFromSEL(horzEdge)) this.ProcessHorizontal(horzEdge.v);
		};
		ClipperLib.Clipper.prototype.GetHorzDirection = function(HorzEdge, $var) {
			if (HorzEdge.Bot.X < HorzEdge.Top.X) {
				$var.Left = HorzEdge.Bot.X;
				$var.Right = HorzEdge.Top.X;
				$var.Dir = ClipperLib.Direction.dLeftToRight;
			} else {
				$var.Left = HorzEdge.Top.X;
				$var.Right = HorzEdge.Bot.X;
				$var.Dir = ClipperLib.Direction.dRightToLeft;
			}
		};
		ClipperLib.Clipper.prototype.ProcessHorizontal = function(horzEdge) {
			var $var = {
				Dir: null,
				Left: null,
				Right: null
			};
			this.GetHorzDirection(horzEdge, $var);
			var dir = $var.Dir;
			var horzLeft = $var.Left;
			var horzRight = $var.Right;
			var IsOpen = horzEdge.WindDelta === 0;
			var eLastHorz = horzEdge, eMaxPair = null;
			while (eLastHorz.NextInLML !== null && ClipperLib.ClipperBase.IsHorizontal(eLastHorz.NextInLML)) eLastHorz = eLastHorz.NextInLML;
			if (eLastHorz.NextInLML === null) eMaxPair = this.GetMaximaPair(eLastHorz);
			var currMax = this.m_Maxima;
			if (currMax !== null) if (dir === ClipperLib.Direction.dLeftToRight) {
				while (currMax !== null && currMax.X <= horzEdge.Bot.X) currMax = currMax.Next;
				if (currMax !== null && currMax.X >= eLastHorz.Top.X) currMax = null;
			} else {
				while (currMax.Next !== null && currMax.Next.X < horzEdge.Bot.X) currMax = currMax.Next;
				if (currMax.X <= eLastHorz.Top.X) currMax = null;
			}
			var op1 = null;
			for (;;) {
				var IsLastHorz = horzEdge === eLastHorz;
				var e = this.GetNextInAEL(horzEdge, dir);
				while (e !== null) {
					if (currMax !== null) if (dir === ClipperLib.Direction.dLeftToRight) while (currMax !== null && currMax.X < e.Curr.X) {
						if (horzEdge.OutIdx >= 0 && !IsOpen) this.AddOutPt(horzEdge, new ClipperLib.IntPoint2(currMax.X, horzEdge.Bot.Y));
						currMax = currMax.Next;
					}
					else while (currMax !== null && currMax.X > e.Curr.X) {
						if (horzEdge.OutIdx >= 0 && !IsOpen) this.AddOutPt(horzEdge, new ClipperLib.IntPoint2(currMax.X, horzEdge.Bot.Y));
						currMax = currMax.Prev;
					}
					if (dir === ClipperLib.Direction.dLeftToRight && e.Curr.X > horzRight || dir === ClipperLib.Direction.dRightToLeft && e.Curr.X < horzLeft) break;
					if (e.Curr.X === horzEdge.Top.X && horzEdge.NextInLML !== null && e.Dx < horzEdge.NextInLML.Dx) break;
					if (horzEdge.OutIdx >= 0 && !IsOpen) {
						if (ClipperLib.use_xyz) if (dir === ClipperLib.Direction.dLeftToRight) this.SetZ(e.Curr, horzEdge, e);
						else this.SetZ(e.Curr, e, horzEdge);
						op1 = this.AddOutPt(horzEdge, e.Curr);
						var eNextHorz = this.m_SortedEdges;
						while (eNextHorz !== null) {
							if (eNextHorz.OutIdx >= 0 && this.HorzSegmentsOverlap(horzEdge.Bot.X, horzEdge.Top.X, eNextHorz.Bot.X, eNextHorz.Top.X)) {
								var op2 = this.GetLastOutPt(eNextHorz);
								this.AddJoin(op2, op1, eNextHorz.Top);
							}
							eNextHorz = eNextHorz.NextInSEL;
						}
						this.AddGhostJoin(op1, horzEdge.Bot);
					}
					if (e === eMaxPair && IsLastHorz) {
						if (horzEdge.OutIdx >= 0) this.AddLocalMaxPoly(horzEdge, eMaxPair, horzEdge.Top);
						this.DeleteFromAEL(horzEdge);
						this.DeleteFromAEL(eMaxPair);
						return;
					}
					if (dir === ClipperLib.Direction.dLeftToRight) {
						var Pt = new ClipperLib.IntPoint2(e.Curr.X, horzEdge.Curr.Y);
						this.IntersectEdges(horzEdge, e, Pt);
					} else {
						var Pt = new ClipperLib.IntPoint2(e.Curr.X, horzEdge.Curr.Y);
						this.IntersectEdges(e, horzEdge, Pt);
					}
					var eNext = this.GetNextInAEL(e, dir);
					this.SwapPositionsInAEL(horzEdge, e);
					e = eNext;
				}
				if (horzEdge.NextInLML === null || !ClipperLib.ClipperBase.IsHorizontal(horzEdge.NextInLML)) break;
				horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
				if (horzEdge.OutIdx >= 0) this.AddOutPt(horzEdge, horzEdge.Bot);
				$var = {
					Dir: dir,
					Left: horzLeft,
					Right: horzRight
				};
				this.GetHorzDirection(horzEdge, $var);
				dir = $var.Dir;
				horzLeft = $var.Left;
				horzRight = $var.Right;
			}
			if (horzEdge.OutIdx >= 0 && op1 === null) {
				op1 = this.GetLastOutPt(horzEdge);
				var eNextHorz = this.m_SortedEdges;
				while (eNextHorz !== null) {
					if (eNextHorz.OutIdx >= 0 && this.HorzSegmentsOverlap(horzEdge.Bot.X, horzEdge.Top.X, eNextHorz.Bot.X, eNextHorz.Top.X)) {
						var op2 = this.GetLastOutPt(eNextHorz);
						this.AddJoin(op2, op1, eNextHorz.Top);
					}
					eNextHorz = eNextHorz.NextInSEL;
				}
				this.AddGhostJoin(op1, horzEdge.Top);
			}
			if (horzEdge.NextInLML !== null) if (horzEdge.OutIdx >= 0) {
				op1 = this.AddOutPt(horzEdge, horzEdge.Top);
				horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
				if (horzEdge.WindDelta === 0) return;
				var ePrev = horzEdge.PrevInAEL;
				var eNext = horzEdge.NextInAEL;
				if (ePrev !== null && ePrev.Curr.X === horzEdge.Bot.X && ePrev.Curr.Y === horzEdge.Bot.Y && ePrev.WindDelta === 0 && ePrev.OutIdx >= 0 && ePrev.Curr.Y > ePrev.Top.Y && ClipperLib.ClipperBase.SlopesEqual3(horzEdge, ePrev, this.m_UseFullRange)) {
					var op2 = this.AddOutPt(ePrev, horzEdge.Bot);
					this.AddJoin(op1, op2, horzEdge.Top);
				} else if (eNext !== null && eNext.Curr.X === horzEdge.Bot.X && eNext.Curr.Y === horzEdge.Bot.Y && eNext.WindDelta !== 0 && eNext.OutIdx >= 0 && eNext.Curr.Y > eNext.Top.Y && ClipperLib.ClipperBase.SlopesEqual3(horzEdge, eNext, this.m_UseFullRange)) {
					var op2 = this.AddOutPt(eNext, horzEdge.Bot);
					this.AddJoin(op1, op2, horzEdge.Top);
				}
			} else horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
			else {
				if (horzEdge.OutIdx >= 0) this.AddOutPt(horzEdge, horzEdge.Top);
				this.DeleteFromAEL(horzEdge);
			}
		};
		ClipperLib.Clipper.prototype.GetNextInAEL = function(e, Direction) {
			return Direction === ClipperLib.Direction.dLeftToRight ? e.NextInAEL : e.PrevInAEL;
		};
		ClipperLib.Clipper.prototype.IsMinima = function(e) {
			return e !== null && e.Prev.NextInLML !== e && e.Next.NextInLML !== e;
		};
		ClipperLib.Clipper.prototype.IsMaxima = function(e, Y) {
			return e !== null && e.Top.Y === Y && e.NextInLML === null;
		};
		ClipperLib.Clipper.prototype.IsIntermediate = function(e, Y) {
			return e.Top.Y === Y && e.NextInLML !== null;
		};
		ClipperLib.Clipper.prototype.GetMaximaPair = function(e) {
			if (ClipperLib.IntPoint.op_Equality(e.Next.Top, e.Top) && e.Next.NextInLML === null) return e.Next;
			else if (ClipperLib.IntPoint.op_Equality(e.Prev.Top, e.Top) && e.Prev.NextInLML === null) return e.Prev;
			else return null;
		};
		ClipperLib.Clipper.prototype.GetMaximaPairEx = function(e) {
			var result = this.GetMaximaPair(e);
			if (result === null || result.OutIdx === ClipperLib.ClipperBase.Skip || result.NextInAEL === result.PrevInAEL && !ClipperLib.ClipperBase.IsHorizontal(result)) return null;
			return result;
		};
		ClipperLib.Clipper.prototype.ProcessIntersections = function(topY) {
			if (this.m_ActiveEdges === null) return true;
			try {
				this.BuildIntersectList(topY);
				if (this.m_IntersectList.length === 0) return true;
				if (this.m_IntersectList.length === 1 || this.FixupIntersectionOrder()) this.ProcessIntersectList();
				else return false;
			} catch ($$e2) {
				this.m_SortedEdges = null;
				this.m_IntersectList.length = 0;
				ClipperLib.Error("ProcessIntersections error");
			}
			this.m_SortedEdges = null;
			return true;
		};
		ClipperLib.Clipper.prototype.BuildIntersectList = function(topY) {
			if (this.m_ActiveEdges === null) return;
			var e = this.m_ActiveEdges;
			this.m_SortedEdges = e;
			while (e !== null) {
				e.PrevInSEL = e.PrevInAEL;
				e.NextInSEL = e.NextInAEL;
				e.Curr.X = ClipperLib.Clipper.TopX(e, topY);
				e = e.NextInAEL;
			}
			var isModified = true;
			while (isModified && this.m_SortedEdges !== null) {
				isModified = false;
				e = this.m_SortedEdges;
				while (e.NextInSEL !== null) {
					var eNext = e.NextInSEL;
					var pt = new ClipperLib.IntPoint0();
					if (e.Curr.X > eNext.Curr.X) {
						this.IntersectPoint(e, eNext, pt);
						if (pt.Y < topY) pt = new ClipperLib.IntPoint2(ClipperLib.Clipper.TopX(e, topY), topY);
						var newNode = new ClipperLib.IntersectNode();
						newNode.Edge1 = e;
						newNode.Edge2 = eNext;
						newNode.Pt.X = pt.X;
						newNode.Pt.Y = pt.Y;
						if (ClipperLib.use_xyz) newNode.Pt.Z = pt.Z;
						this.m_IntersectList.push(newNode);
						this.SwapPositionsInSEL(e, eNext);
						isModified = true;
					} else e = eNext;
				}
				if (e.PrevInSEL !== null) e.PrevInSEL.NextInSEL = null;
				else break;
			}
			this.m_SortedEdges = null;
		};
		ClipperLib.Clipper.prototype.EdgesAdjacent = function(inode) {
			return inode.Edge1.NextInSEL === inode.Edge2 || inode.Edge1.PrevInSEL === inode.Edge2;
		};
		ClipperLib.Clipper.IntersectNodeSort = function(node1, node2) {
			return node2.Pt.Y - node1.Pt.Y;
		};
		ClipperLib.Clipper.prototype.FixupIntersectionOrder = function() {
			this.m_IntersectList.sort(this.m_IntersectNodeComparer);
			this.CopyAELToSEL();
			var cnt = this.m_IntersectList.length;
			for (var i = 0; i < cnt; i++) {
				if (!this.EdgesAdjacent(this.m_IntersectList[i])) {
					var j = i + 1;
					while (j < cnt && !this.EdgesAdjacent(this.m_IntersectList[j])) j++;
					if (j === cnt) return false;
					var tmp = this.m_IntersectList[i];
					this.m_IntersectList[i] = this.m_IntersectList[j];
					this.m_IntersectList[j] = tmp;
				}
				this.SwapPositionsInSEL(this.m_IntersectList[i].Edge1, this.m_IntersectList[i].Edge2);
			}
			return true;
		};
		ClipperLib.Clipper.prototype.ProcessIntersectList = function() {
			for (var i = 0, ilen = this.m_IntersectList.length; i < ilen; i++) {
				var iNode = this.m_IntersectList[i];
				this.IntersectEdges(iNode.Edge1, iNode.Edge2, iNode.Pt);
				this.SwapPositionsInAEL(iNode.Edge1, iNode.Edge2);
			}
			this.m_IntersectList.length = 0;
		};
		var R1 = function(a) {
			return a < 0 ? Math.ceil(a - .5) : Math.round(a);
		};
		var R2 = function(a) {
			return a < 0 ? Math.ceil(a - .5) : Math.floor(a + .5);
		};
		var R3 = function(a) {
			return a < 0 ? -Math.round(Math.abs(a)) : Math.round(a);
		};
		var R4 = function(a) {
			if (a < 0) {
				a -= .5;
				return a < -2147483648 ? Math.ceil(a) : a | 0;
			} else {
				a += .5;
				return a > 2147483647 ? Math.floor(a) : a | 0;
			}
		};
		if (browser.msie) ClipperLib.Clipper.Round = R1;
		else if (browser.chromium) ClipperLib.Clipper.Round = R3;
		else if (browser.safari) ClipperLib.Clipper.Round = R4;
		else ClipperLib.Clipper.Round = R2;
		ClipperLib.Clipper.TopX = function(edge, currentY) {
			if (currentY === edge.Top.Y) return edge.Top.X;
			return edge.Bot.X + ClipperLib.Clipper.Round(edge.Dx * (currentY - edge.Bot.Y));
		};
		ClipperLib.Clipper.prototype.IntersectPoint = function(edge1, edge2, ip) {
			ip.X = 0;
			ip.Y = 0;
			var b1, b2;
			if (edge1.Dx === edge2.Dx) {
				ip.Y = edge1.Curr.Y;
				ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
				return;
			}
			if (edge1.Delta.X === 0) {
				ip.X = edge1.Bot.X;
				if (ClipperLib.ClipperBase.IsHorizontal(edge2)) ip.Y = edge2.Bot.Y;
				else {
					b2 = edge2.Bot.Y - edge2.Bot.X / edge2.Dx;
					ip.Y = ClipperLib.Clipper.Round(ip.X / edge2.Dx + b2);
				}
			} else if (edge2.Delta.X === 0) {
				ip.X = edge2.Bot.X;
				if (ClipperLib.ClipperBase.IsHorizontal(edge1)) ip.Y = edge1.Bot.Y;
				else {
					b1 = edge1.Bot.Y - edge1.Bot.X / edge1.Dx;
					ip.Y = ClipperLib.Clipper.Round(ip.X / edge1.Dx + b1);
				}
			} else {
				b1 = edge1.Bot.X - edge1.Bot.Y * edge1.Dx;
				b2 = edge2.Bot.X - edge2.Bot.Y * edge2.Dx;
				var q = (b2 - b1) / (edge1.Dx - edge2.Dx);
				ip.Y = ClipperLib.Clipper.Round(q);
				if (Math.abs(edge1.Dx) < Math.abs(edge2.Dx)) ip.X = ClipperLib.Clipper.Round(edge1.Dx * q + b1);
				else ip.X = ClipperLib.Clipper.Round(edge2.Dx * q + b2);
			}
			if (ip.Y < edge1.Top.Y || ip.Y < edge2.Top.Y) {
				if (edge1.Top.Y > edge2.Top.Y) {
					ip.Y = edge1.Top.Y;
					ip.X = ClipperLib.Clipper.TopX(edge2, edge1.Top.Y);
					return ip.X < edge1.Top.X;
				} else ip.Y = edge2.Top.Y;
				if (Math.abs(edge1.Dx) < Math.abs(edge2.Dx)) ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
				else ip.X = ClipperLib.Clipper.TopX(edge2, ip.Y);
			}
			if (ip.Y > edge1.Curr.Y) {
				ip.Y = edge1.Curr.Y;
				if (Math.abs(edge1.Dx) > Math.abs(edge2.Dx)) ip.X = ClipperLib.Clipper.TopX(edge2, ip.Y);
				else ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
			}
		};
		ClipperLib.Clipper.prototype.ProcessEdgesAtTopOfScanbeam = function(topY) {
			var e = this.m_ActiveEdges;
			while (e !== null) {
				var IsMaximaEdge = this.IsMaxima(e, topY);
				if (IsMaximaEdge) {
					var eMaxPair = this.GetMaximaPairEx(e);
					IsMaximaEdge = eMaxPair === null || !ClipperLib.ClipperBase.IsHorizontal(eMaxPair);
				}
				if (IsMaximaEdge) {
					if (this.StrictlySimple) this.InsertMaxima(e.Top.X);
					var ePrev = e.PrevInAEL;
					this.DoMaxima(e);
					if (ePrev === null) e = this.m_ActiveEdges;
					else e = ePrev.NextInAEL;
				} else {
					if (this.IsIntermediate(e, topY) && ClipperLib.ClipperBase.IsHorizontal(e.NextInLML)) {
						e = this.UpdateEdgeIntoAEL(e);
						if (e.OutIdx >= 0) this.AddOutPt(e, e.Bot);
						this.AddEdgeToSEL(e);
					} else {
						e.Curr.X = ClipperLib.Clipper.TopX(e, topY);
						e.Curr.Y = topY;
					}
					if (ClipperLib.use_xyz) if (e.Top.Y === topY) e.Curr.Z = e.Top.Z;
					else if (e.Bot.Y === topY) e.Curr.Z = e.Bot.Z;
					else e.Curr.Z = 0;
					if (this.StrictlySimple) {
						var ePrev = e.PrevInAEL;
						if (e.OutIdx >= 0 && e.WindDelta !== 0 && ePrev !== null && ePrev.OutIdx >= 0 && ePrev.Curr.X === e.Curr.X && ePrev.WindDelta !== 0) {
							var ip = new ClipperLib.IntPoint1(e.Curr);
							if (ClipperLib.use_xyz) this.SetZ(ip, ePrev, e);
							var op = this.AddOutPt(ePrev, ip);
							var op2 = this.AddOutPt(e, ip);
							this.AddJoin(op, op2, ip);
						}
					}
					e = e.NextInAEL;
				}
			}
			this.ProcessHorizontals();
			this.m_Maxima = null;
			e = this.m_ActiveEdges;
			while (e !== null) {
				if (this.IsIntermediate(e, topY)) {
					var op = null;
					if (e.OutIdx >= 0) op = this.AddOutPt(e, e.Top);
					e = this.UpdateEdgeIntoAEL(e);
					var ePrev = e.PrevInAEL;
					var eNext = e.NextInAEL;
					if (ePrev !== null && ePrev.Curr.X === e.Bot.X && ePrev.Curr.Y === e.Bot.Y && op !== null && ePrev.OutIdx >= 0 && ePrev.Curr.Y === ePrev.Top.Y && ClipperLib.ClipperBase.SlopesEqual5(e.Curr, e.Top, ePrev.Curr, ePrev.Top, this.m_UseFullRange) && e.WindDelta !== 0 && ePrev.WindDelta !== 0) {
						var op2 = this.AddOutPt(ePrev2, e.Bot);
						this.AddJoin(op, op2, e.Top);
					} else if (eNext !== null && eNext.Curr.X === e.Bot.X && eNext.Curr.Y === e.Bot.Y && op !== null && eNext.OutIdx >= 0 && eNext.Curr.Y === eNext.Top.Y && ClipperLib.ClipperBase.SlopesEqual5(e.Curr, e.Top, eNext.Curr, eNext.Top, this.m_UseFullRange) && e.WindDelta !== 0 && eNext.WindDelta !== 0) {
						var op2 = this.AddOutPt(eNext, e.Bot);
						this.AddJoin(op, op2, e.Top);
					}
				}
				e = e.NextInAEL;
			}
		};
		ClipperLib.Clipper.prototype.DoMaxima = function(e) {
			var eMaxPair = this.GetMaximaPairEx(e);
			if (eMaxPair === null) {
				if (e.OutIdx >= 0) this.AddOutPt(e, e.Top);
				this.DeleteFromAEL(e);
				return;
			}
			var eNext = e.NextInAEL;
			while (eNext !== null && eNext !== eMaxPair) {
				this.IntersectEdges(e, eNext, e.Top);
				this.SwapPositionsInAEL(e, eNext);
				eNext = e.NextInAEL;
			}
			if (e.OutIdx === -1 && eMaxPair.OutIdx === -1) {
				this.DeleteFromAEL(e);
				this.DeleteFromAEL(eMaxPair);
			} else if (e.OutIdx >= 0 && eMaxPair.OutIdx >= 0) {
				if (e.OutIdx >= 0) this.AddLocalMaxPoly(e, eMaxPair, e.Top);
				this.DeleteFromAEL(e);
				this.DeleteFromAEL(eMaxPair);
			} else if (ClipperLib.use_lines && e.WindDelta === 0) {
				if (e.OutIdx >= 0) {
					this.AddOutPt(e, e.Top);
					e.OutIdx = ClipperLib.ClipperBase.Unassigned;
				}
				this.DeleteFromAEL(e);
				if (eMaxPair.OutIdx >= 0) {
					this.AddOutPt(eMaxPair, e.Top);
					eMaxPair.OutIdx = ClipperLib.ClipperBase.Unassigned;
				}
				this.DeleteFromAEL(eMaxPair);
			} else ClipperLib.Error("DoMaxima error");
		};
		ClipperLib.Clipper.ReversePaths = function(polys) {
			for (var i = 0, len = polys.length; i < len; i++) polys[i].reverse();
		};
		ClipperLib.Clipper.Orientation = function(poly) {
			return ClipperLib.Clipper.Area(poly) >= 0;
		};
		ClipperLib.Clipper.prototype.PointCount = function(pts) {
			if (pts === null) return 0;
			var result = 0;
			var p = pts;
			do {
				result++;
				p = p.Next;
			} while (p !== pts);
			return result;
		};
		ClipperLib.Clipper.prototype.BuildResult = function(polyg) {
			ClipperLib.Clear(polyg);
			for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
				var outRec = this.m_PolyOuts[i];
				if (outRec.Pts === null) continue;
				var p = outRec.Pts.Prev;
				var cnt = this.PointCount(p);
				if (cnt < 2) continue;
				var pg = new Array(cnt);
				for (var j = 0; j < cnt; j++) {
					pg[j] = p.Pt;
					p = p.Prev;
				}
				polyg.push(pg);
			}
		};
		ClipperLib.Clipper.prototype.BuildResult2 = function(polytree) {
			polytree.Clear();
			for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
				var outRec = this.m_PolyOuts[i];
				var cnt = this.PointCount(outRec.Pts);
				if (outRec.IsOpen && cnt < 2 || !outRec.IsOpen && cnt < 3) continue;
				this.FixHoleLinkage(outRec);
				var pn = new ClipperLib.PolyNode();
				polytree.m_AllPolys.push(pn);
				outRec.PolyNode = pn;
				pn.m_polygon.length = cnt;
				var op = outRec.Pts.Prev;
				for (var j = 0; j < cnt; j++) {
					pn.m_polygon[j] = op.Pt;
					op = op.Prev;
				}
			}
			for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
				var outRec = this.m_PolyOuts[i];
				if (outRec.PolyNode === null) continue;
				else if (outRec.IsOpen) {
					outRec.PolyNode.IsOpen = true;
					polytree.AddChild(outRec.PolyNode);
				} else if (outRec.FirstLeft !== null && outRec.FirstLeft.PolyNode !== null) outRec.FirstLeft.PolyNode.AddChild(outRec.PolyNode);
				else polytree.AddChild(outRec.PolyNode);
			}
		};
		ClipperLib.Clipper.prototype.FixupOutPolyline = function(outRec) {
			var pp = outRec.Pts;
			var lastPP = pp.Prev;
			while (pp !== lastPP) {
				pp = pp.Next;
				if (ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Prev.Pt)) {
					if (pp === lastPP) lastPP = pp.Prev;
					var tmpPP = pp.Prev;
					tmpPP.Next = pp.Next;
					pp.Next.Prev = tmpPP;
					pp = tmpPP;
				}
			}
			if (pp === pp.Prev) outRec.Pts = null;
		};
		ClipperLib.Clipper.prototype.FixupOutPolygon = function(outRec) {
			var lastOK = null;
			outRec.BottomPt = null;
			var pp = outRec.Pts;
			var preserveCol = this.PreserveCollinear || this.StrictlySimple;
			for (;;) {
				if (pp.Prev === pp || pp.Prev === pp.Next) {
					outRec.Pts = null;
					return;
				}
				if (ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Next.Pt) || ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Prev.Pt) || ClipperLib.ClipperBase.SlopesEqual4(pp.Prev.Pt, pp.Pt, pp.Next.Pt, this.m_UseFullRange) && (!preserveCol || !this.Pt2IsBetweenPt1AndPt3(pp.Prev.Pt, pp.Pt, pp.Next.Pt))) {
					lastOK = null;
					pp.Prev.Next = pp.Next;
					pp.Next.Prev = pp.Prev;
					pp = pp.Prev;
				} else if (pp === lastOK) break;
				else {
					if (lastOK === null) lastOK = pp;
					pp = pp.Next;
				}
			}
			outRec.Pts = pp;
		};
		ClipperLib.Clipper.prototype.DupOutPt = function(outPt, InsertAfter) {
			var result = new ClipperLib.OutPt();
			result.Pt.X = outPt.Pt.X;
			result.Pt.Y = outPt.Pt.Y;
			if (ClipperLib.use_xyz) result.Pt.Z = outPt.Pt.Z;
			result.Idx = outPt.Idx;
			if (InsertAfter) {
				result.Next = outPt.Next;
				result.Prev = outPt;
				outPt.Next.Prev = result;
				outPt.Next = result;
			} else {
				result.Prev = outPt.Prev;
				result.Next = outPt;
				outPt.Prev.Next = result;
				outPt.Prev = result;
			}
			return result;
		};
		ClipperLib.Clipper.prototype.GetOverlap = function(a1, a2, b1, b2, $val) {
			if (a1 < a2) if (b1 < b2) {
				$val.Left = Math.max(a1, b1);
				$val.Right = Math.min(a2, b2);
			} else {
				$val.Left = Math.max(a1, b2);
				$val.Right = Math.min(a2, b1);
			}
			else if (b1 < b2) {
				$val.Left = Math.max(a2, b1);
				$val.Right = Math.min(a1, b2);
			} else {
				$val.Left = Math.max(a2, b2);
				$val.Right = Math.min(a1, b1);
			}
			return $val.Left < $val.Right;
		};
		ClipperLib.Clipper.prototype.JoinHorz = function(op1, op1b, op2, op2b, Pt, DiscardLeft) {
			var Dir1 = op1.Pt.X > op1b.Pt.X ? ClipperLib.Direction.dRightToLeft : ClipperLib.Direction.dLeftToRight;
			var Dir2 = op2.Pt.X > op2b.Pt.X ? ClipperLib.Direction.dRightToLeft : ClipperLib.Direction.dLeftToRight;
			if (Dir1 === Dir2) return false;
			if (Dir1 === ClipperLib.Direction.dLeftToRight) {
				while (op1.Next.Pt.X <= Pt.X && op1.Next.Pt.X >= op1.Pt.X && op1.Next.Pt.Y === Pt.Y) op1 = op1.Next;
				if (DiscardLeft && op1.Pt.X !== Pt.X) op1 = op1.Next;
				op1b = this.DupOutPt(op1, !DiscardLeft);
				if (ClipperLib.IntPoint.op_Inequality(op1b.Pt, Pt)) {
					op1 = op1b;
					op1.Pt.X = Pt.X;
					op1.Pt.Y = Pt.Y;
					if (ClipperLib.use_xyz) op1.Pt.Z = Pt.Z;
					op1b = this.DupOutPt(op1, !DiscardLeft);
				}
			} else {
				while (op1.Next.Pt.X >= Pt.X && op1.Next.Pt.X <= op1.Pt.X && op1.Next.Pt.Y === Pt.Y) op1 = op1.Next;
				if (!DiscardLeft && op1.Pt.X !== Pt.X) op1 = op1.Next;
				op1b = this.DupOutPt(op1, DiscardLeft);
				if (ClipperLib.IntPoint.op_Inequality(op1b.Pt, Pt)) {
					op1 = op1b;
					op1.Pt.X = Pt.X;
					op1.Pt.Y = Pt.Y;
					if (ClipperLib.use_xyz) op1.Pt.Z = Pt.Z;
					op1b = this.DupOutPt(op1, DiscardLeft);
				}
			}
			if (Dir2 === ClipperLib.Direction.dLeftToRight) {
				while (op2.Next.Pt.X <= Pt.X && op2.Next.Pt.X >= op2.Pt.X && op2.Next.Pt.Y === Pt.Y) op2 = op2.Next;
				if (DiscardLeft && op2.Pt.X !== Pt.X) op2 = op2.Next;
				op2b = this.DupOutPt(op2, !DiscardLeft);
				if (ClipperLib.IntPoint.op_Inequality(op2b.Pt, Pt)) {
					op2 = op2b;
					op2.Pt.X = Pt.X;
					op2.Pt.Y = Pt.Y;
					if (ClipperLib.use_xyz) op2.Pt.Z = Pt.Z;
					op2b = this.DupOutPt(op2, !DiscardLeft);
				}
			} else {
				while (op2.Next.Pt.X >= Pt.X && op2.Next.Pt.X <= op2.Pt.X && op2.Next.Pt.Y === Pt.Y) op2 = op2.Next;
				if (!DiscardLeft && op2.Pt.X !== Pt.X) op2 = op2.Next;
				op2b = this.DupOutPt(op2, DiscardLeft);
				if (ClipperLib.IntPoint.op_Inequality(op2b.Pt, Pt)) {
					op2 = op2b;
					op2.Pt.X = Pt.X;
					op2.Pt.Y = Pt.Y;
					if (ClipperLib.use_xyz) op2.Pt.Z = Pt.Z;
					op2b = this.DupOutPt(op2, DiscardLeft);
				}
			}
			if (Dir1 === ClipperLib.Direction.dLeftToRight === DiscardLeft) {
				op1.Prev = op2;
				op2.Next = op1;
				op1b.Next = op2b;
				op2b.Prev = op1b;
			} else {
				op1.Next = op2;
				op2.Prev = op1;
				op1b.Prev = op2b;
				op2b.Next = op1b;
			}
			return true;
		};
		ClipperLib.Clipper.prototype.JoinPoints = function(j, outRec1, outRec2) {
			var op1 = j.OutPt1, op1b = new ClipperLib.OutPt();
			var op2 = j.OutPt2, op2b = new ClipperLib.OutPt();
			var isHorizontal = j.OutPt1.Pt.Y === j.OffPt.Y;
			if (isHorizontal && ClipperLib.IntPoint.op_Equality(j.OffPt, j.OutPt1.Pt) && ClipperLib.IntPoint.op_Equality(j.OffPt, j.OutPt2.Pt)) {
				if (outRec1 !== outRec2) return false;
				op1b = j.OutPt1.Next;
				while (op1b !== op1 && ClipperLib.IntPoint.op_Equality(op1b.Pt, j.OffPt)) op1b = op1b.Next;
				var reverse1 = op1b.Pt.Y > j.OffPt.Y;
				op2b = j.OutPt2.Next;
				while (op2b !== op2 && ClipperLib.IntPoint.op_Equality(op2b.Pt, j.OffPt)) op2b = op2b.Next;
				if (reverse1 === op2b.Pt.Y > j.OffPt.Y) return false;
				if (reverse1) {
					op1b = this.DupOutPt(op1, false);
					op2b = this.DupOutPt(op2, true);
					op1.Prev = op2;
					op2.Next = op1;
					op1b.Next = op2b;
					op2b.Prev = op1b;
					j.OutPt1 = op1;
					j.OutPt2 = op1b;
					return true;
				} else {
					op1b = this.DupOutPt(op1, true);
					op2b = this.DupOutPt(op2, false);
					op1.Next = op2;
					op2.Prev = op1;
					op1b.Prev = op2b;
					op2b.Next = op1b;
					j.OutPt1 = op1;
					j.OutPt2 = op1b;
					return true;
				}
			} else if (isHorizontal) {
				op1b = op1;
				while (op1.Prev.Pt.Y === op1.Pt.Y && op1.Prev !== op1b && op1.Prev !== op2) op1 = op1.Prev;
				while (op1b.Next.Pt.Y === op1b.Pt.Y && op1b.Next !== op1 && op1b.Next !== op2) op1b = op1b.Next;
				if (op1b.Next === op1 || op1b.Next === op2) return false;
				op2b = op2;
				while (op2.Prev.Pt.Y === op2.Pt.Y && op2.Prev !== op2b && op2.Prev !== op1b) op2 = op2.Prev;
				while (op2b.Next.Pt.Y === op2b.Pt.Y && op2b.Next !== op2 && op2b.Next !== op1) op2b = op2b.Next;
				if (op2b.Next === op2 || op2b.Next === op1) return false;
				var $val = {
					Left: null,
					Right: null
				};
				if (!this.GetOverlap(op1.Pt.X, op1b.Pt.X, op2.Pt.X, op2b.Pt.X, $val)) return false;
				var Left = $val.Left;
				var Right = $val.Right;
				var Pt = new ClipperLib.IntPoint0();
				var DiscardLeftSide;
				if (op1.Pt.X >= Left && op1.Pt.X <= Right) {
					Pt.X = op1.Pt.X;
					Pt.Y = op1.Pt.Y;
					if (ClipperLib.use_xyz) Pt.Z = op1.Pt.Z;
					DiscardLeftSide = op1.Pt.X > op1b.Pt.X;
				} else if (op2.Pt.X >= Left && op2.Pt.X <= Right) {
					Pt.X = op2.Pt.X;
					Pt.Y = op2.Pt.Y;
					if (ClipperLib.use_xyz) Pt.Z = op2.Pt.Z;
					DiscardLeftSide = op2.Pt.X > op2b.Pt.X;
				} else if (op1b.Pt.X >= Left && op1b.Pt.X <= Right) {
					Pt.X = op1b.Pt.X;
					Pt.Y = op1b.Pt.Y;
					if (ClipperLib.use_xyz) Pt.Z = op1b.Pt.Z;
					DiscardLeftSide = op1b.Pt.X > op1.Pt.X;
				} else {
					Pt.X = op2b.Pt.X;
					Pt.Y = op2b.Pt.Y;
					if (ClipperLib.use_xyz) Pt.Z = op2b.Pt.Z;
					DiscardLeftSide = op2b.Pt.X > op2.Pt.X;
				}
				j.OutPt1 = op1;
				j.OutPt2 = op2;
				return this.JoinHorz(op1, op1b, op2, op2b, Pt, DiscardLeftSide);
			} else {
				op1b = op1.Next;
				while (ClipperLib.IntPoint.op_Equality(op1b.Pt, op1.Pt) && op1b !== op1) op1b = op1b.Next;
				var Reverse1 = op1b.Pt.Y > op1.Pt.Y || !ClipperLib.ClipperBase.SlopesEqual4(op1.Pt, op1b.Pt, j.OffPt, this.m_UseFullRange);
				if (Reverse1) {
					op1b = op1.Prev;
					while (ClipperLib.IntPoint.op_Equality(op1b.Pt, op1.Pt) && op1b !== op1) op1b = op1b.Prev;
					if (op1b.Pt.Y > op1.Pt.Y || !ClipperLib.ClipperBase.SlopesEqual4(op1.Pt, op1b.Pt, j.OffPt, this.m_UseFullRange)) return false;
				}
				op2b = op2.Next;
				while (ClipperLib.IntPoint.op_Equality(op2b.Pt, op2.Pt) && op2b !== op2) op2b = op2b.Next;
				var Reverse2 = op2b.Pt.Y > op2.Pt.Y || !ClipperLib.ClipperBase.SlopesEqual4(op2.Pt, op2b.Pt, j.OffPt, this.m_UseFullRange);
				if (Reverse2) {
					op2b = op2.Prev;
					while (ClipperLib.IntPoint.op_Equality(op2b.Pt, op2.Pt) && op2b !== op2) op2b = op2b.Prev;
					if (op2b.Pt.Y > op2.Pt.Y || !ClipperLib.ClipperBase.SlopesEqual4(op2.Pt, op2b.Pt, j.OffPt, this.m_UseFullRange)) return false;
				}
				if (op1b === op1 || op2b === op2 || op1b === op2b || outRec1 === outRec2 && Reverse1 === Reverse2) return false;
				if (Reverse1) {
					op1b = this.DupOutPt(op1, false);
					op2b = this.DupOutPt(op2, true);
					op1.Prev = op2;
					op2.Next = op1;
					op1b.Next = op2b;
					op2b.Prev = op1b;
					j.OutPt1 = op1;
					j.OutPt2 = op1b;
					return true;
				} else {
					op1b = this.DupOutPt(op1, true);
					op2b = this.DupOutPt(op2, false);
					op1.Next = op2;
					op2.Prev = op1;
					op1b.Prev = op2b;
					op2b.Next = op1b;
					j.OutPt1 = op1;
					j.OutPt2 = op1b;
					return true;
				}
			}
		};
		ClipperLib.Clipper.GetBounds = function(paths) {
			var i = 0, cnt = paths.length;
			while (i < cnt && paths[i].length === 0) i++;
			if (i === cnt) return new ClipperLib.IntRect(0, 0, 0, 0);
			var result = new ClipperLib.IntRect();
			result.left = paths[i][0].X;
			result.right = result.left;
			result.top = paths[i][0].Y;
			result.bottom = result.top;
			for (; i < cnt; i++) for (var j = 0, jlen = paths[i].length; j < jlen; j++) {
				if (paths[i][j].X < result.left) result.left = paths[i][j].X;
				else if (paths[i][j].X > result.right) result.right = paths[i][j].X;
				if (paths[i][j].Y < result.top) result.top = paths[i][j].Y;
				else if (paths[i][j].Y > result.bottom) result.bottom = paths[i][j].Y;
			}
			return result;
		};
		ClipperLib.Clipper.prototype.GetBounds2 = function(ops) {
			var opStart = ops;
			var result = new ClipperLib.IntRect();
			result.left = ops.Pt.X;
			result.right = ops.Pt.X;
			result.top = ops.Pt.Y;
			result.bottom = ops.Pt.Y;
			ops = ops.Next;
			while (ops !== opStart) {
				if (ops.Pt.X < result.left) result.left = ops.Pt.X;
				if (ops.Pt.X > result.right) result.right = ops.Pt.X;
				if (ops.Pt.Y < result.top) result.top = ops.Pt.Y;
				if (ops.Pt.Y > result.bottom) result.bottom = ops.Pt.Y;
				ops = ops.Next;
			}
			return result;
		};
		ClipperLib.Clipper.PointInPolygon = function(pt, path) {
			var result = 0, cnt = path.length;
			if (cnt < 3) return 0;
			var ip = path[0];
			for (var i = 1; i <= cnt; ++i) {
				var ipNext = i === cnt ? path[0] : path[i];
				if (ipNext.Y === pt.Y) {
					if (ipNext.X === pt.X || ip.Y === pt.Y && ipNext.X > pt.X === ip.X < pt.X) return -1;
				}
				if (ip.Y < pt.Y !== ipNext.Y < pt.Y) {
					if (ip.X >= pt.X) if (ipNext.X > pt.X) result = 1 - result;
					else {
						var d = (ip.X - pt.X) * (ipNext.Y - pt.Y) - (ipNext.X - pt.X) * (ip.Y - pt.Y);
						if (d === 0) return -1;
						else if (d > 0 === ipNext.Y > ip.Y) result = 1 - result;
					}
					else if (ipNext.X > pt.X) {
						var d = (ip.X - pt.X) * (ipNext.Y - pt.Y) - (ipNext.X - pt.X) * (ip.Y - pt.Y);
						if (d === 0) return -1;
						else if (d > 0 === ipNext.Y > ip.Y) result = 1 - result;
					}
				}
				ip = ipNext;
			}
			return result;
		};
		ClipperLib.Clipper.prototype.PointInPolygon = function(pt, op) {
			var result = 0;
			var startOp = op;
			var ptx = pt.X, pty = pt.Y;
			var poly0x = op.Pt.X, poly0y = op.Pt.Y;
			do {
				op = op.Next;
				var poly1x = op.Pt.X, poly1y = op.Pt.Y;
				if (poly1y === pty) {
					if (poly1x === ptx || poly0y === pty && poly1x > ptx === poly0x < ptx) return -1;
				}
				if (poly0y < pty !== poly1y < pty) {
					if (poly0x >= ptx) if (poly1x > ptx) result = 1 - result;
					else {
						var d = (poly0x - ptx) * (poly1y - pty) - (poly1x - ptx) * (poly0y - pty);
						if (d === 0) return -1;
						if (d > 0 === poly1y > poly0y) result = 1 - result;
					}
					else if (poly1x > ptx) {
						var d = (poly0x - ptx) * (poly1y - pty) - (poly1x - ptx) * (poly0y - pty);
						if (d === 0) return -1;
						if (d > 0 === poly1y > poly0y) result = 1 - result;
					}
				}
				poly0x = poly1x;
				poly0y = poly1y;
			} while (startOp !== op);
			return result;
		};
		ClipperLib.Clipper.prototype.Poly2ContainsPoly1 = function(outPt1, outPt2) {
			var op = outPt1;
			do {
				var res = this.PointInPolygon(op.Pt, outPt2);
				if (res >= 0) return res > 0;
				op = op.Next;
			} while (op !== outPt1);
			return true;
		};
		ClipperLib.Clipper.prototype.FixupFirstLefts1 = function(OldOutRec, NewOutRec) {
			var outRec, firstLeft;
			for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
				outRec = this.m_PolyOuts[i];
				firstLeft = ClipperLib.Clipper.ParseFirstLeft(outRec.FirstLeft);
				if (outRec.Pts !== null && firstLeft === OldOutRec) {
					if (this.Poly2ContainsPoly1(outRec.Pts, NewOutRec.Pts)) outRec.FirstLeft = NewOutRec;
				}
			}
		};
		ClipperLib.Clipper.prototype.FixupFirstLefts2 = function(innerOutRec, outerOutRec) {
			var orfl = outerOutRec.FirstLeft;
			var outRec, firstLeft;
			for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
				outRec = this.m_PolyOuts[i];
				if (outRec.Pts === null || outRec === outerOutRec || outRec === innerOutRec) continue;
				firstLeft = ClipperLib.Clipper.ParseFirstLeft(outRec.FirstLeft);
				if (firstLeft !== orfl && firstLeft !== innerOutRec && firstLeft !== outerOutRec) continue;
				if (this.Poly2ContainsPoly1(outRec.Pts, innerOutRec.Pts)) outRec.FirstLeft = innerOutRec;
				else if (this.Poly2ContainsPoly1(outRec.Pts, outerOutRec.Pts)) outRec.FirstLeft = outerOutRec;
				else if (outRec.FirstLeft === innerOutRec || outRec.FirstLeft === outerOutRec) outRec.FirstLeft = orfl;
			}
		};
		ClipperLib.Clipper.prototype.FixupFirstLefts3 = function(OldOutRec, NewOutRec) {
			var outRec;
			var firstLeft;
			for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
				outRec = this.m_PolyOuts[i];
				firstLeft = ClipperLib.Clipper.ParseFirstLeft(outRec.FirstLeft);
				if (outRec.Pts !== null && firstLeft === OldOutRec) outRec.FirstLeft = NewOutRec;
			}
		};
		ClipperLib.Clipper.ParseFirstLeft = function(FirstLeft) {
			while (FirstLeft !== null && FirstLeft.Pts === null) FirstLeft = FirstLeft.FirstLeft;
			return FirstLeft;
		};
		ClipperLib.Clipper.prototype.JoinCommonEdges = function() {
			for (var i = 0, ilen = this.m_Joins.length; i < ilen; i++) {
				var join = this.m_Joins[i];
				var outRec1 = this.GetOutRec(join.OutPt1.Idx);
				var outRec2 = this.GetOutRec(join.OutPt2.Idx);
				if (outRec1.Pts === null || outRec2.Pts === null) continue;
				if (outRec1.IsOpen || outRec2.IsOpen) continue;
				var holeStateRec;
				if (outRec1 === outRec2) holeStateRec = outRec1;
				else if (this.OutRec1RightOfOutRec2(outRec1, outRec2)) holeStateRec = outRec2;
				else if (this.OutRec1RightOfOutRec2(outRec2, outRec1)) holeStateRec = outRec1;
				else holeStateRec = this.GetLowermostRec(outRec1, outRec2);
				if (!this.JoinPoints(join, outRec1, outRec2)) continue;
				if (outRec1 === outRec2) {
					outRec1.Pts = join.OutPt1;
					outRec1.BottomPt = null;
					outRec2 = this.CreateOutRec();
					outRec2.Pts = join.OutPt2;
					this.UpdateOutPtIdxs(outRec2);
					if (this.Poly2ContainsPoly1(outRec2.Pts, outRec1.Pts)) {
						outRec2.IsHole = !outRec1.IsHole;
						outRec2.FirstLeft = outRec1;
						if (this.m_UsingPolyTree) this.FixupFirstLefts2(outRec2, outRec1);
						if ((outRec2.IsHole ^ this.ReverseSolution) == this.Area$1(outRec2) > 0) this.ReversePolyPtLinks(outRec2.Pts);
					} else if (this.Poly2ContainsPoly1(outRec1.Pts, outRec2.Pts)) {
						outRec2.IsHole = outRec1.IsHole;
						outRec1.IsHole = !outRec2.IsHole;
						outRec2.FirstLeft = outRec1.FirstLeft;
						outRec1.FirstLeft = outRec2;
						if (this.m_UsingPolyTree) this.FixupFirstLefts2(outRec1, outRec2);
						if ((outRec1.IsHole ^ this.ReverseSolution) == this.Area$1(outRec1) > 0) this.ReversePolyPtLinks(outRec1.Pts);
					} else {
						outRec2.IsHole = outRec1.IsHole;
						outRec2.FirstLeft = outRec1.FirstLeft;
						if (this.m_UsingPolyTree) this.FixupFirstLefts1(outRec1, outRec2);
					}
				} else {
					outRec2.Pts = null;
					outRec2.BottomPt = null;
					outRec2.Idx = outRec1.Idx;
					outRec1.IsHole = holeStateRec.IsHole;
					if (holeStateRec === outRec2) outRec1.FirstLeft = outRec2.FirstLeft;
					outRec2.FirstLeft = outRec1;
					if (this.m_UsingPolyTree) this.FixupFirstLefts3(outRec2, outRec1);
				}
			}
		};
		ClipperLib.Clipper.prototype.UpdateOutPtIdxs = function(outrec) {
			var op = outrec.Pts;
			do {
				op.Idx = outrec.Idx;
				op = op.Prev;
			} while (op !== outrec.Pts);
		};
		ClipperLib.Clipper.prototype.DoSimplePolygons = function() {
			var i = 0;
			while (i < this.m_PolyOuts.length) {
				var outrec = this.m_PolyOuts[i++];
				var op = outrec.Pts;
				if (op === null || outrec.IsOpen) continue;
				do {
					var op2 = op.Next;
					while (op2 !== outrec.Pts) {
						if (ClipperLib.IntPoint.op_Equality(op.Pt, op2.Pt) && op2.Next !== op && op2.Prev !== op) {
							var op3 = op.Prev;
							var op4 = op2.Prev;
							op.Prev = op4;
							op4.Next = op;
							op2.Prev = op3;
							op3.Next = op2;
							outrec.Pts = op;
							var outrec2 = this.CreateOutRec();
							outrec2.Pts = op2;
							this.UpdateOutPtIdxs(outrec2);
							if (this.Poly2ContainsPoly1(outrec2.Pts, outrec.Pts)) {
								outrec2.IsHole = !outrec.IsHole;
								outrec2.FirstLeft = outrec;
								if (this.m_UsingPolyTree) this.FixupFirstLefts2(outrec2, outrec);
							} else if (this.Poly2ContainsPoly1(outrec.Pts, outrec2.Pts)) {
								outrec2.IsHole = outrec.IsHole;
								outrec.IsHole = !outrec2.IsHole;
								outrec2.FirstLeft = outrec.FirstLeft;
								outrec.FirstLeft = outrec2;
								if (this.m_UsingPolyTree) this.FixupFirstLefts2(outrec, outrec2);
							} else {
								outrec2.IsHole = outrec.IsHole;
								outrec2.FirstLeft = outrec.FirstLeft;
								if (this.m_UsingPolyTree) this.FixupFirstLefts1(outrec, outrec2);
							}
							op2 = op;
						}
						op2 = op2.Next;
					}
					op = op.Next;
				} while (op !== outrec.Pts);
			}
		};
		ClipperLib.Clipper.Area = function(poly) {
			if (!Array.isArray(poly)) return 0;
			var cnt = poly.length;
			if (cnt < 3) return 0;
			var a = 0;
			for (var i = 0, j = cnt - 1; i < cnt; ++i) {
				a += (poly[j].X + poly[i].X) * (poly[j].Y - poly[i].Y);
				j = i;
			}
			return -a * .5;
		};
		ClipperLib.Clipper.prototype.Area = function(op) {
			var opFirst = op;
			if (op === null) return 0;
			var a = 0;
			do {
				a = a + (op.Prev.Pt.X + op.Pt.X) * (op.Prev.Pt.Y - op.Pt.Y);
				op = op.Next;
			} while (op !== opFirst);
			return a * .5;
		};
		ClipperLib.Clipper.prototype.Area$1 = function(outRec) {
			return this.Area(outRec.Pts);
		};
		ClipperLib.Clipper.SimplifyPolygon = function(poly, fillType) {
			var result = new Array();
			var c = new ClipperLib.Clipper(0);
			c.StrictlySimple = true;
			c.AddPath(poly, ClipperLib.PolyType.ptSubject, true);
			c.Execute(ClipperLib.ClipType.ctUnion, result, fillType, fillType);
			return result;
		};
		ClipperLib.Clipper.SimplifyPolygons = function(polys, fillType) {
			if (typeof fillType === "undefined") fillType = ClipperLib.PolyFillType.pftEvenOdd;
			var result = new Array();
			var c = new ClipperLib.Clipper(0);
			c.StrictlySimple = true;
			c.AddPaths(polys, ClipperLib.PolyType.ptSubject, true);
			c.Execute(ClipperLib.ClipType.ctUnion, result, fillType, fillType);
			return result;
		};
		ClipperLib.Clipper.DistanceSqrd = function(pt1, pt2) {
			var dx = pt1.X - pt2.X;
			var dy = pt1.Y - pt2.Y;
			return dx * dx + dy * dy;
		};
		ClipperLib.Clipper.DistanceFromLineSqrd = function(pt, ln1, ln2) {
			var A = ln1.Y - ln2.Y;
			var B = ln2.X - ln1.X;
			var C = A * ln1.X + B * ln1.Y;
			C = A * pt.X + B * pt.Y - C;
			return C * C / (A * A + B * B);
		};
		ClipperLib.Clipper.SlopesNearCollinear = function(pt1, pt2, pt3, distSqrd) {
			if (Math.abs(pt1.X - pt2.X) > Math.abs(pt1.Y - pt2.Y)) if (pt1.X > pt2.X === pt1.X < pt3.X) return ClipperLib.Clipper.DistanceFromLineSqrd(pt1, pt2, pt3) < distSqrd;
			else if (pt2.X > pt1.X === pt2.X < pt3.X) return ClipperLib.Clipper.DistanceFromLineSqrd(pt2, pt1, pt3) < distSqrd;
			else return ClipperLib.Clipper.DistanceFromLineSqrd(pt3, pt1, pt2) < distSqrd;
			else if (pt1.Y > pt2.Y === pt1.Y < pt3.Y) return ClipperLib.Clipper.DistanceFromLineSqrd(pt1, pt2, pt3) < distSqrd;
			else if (pt2.Y > pt1.Y === pt2.Y < pt3.Y) return ClipperLib.Clipper.DistanceFromLineSqrd(pt2, pt1, pt3) < distSqrd;
			else return ClipperLib.Clipper.DistanceFromLineSqrd(pt3, pt1, pt2) < distSqrd;
		};
		ClipperLib.Clipper.PointsAreClose = function(pt1, pt2, distSqrd) {
			var dx = pt1.X - pt2.X;
			var dy = pt1.Y - pt2.Y;
			return dx * dx + dy * dy <= distSqrd;
		};
		ClipperLib.Clipper.ExcludeOp = function(op) {
			var result = op.Prev;
			result.Next = op.Next;
			op.Next.Prev = result;
			result.Idx = 0;
			return result;
		};
		ClipperLib.Clipper.CleanPolygon = function(path, distance) {
			if (typeof distance === "undefined") distance = 1.415;
			var cnt = path.length;
			if (cnt === 0) return new Array();
			var outPts = new Array(cnt);
			for (var i = 0; i < cnt; ++i) outPts[i] = new ClipperLib.OutPt();
			for (var i = 0; i < cnt; ++i) {
				outPts[i].Pt = path[i];
				outPts[i].Next = outPts[(i + 1) % cnt];
				outPts[i].Next.Prev = outPts[i];
				outPts[i].Idx = 0;
			}
			var distSqrd = distance * distance;
			var op = outPts[0];
			while (op.Idx === 0 && op.Next !== op.Prev) if (ClipperLib.Clipper.PointsAreClose(op.Pt, op.Prev.Pt, distSqrd)) {
				op = ClipperLib.Clipper.ExcludeOp(op);
				cnt--;
			} else if (ClipperLib.Clipper.PointsAreClose(op.Prev.Pt, op.Next.Pt, distSqrd)) {
				ClipperLib.Clipper.ExcludeOp(op.Next);
				op = ClipperLib.Clipper.ExcludeOp(op);
				cnt -= 2;
			} else if (ClipperLib.Clipper.SlopesNearCollinear(op.Prev.Pt, op.Pt, op.Next.Pt, distSqrd)) {
				op = ClipperLib.Clipper.ExcludeOp(op);
				cnt--;
			} else {
				op.Idx = 1;
				op = op.Next;
			}
			if (cnt < 3) cnt = 0;
			var result = new Array(cnt);
			for (var i = 0; i < cnt; ++i) {
				result[i] = new ClipperLib.IntPoint1(op.Pt);
				op = op.Next;
			}
			outPts = null;
			return result;
		};
		ClipperLib.Clipper.CleanPolygons = function(polys, distance) {
			var result = new Array(polys.length);
			for (var i = 0, ilen = polys.length; i < ilen; i++) result[i] = ClipperLib.Clipper.CleanPolygon(polys[i], distance);
			return result;
		};
		ClipperLib.Clipper.Minkowski = function(pattern, path, IsSum, IsClosed) {
			var delta = IsClosed ? 1 : 0;
			var polyCnt = pattern.length;
			var pathCnt = path.length;
			var result = new Array();
			if (IsSum) for (var i = 0; i < pathCnt; i++) {
				var p = new Array(polyCnt);
				for (var j = 0, jlen = pattern.length, ip = pattern[j]; j < jlen; j++, ip = pattern[j]) p[j] = new ClipperLib.IntPoint2(path[i].X + ip.X, path[i].Y + ip.Y);
				result.push(p);
			}
			else for (var i = 0; i < pathCnt; i++) {
				var p = new Array(polyCnt);
				for (var j = 0, jlen = pattern.length, ip = pattern[j]; j < jlen; j++, ip = pattern[j]) p[j] = new ClipperLib.IntPoint2(path[i].X - ip.X, path[i].Y - ip.Y);
				result.push(p);
			}
			var quads = new Array();
			for (var i = 0; i < pathCnt - 1 + delta; i++) for (var j = 0; j < polyCnt; j++) {
				var quad = new Array();
				quad.push(result[i % pathCnt][j % polyCnt]);
				quad.push(result[(i + 1) % pathCnt][j % polyCnt]);
				quad.push(result[(i + 1) % pathCnt][(j + 1) % polyCnt]);
				quad.push(result[i % pathCnt][(j + 1) % polyCnt]);
				if (!ClipperLib.Clipper.Orientation(quad)) quad.reverse();
				quads.push(quad);
			}
			return quads;
		};
		ClipperLib.Clipper.MinkowskiSum = function(pattern, path_or_paths, pathIsClosed) {
			if (!(path_or_paths[0] instanceof Array)) {
				var path = path_or_paths;
				var paths = ClipperLib.Clipper.Minkowski(pattern, path, true, pathIsClosed);
				var c = new ClipperLib.Clipper();
				c.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
				c.Execute(ClipperLib.ClipType.ctUnion, paths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
				return paths;
			} else {
				var paths = path_or_paths;
				var solution = new ClipperLib.Paths();
				var c = new ClipperLib.Clipper();
				for (var i = 0; i < paths.length; ++i) {
					var tmp = ClipperLib.Clipper.Minkowski(pattern, paths[i], true, pathIsClosed);
					c.AddPaths(tmp, ClipperLib.PolyType.ptSubject, true);
					if (pathIsClosed) {
						var path = ClipperLib.Clipper.TranslatePath(paths[i], pattern[0]);
						c.AddPath(path, ClipperLib.PolyType.ptClip, true);
					}
				}
				c.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
				return solution;
			}
		};
		ClipperLib.Clipper.TranslatePath = function(path, delta) {
			var outPath = new ClipperLib.Path();
			for (var i = 0; i < path.length; i++) outPath.push(new ClipperLib.IntPoint2(path[i].X + delta.X, path[i].Y + delta.Y));
			return outPath;
		};
		ClipperLib.Clipper.MinkowskiDiff = function(poly1, poly2) {
			var paths = ClipperLib.Clipper.Minkowski(poly1, poly2, false, true);
			var c = new ClipperLib.Clipper();
			c.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
			c.Execute(ClipperLib.ClipType.ctUnion, paths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
			return paths;
		};
		ClipperLib.Clipper.PolyTreeToPaths = function(polytree) {
			var result = new Array();
			ClipperLib.Clipper.AddPolyNodeToPaths(polytree, ClipperLib.Clipper.NodeType.ntAny, result);
			return result;
		};
		ClipperLib.Clipper.AddPolyNodeToPaths = function(polynode, nt, paths) {
			var match = true;
			switch (nt) {
				case ClipperLib.Clipper.NodeType.ntOpen: return;
				case ClipperLib.Clipper.NodeType.ntClosed:
					match = !polynode.IsOpen;
					break;
				default: break;
			}
			if (polynode.m_polygon.length > 0 && match) paths.push(polynode.m_polygon);
			for (var $i3 = 0, $t3 = polynode.Childs(), $l3 = $t3.length, pn = $t3[$i3]; $i3 < $l3; $i3++, pn = $t3[$i3]) ClipperLib.Clipper.AddPolyNodeToPaths(pn, nt, paths);
		};
		ClipperLib.Clipper.OpenPathsFromPolyTree = function(polytree) {
			var result = new ClipperLib.Paths();
			for (var i = 0, ilen = polytree.ChildCount(); i < ilen; i++) if (polytree.Childs()[i].IsOpen) result.push(polytree.Childs()[i].m_polygon);
			return result;
		};
		ClipperLib.Clipper.ClosedPathsFromPolyTree = function(polytree) {
			var result = new ClipperLib.Paths();
			ClipperLib.Clipper.AddPolyNodeToPaths(polytree, ClipperLib.Clipper.NodeType.ntClosed, result);
			return result;
		};
		Inherit(ClipperLib.Clipper, ClipperLib.ClipperBase);
		ClipperLib.Clipper.NodeType = {
			ntAny: 0,
			ntOpen: 1,
			ntClosed: 2
		};
		/**
		* @constructor
		*/
		ClipperLib.ClipperOffset = function(miterLimit, arcTolerance) {
			if (typeof miterLimit === "undefined") miterLimit = 2;
			if (typeof arcTolerance === "undefined") arcTolerance = ClipperLib.ClipperOffset.def_arc_tolerance;
			this.m_destPolys = new ClipperLib.Paths();
			this.m_srcPoly = new ClipperLib.Path();
			this.m_destPoly = new ClipperLib.Path();
			this.m_normals = new Array();
			this.m_delta = 0;
			this.m_sinA = 0;
			this.m_sin = 0;
			this.m_cos = 0;
			this.m_miterLim = 0;
			this.m_StepsPerRad = 0;
			this.m_lowest = new ClipperLib.IntPoint0();
			this.m_polyNodes = new ClipperLib.PolyNode();
			this.MiterLimit = miterLimit;
			this.ArcTolerance = arcTolerance;
			this.m_lowest.X = -1;
		};
		ClipperLib.ClipperOffset.two_pi = 6.28318530717959;
		ClipperLib.ClipperOffset.def_arc_tolerance = .25;
		ClipperLib.ClipperOffset.prototype.Clear = function() {
			ClipperLib.Clear(this.m_polyNodes.Childs());
			this.m_lowest.X = -1;
		};
		ClipperLib.ClipperOffset.Round = ClipperLib.Clipper.Round;
		ClipperLib.ClipperOffset.prototype.AddPath = function(path, joinType, endType) {
			var highI = path.length - 1;
			if (highI < 0) return;
			var newNode = new ClipperLib.PolyNode();
			newNode.m_jointype = joinType;
			newNode.m_endtype = endType;
			if (endType === ClipperLib.EndType.etClosedLine || endType === ClipperLib.EndType.etClosedPolygon) while (highI > 0 && ClipperLib.IntPoint.op_Equality(path[0], path[highI])) highI--;
			newNode.m_polygon.push(path[0]);
			var j = 0, k = 0;
			for (var i = 1; i <= highI; i++) if (ClipperLib.IntPoint.op_Inequality(newNode.m_polygon[j], path[i])) {
				j++;
				newNode.m_polygon.push(path[i]);
				if (path[i].Y > newNode.m_polygon[k].Y || path[i].Y === newNode.m_polygon[k].Y && path[i].X < newNode.m_polygon[k].X) k = j;
			}
			if (endType === ClipperLib.EndType.etClosedPolygon && j < 2) return;
			this.m_polyNodes.AddChild(newNode);
			if (endType !== ClipperLib.EndType.etClosedPolygon) return;
			if (this.m_lowest.X < 0) this.m_lowest = new ClipperLib.IntPoint2(this.m_polyNodes.ChildCount() - 1, k);
			else {
				var ip = this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon[this.m_lowest.Y];
				if (newNode.m_polygon[k].Y > ip.Y || newNode.m_polygon[k].Y === ip.Y && newNode.m_polygon[k].X < ip.X) this.m_lowest = new ClipperLib.IntPoint2(this.m_polyNodes.ChildCount() - 1, k);
			}
		};
		ClipperLib.ClipperOffset.prototype.AddPaths = function(paths, joinType, endType) {
			for (var i = 0, ilen = paths.length; i < ilen; i++) this.AddPath(paths[i], joinType, endType);
		};
		ClipperLib.ClipperOffset.prototype.FixOrientations = function() {
			if (this.m_lowest.X >= 0 && !ClipperLib.Clipper.Orientation(this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon)) for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
				var node = this.m_polyNodes.Childs()[i];
				if (node.m_endtype === ClipperLib.EndType.etClosedPolygon || node.m_endtype === ClipperLib.EndType.etClosedLine && ClipperLib.Clipper.Orientation(node.m_polygon)) node.m_polygon.reverse();
			}
			else for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
				var node = this.m_polyNodes.Childs()[i];
				if (node.m_endtype === ClipperLib.EndType.etClosedLine && !ClipperLib.Clipper.Orientation(node.m_polygon)) node.m_polygon.reverse();
			}
		};
		ClipperLib.ClipperOffset.GetUnitNormal = function(pt1, pt2) {
			var dx = pt2.X - pt1.X;
			var dy = pt2.Y - pt1.Y;
			if (dx === 0 && dy === 0) return new ClipperLib.DoublePoint2(0, 0);
			var f = 1 / Math.sqrt(dx * dx + dy * dy);
			dx *= f;
			dy *= f;
			return new ClipperLib.DoublePoint2(dy, -dx);
		};
		ClipperLib.ClipperOffset.prototype.DoOffset = function(delta) {
			this.m_destPolys = new Array();
			this.m_delta = delta;
			if (ClipperLib.ClipperBase.near_zero(delta)) {
				for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
					var node = this.m_polyNodes.Childs()[i];
					if (node.m_endtype === ClipperLib.EndType.etClosedPolygon) this.m_destPolys.push(node.m_polygon);
				}
				return;
			}
			if (this.MiterLimit > 2) this.m_miterLim = 2 / (this.MiterLimit * this.MiterLimit);
			else this.m_miterLim = .5;
			var y;
			if (this.ArcTolerance <= 0) y = ClipperLib.ClipperOffset.def_arc_tolerance;
			else if (this.ArcTolerance > Math.abs(delta) * ClipperLib.ClipperOffset.def_arc_tolerance) y = Math.abs(delta) * ClipperLib.ClipperOffset.def_arc_tolerance;
			else y = this.ArcTolerance;
			var steps = 3.14159265358979 / Math.acos(1 - y / Math.abs(delta));
			this.m_sin = Math.sin(ClipperLib.ClipperOffset.two_pi / steps);
			this.m_cos = Math.cos(ClipperLib.ClipperOffset.two_pi / steps);
			this.m_StepsPerRad = steps / ClipperLib.ClipperOffset.two_pi;
			if (delta < 0) this.m_sin = -this.m_sin;
			for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
				var node = this.m_polyNodes.Childs()[i];
				this.m_srcPoly = node.m_polygon;
				var len = this.m_srcPoly.length;
				if (len === 0 || delta <= 0 && (len < 3 || node.m_endtype !== ClipperLib.EndType.etClosedPolygon)) continue;
				this.m_destPoly = new Array();
				if (len === 1) {
					if (node.m_jointype === ClipperLib.JoinType.jtRound) {
						var X = 1, Y = 0;
						for (var j = 1; j <= steps; j++) {
							this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + Y * delta)));
							var X2 = X;
							X = X * this.m_cos - this.m_sin * Y;
							Y = X2 * this.m_sin + Y * this.m_cos;
						}
					} else {
						var X = -1, Y = -1;
						for (var j = 0; j < 4; ++j) {
							this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + Y * delta)));
							if (X < 0) X = 1;
							else if (Y < 0) Y = 1;
							else X = -1;
						}
					}
					this.m_destPolys.push(this.m_destPoly);
					continue;
				}
				this.m_normals.length = 0;
				for (var j = 0; j < len - 1; j++) this.m_normals.push(ClipperLib.ClipperOffset.GetUnitNormal(this.m_srcPoly[j], this.m_srcPoly[j + 1]));
				if (node.m_endtype === ClipperLib.EndType.etClosedLine || node.m_endtype === ClipperLib.EndType.etClosedPolygon) this.m_normals.push(ClipperLib.ClipperOffset.GetUnitNormal(this.m_srcPoly[len - 1], this.m_srcPoly[0]));
				else this.m_normals.push(new ClipperLib.DoublePoint1(this.m_normals[len - 2]));
				if (node.m_endtype === ClipperLib.EndType.etClosedPolygon) {
					var k = len - 1;
					for (var j = 0; j < len; j++) k = this.OffsetPoint(j, k, node.m_jointype);
					this.m_destPolys.push(this.m_destPoly);
				} else if (node.m_endtype === ClipperLib.EndType.etClosedLine) {
					var k = len - 1;
					for (var j = 0; j < len; j++) k = this.OffsetPoint(j, k, node.m_jointype);
					this.m_destPolys.push(this.m_destPoly);
					this.m_destPoly = new Array();
					var n = this.m_normals[len - 1];
					for (var j = len - 1; j > 0; j--) this.m_normals[j] = new ClipperLib.DoublePoint2(-this.m_normals[j - 1].X, -this.m_normals[j - 1].Y);
					this.m_normals[0] = new ClipperLib.DoublePoint2(-n.X, -n.Y);
					k = 0;
					for (var j = len - 1; j >= 0; j--) k = this.OffsetPoint(j, k, node.m_jointype);
					this.m_destPolys.push(this.m_destPoly);
				} else {
					var k = 0;
					for (var j = 1; j < len - 1; ++j) k = this.OffsetPoint(j, k, node.m_jointype);
					var pt1;
					if (node.m_endtype === ClipperLib.EndType.etOpenButt) {
						var j = len - 1;
						pt1 = new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * delta));
						this.m_destPoly.push(pt1);
						pt1 = new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X - this.m_normals[j].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y - this.m_normals[j].Y * delta));
						this.m_destPoly.push(pt1);
					} else {
						var j = len - 1;
						k = len - 2;
						this.m_sinA = 0;
						this.m_normals[j] = new ClipperLib.DoublePoint2(-this.m_normals[j].X, -this.m_normals[j].Y);
						if (node.m_endtype === ClipperLib.EndType.etOpenSquare) this.DoSquare(j, k);
						else this.DoRound(j, k);
					}
					for (var j = len - 1; j > 0; j--) this.m_normals[j] = new ClipperLib.DoublePoint2(-this.m_normals[j - 1].X, -this.m_normals[j - 1].Y);
					this.m_normals[0] = new ClipperLib.DoublePoint2(-this.m_normals[1].X, -this.m_normals[1].Y);
					k = len - 1;
					for (var j = k - 1; j > 0; --j) k = this.OffsetPoint(j, k, node.m_jointype);
					if (node.m_endtype === ClipperLib.EndType.etOpenButt) {
						pt1 = new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X - this.m_normals[0].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y - this.m_normals[0].Y * delta));
						this.m_destPoly.push(pt1);
						pt1 = new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + this.m_normals[0].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + this.m_normals[0].Y * delta));
						this.m_destPoly.push(pt1);
					} else {
						k = 1;
						this.m_sinA = 0;
						if (node.m_endtype === ClipperLib.EndType.etOpenSquare) this.DoSquare(0, 1);
						else this.DoRound(0, 1);
					}
					this.m_destPolys.push(this.m_destPoly);
				}
			}
		};
		ClipperLib.ClipperOffset.prototype.Execute = function() {
			var a = arguments;
			if (!(a[0] instanceof ClipperLib.PolyTree)) {
				var solution = a[0], delta = a[1];
				ClipperLib.Clear(solution);
				this.FixOrientations();
				this.DoOffset(delta);
				var clpr = new ClipperLib.Clipper(0);
				clpr.AddPaths(this.m_destPolys, ClipperLib.PolyType.ptSubject, true);
				if (delta > 0) clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftPositive, ClipperLib.PolyFillType.pftPositive);
				else {
					var r = ClipperLib.Clipper.GetBounds(this.m_destPolys);
					var outer = new ClipperLib.Path();
					outer.push(new ClipperLib.IntPoint2(r.left - 10, r.bottom + 10));
					outer.push(new ClipperLib.IntPoint2(r.right + 10, r.bottom + 10));
					outer.push(new ClipperLib.IntPoint2(r.right + 10, r.top - 10));
					outer.push(new ClipperLib.IntPoint2(r.left - 10, r.top - 10));
					clpr.AddPath(outer, ClipperLib.PolyType.ptSubject, true);
					clpr.ReverseSolution = true;
					clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNegative, ClipperLib.PolyFillType.pftNegative);
					if (solution.length > 0) solution.splice(0, 1);
				}
			} else {
				var solution = a[0], delta = a[1];
				solution.Clear();
				this.FixOrientations();
				this.DoOffset(delta);
				var clpr = new ClipperLib.Clipper(0);
				clpr.AddPaths(this.m_destPolys, ClipperLib.PolyType.ptSubject, true);
				if (delta > 0) clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftPositive, ClipperLib.PolyFillType.pftPositive);
				else {
					var r = ClipperLib.Clipper.GetBounds(this.m_destPolys);
					var outer = new ClipperLib.Path();
					outer.push(new ClipperLib.IntPoint2(r.left - 10, r.bottom + 10));
					outer.push(new ClipperLib.IntPoint2(r.right + 10, r.bottom + 10));
					outer.push(new ClipperLib.IntPoint2(r.right + 10, r.top - 10));
					outer.push(new ClipperLib.IntPoint2(r.left - 10, r.top - 10));
					clpr.AddPath(outer, ClipperLib.PolyType.ptSubject, true);
					clpr.ReverseSolution = true;
					clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNegative, ClipperLib.PolyFillType.pftNegative);
					if (solution.ChildCount() === 1 && solution.Childs()[0].ChildCount() > 0) {
						var outerNode = solution.Childs()[0];
						solution.Childs()[0] = outerNode.Childs()[0];
						solution.Childs()[0].m_Parent = solution;
						for (var i = 1; i < outerNode.ChildCount(); i++) solution.AddChild(outerNode.Childs()[i]);
					} else solution.Clear();
				}
			}
		};
		ClipperLib.ClipperOffset.prototype.OffsetPoint = function(j, k, jointype) {
			this.m_sinA = this.m_normals[k].X * this.m_normals[j].Y - this.m_normals[j].X * this.m_normals[k].Y;
			if (Math.abs(this.m_sinA * this.m_delta) < 1) {
				if (this.m_normals[k].X * this.m_normals[j].X + this.m_normals[j].Y * this.m_normals[k].Y > 0) {
					this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[k].X * this.m_delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[k].Y * this.m_delta)));
					return k;
				}
			} else if (this.m_sinA > 1) this.m_sinA = 1;
			else if (this.m_sinA < -1) this.m_sinA = -1;
			if (this.m_sinA * this.m_delta < 0) {
				this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[k].X * this.m_delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[k].Y * this.m_delta)));
				this.m_destPoly.push(new ClipperLib.IntPoint1(this.m_srcPoly[j]));
				this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * this.m_delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * this.m_delta)));
			} else switch (jointype) {
				case ClipperLib.JoinType.jtMiter:
					var r = 1 + (this.m_normals[j].X * this.m_normals[k].X + this.m_normals[j].Y * this.m_normals[k].Y);
					if (r >= this.m_miterLim) this.DoMiter(j, k, r);
					else this.DoSquare(j, k);
					break;
				case ClipperLib.JoinType.jtSquare:
					this.DoSquare(j, k);
					break;
				case ClipperLib.JoinType.jtRound:
					this.DoRound(j, k);
					break;
			}
			k = j;
			return k;
		};
		ClipperLib.ClipperOffset.prototype.DoSquare = function(j, k) {
			var dx = Math.tan(Math.atan2(this.m_sinA, this.m_normals[k].X * this.m_normals[j].X + this.m_normals[k].Y * this.m_normals[j].Y) / 4);
			this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_delta * (this.m_normals[k].X - this.m_normals[k].Y * dx)), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_delta * (this.m_normals[k].Y + this.m_normals[k].X * dx))));
			this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_delta * (this.m_normals[j].X + this.m_normals[j].Y * dx)), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_delta * (this.m_normals[j].Y - this.m_normals[j].X * dx))));
		};
		ClipperLib.ClipperOffset.prototype.DoMiter = function(j, k, r) {
			var q = this.m_delta / r;
			this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + (this.m_normals[k].X + this.m_normals[j].X) * q), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + (this.m_normals[k].Y + this.m_normals[j].Y) * q)));
		};
		ClipperLib.ClipperOffset.prototype.DoRound = function(j, k) {
			var a = Math.atan2(this.m_sinA, this.m_normals[k].X * this.m_normals[j].X + this.m_normals[k].Y * this.m_normals[j].Y);
			var steps = Math.max(ClipperLib.Cast_Int32(ClipperLib.ClipperOffset.Round(this.m_StepsPerRad * Math.abs(a))), 1);
			var X = this.m_normals[k].X, Y = this.m_normals[k].Y, X2;
			for (var i = 0; i < steps; ++i) {
				this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + X * this.m_delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + Y * this.m_delta)));
				X2 = X;
				X = X * this.m_cos - this.m_sin * Y;
				Y = X2 * this.m_sin + Y * this.m_cos;
			}
			this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * this.m_delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * this.m_delta)));
		};
		ClipperLib.Error = function(message) {
			try {
				throw new Error(message);
			} catch (err) {
				alert(err.message);
			}
		};
		ClipperLib.JS = {};
		ClipperLib.JS.AreaOfPolygon = function(poly, scale) {
			if (!scale) scale = 1;
			return ClipperLib.Clipper.Area(poly) / (scale * scale);
		};
		ClipperLib.JS.AreaOfPolygons = function(poly, scale) {
			if (!scale) scale = 1;
			var area = 0;
			for (var i = 0; i < poly.length; i++) area += ClipperLib.Clipper.Area(poly[i]);
			return area / (scale * scale);
		};
		ClipperLib.JS.BoundsOfPath = function(path, scale) {
			return ClipperLib.JS.BoundsOfPaths([path], scale);
		};
		ClipperLib.JS.BoundsOfPaths = function(paths, scale) {
			if (!scale) scale = 1;
			var bounds = ClipperLib.Clipper.GetBounds(paths);
			bounds.left /= scale;
			bounds.bottom /= scale;
			bounds.right /= scale;
			bounds.top /= scale;
			return bounds;
		};
		ClipperLib.JS.Clean = function(polygon, delta) {
			if (!(polygon instanceof Array)) return [];
			var isPolygons = polygon[0] instanceof Array;
			var polygon = ClipperLib.JS.Clone(polygon);
			if (typeof delta !== "number" || delta === null) {
				ClipperLib.Error("Delta is not a number in Clean().");
				return polygon;
			}
			if (polygon.length === 0 || polygon.length === 1 && polygon[0].length === 0 || delta < 0) return polygon;
			if (!isPolygons) polygon = [polygon];
			var k_length = polygon.length;
			var len, poly, result, d, p, j, i;
			var results = [];
			for (var k = 0; k < k_length; k++) {
				poly = polygon[k];
				len = poly.length;
				if (len === 0) continue;
				else if (len < 3) {
					result = poly;
					results.push(result);
					continue;
				}
				result = poly;
				d = delta * delta;
				p = poly[0];
				j = 1;
				for (i = 1; i < len; i++) {
					if ((poly[i].X - p.X) * (poly[i].X - p.X) + (poly[i].Y - p.Y) * (poly[i].Y - p.Y) <= d) continue;
					result[j] = poly[i];
					p = poly[i];
					j++;
				}
				p = poly[j - 1];
				if ((poly[0].X - p.X) * (poly[0].X - p.X) + (poly[0].Y - p.Y) * (poly[0].Y - p.Y) <= d) j--;
				if (j < len) result.splice(j, len - j);
				if (result.length) results.push(result);
			}
			if (!isPolygons && results.length) results = results[0];
			else if (!isPolygons && results.length === 0) results = [];
			else if (isPolygons && results.length === 0) results = [[]];
			return results;
		};
		ClipperLib.JS.Clone = function(polygon) {
			if (!(polygon instanceof Array)) return [];
			if (polygon.length === 0) return [];
			else if (polygon.length === 1 && polygon[0].length === 0) return [[]];
			var isPolygons = polygon[0] instanceof Array;
			if (!isPolygons) polygon = [polygon];
			var len = polygon.length, plen, i, j, result;
			var results = new Array(len);
			for (i = 0; i < len; i++) {
				plen = polygon[i].length;
				result = new Array(plen);
				for (j = 0; j < plen; j++) result[j] = {
					X: polygon[i][j].X,
					Y: polygon[i][j].Y
				};
				results[i] = result;
			}
			if (!isPolygons) results = results[0];
			return results;
		};
		ClipperLib.JS.Lighten = function(polygon, tolerance) {
			if (!(polygon instanceof Array)) return [];
			if (typeof tolerance !== "number" || tolerance === null) {
				ClipperLib.Error("Tolerance is not a number in Lighten().");
				return ClipperLib.JS.Clone(polygon);
			}
			if (polygon.length === 0 || polygon.length === 1 && polygon[0].length === 0 || tolerance < 0) return ClipperLib.JS.Clone(polygon);
			var isPolygons = polygon[0] instanceof Array;
			if (!isPolygons) polygon = [polygon];
			var i, j, poly, k, poly2, plen, A, B, P, d, rem, addlast;
			var bxax, byay, l, ax, ay;
			var len = polygon.length;
			var toleranceSq = tolerance * tolerance;
			var results = [];
			for (i = 0; i < len; i++) {
				poly = polygon[i];
				plen = poly.length;
				if (plen === 0) continue;
				for (k = 0; k < 1e6; k++) {
					poly2 = [];
					plen = poly.length;
					if (poly[plen - 1].X !== poly[0].X || poly[plen - 1].Y !== poly[0].Y) {
						addlast = 1;
						poly.push({
							X: poly[0].X,
							Y: poly[0].Y
						});
						plen = poly.length;
					} else addlast = 0;
					rem = [];
					for (j = 0; j < plen - 2; j++) {
						A = poly[j];
						P = poly[j + 1];
						B = poly[j + 2];
						ax = A.X;
						ay = A.Y;
						bxax = B.X - ax;
						byay = B.Y - ay;
						if (bxax !== 0 || byay !== 0) {
							l = ((P.X - ax) * bxax + (P.Y - ay) * byay) / (bxax * bxax + byay * byay);
							if (l > 1) {
								ax = B.X;
								ay = B.Y;
							} else if (l > 0) {
								ax += bxax * l;
								ay += byay * l;
							}
						}
						bxax = P.X - ax;
						byay = P.Y - ay;
						d = bxax * bxax + byay * byay;
						if (d <= toleranceSq) {
							rem[j + 1] = 1;
							j++;
						}
					}
					poly2.push({
						X: poly[0].X,
						Y: poly[0].Y
					});
					for (j = 1; j < plen - 1; j++) if (!rem[j]) poly2.push({
						X: poly[j].X,
						Y: poly[j].Y
					});
					poly2.push({
						X: poly[plen - 1].X,
						Y: poly[plen - 1].Y
					});
					if (addlast) poly.pop();
					if (!rem.length) break;
					else poly = poly2;
				}
				plen = poly2.length;
				if (poly2[plen - 1].X === poly2[0].X && poly2[plen - 1].Y === poly2[0].Y) poly2.pop();
				if (poly2.length > 2) results.push(poly2);
			}
			if (!isPolygons) results = results[0];
			if (typeof results === "undefined") results = [];
			return results;
		};
		ClipperLib.JS.PerimeterOfPath = function(path, closed, scale) {
			if (typeof path === "undefined") return 0;
			var sqrt = Math.sqrt;
			var perimeter = 0;
			var p1, p2, p1x = 0, p1y = 0, p2x = 0, p2y = 0;
			var j = path.length;
			if (j < 2) return 0;
			if (closed) {
				path[j] = path[0];
				j++;
			}
			while (--j) {
				p1 = path[j];
				p1x = p1.X;
				p1y = p1.Y;
				p2 = path[j - 1];
				p2x = p2.X;
				p2y = p2.Y;
				perimeter += sqrt((p1x - p2x) * (p1x - p2x) + (p1y - p2y) * (p1y - p2y));
			}
			if (closed) path.pop();
			return perimeter / scale;
		};
		ClipperLib.JS.PerimeterOfPaths = function(paths, closed, scale) {
			if (!scale) scale = 1;
			var perimeter = 0;
			for (var i = 0; i < paths.length; i++) perimeter += ClipperLib.JS.PerimeterOfPath(paths[i], closed, scale);
			return perimeter;
		};
		ClipperLib.JS.ScaleDownPath = function(path, scale) {
			var i, p;
			if (!scale) scale = 1;
			i = path.length;
			while (i--) {
				p = path[i];
				p.X = p.X / scale;
				p.Y = p.Y / scale;
			}
		};
		ClipperLib.JS.ScaleDownPaths = function(paths, scale) {
			var i, j, p;
			if (!scale) scale = 1;
			i = paths.length;
			while (i--) {
				j = paths[i].length;
				while (j--) {
					p = paths[i][j];
					p.X = p.X / scale;
					p.Y = p.Y / scale;
				}
			}
		};
		ClipperLib.JS.ScaleUpPath = function(path, scale) {
			var i, p, round = Math.round;
			if (!scale) scale = 1;
			i = path.length;
			while (i--) {
				p = path[i];
				p.X = round(p.X * scale);
				p.Y = round(p.Y * scale);
			}
		};
		ClipperLib.JS.ScaleUpPaths = function(paths, scale) {
			var i, j, p, round = Math.round;
			if (!scale) scale = 1;
			i = paths.length;
			while (i--) {
				j = paths[i].length;
				while (j--) {
					p = paths[i][j];
					p.X = round(p.X * scale);
					p.Y = round(p.Y * scale);
				}
			}
		};
		/**
		* @constructor
		*/
		ClipperLib.ExPolygons = function() {
			return [];
		};
		/**
		* @constructor
		*/
		ClipperLib.ExPolygon = function() {
			this.outer = null;
			this.holes = null;
		};
		ClipperLib.JS.AddOuterPolyNodeToExPolygons = function(polynode, expolygons) {
			var ep = new ClipperLib.ExPolygon();
			ep.outer = polynode.Contour();
			var childs = polynode.Childs();
			var ilen = childs.length;
			ep.holes = new Array(ilen);
			var node, n, i, j, childs2, jlen;
			for (i = 0; i < ilen; i++) {
				node = childs[i];
				ep.holes[i] = node.Contour();
				for (j = 0, childs2 = node.Childs(), jlen = childs2.length; j < jlen; j++) {
					n = childs2[j];
					ClipperLib.JS.AddOuterPolyNodeToExPolygons(n, expolygons);
				}
			}
			expolygons.push(ep);
		};
		ClipperLib.JS.ExPolygonsToPaths = function(expolygons) {
			var a, i, alen, ilen;
			var paths = new ClipperLib.Paths();
			for (a = 0, alen = expolygons.length; a < alen; a++) {
				paths.push(expolygons[a].outer);
				for (i = 0, ilen = expolygons[a].holes.length; i < ilen; i++) paths.push(expolygons[a].holes[i]);
			}
			return paths;
		};
		ClipperLib.JS.PolyTreeToExPolygons = function(polytree) {
			var expolygons = new ClipperLib.ExPolygons();
			var node, i, childs, ilen;
			for (i = 0, childs = polytree.Childs(), ilen = childs.length; i < ilen; i++) {
				node = childs[i];
				ClipperLib.JS.AddOuterPolyNodeToExPolygons(node, expolygons);
			}
			return expolygons;
		};
	})();
})))(), 1);
const OPENCV_SCRIPT_PATH = "/node_modules/@techstark/opencv-js/dist/opencv.js";
let runtimeReadyPromise;
let runtimeInitializedHandler;
const cvModule = {};
function resolveInitializedRuntime(loadedCv) {
	Object.assign(cvModule, loadedCv);
	runtimeInitializedHandler?.();
}
function loadOpenCvRuntime() {
	if (runtimeReadyPromise) return runtimeReadyPromise;
	runtimeReadyPromise = new Promise((resolve, reject) => {
		if (typeof document === "undefined") {
			reject(/* @__PURE__ */ new Error("OpenCV browser shim requires document to load script."));
			return;
		}
		const finish = (loadedCv) => {
			resolveInitializedRuntime(loadedCv);
			resolve(loadedCv);
		};
		const consumeGlobalCv = () => {
			const loadedCv = globalThis.cv;
			if (!loadedCv) {
				reject(/* @__PURE__ */ new Error("OpenCV.js runtime is unavailable after script load."));
				return;
			}
			if (typeof loadedCv.then === "function") {
				loadedCv.then(finish).catch(reject);
				return;
			}
			finish(loadedCv);
		};
		const existingScript = document.querySelector("script[data-opencv-shim=\"true\"]");
		if (existingScript instanceof HTMLScriptElement) {
			if (globalThis.cv) {
				consumeGlobalCv();
				return;
			}
			existingScript.addEventListener("load", consumeGlobalCv, { once: true });
			existingScript.addEventListener("error", () => reject(/* @__PURE__ */ new Error("Failed to load OpenCV.js runtime.")), { once: true });
			return;
		}
		const script = document.createElement("script");
		script.async = true;
		script.dataset.opencvShim = "true";
		script.src = OPENCV_SCRIPT_PATH;
		script.addEventListener("load", consumeGlobalCv, { once: true });
		script.addEventListener("error", () => reject(/* @__PURE__ */ new Error("Failed to load OpenCV.js runtime.")), { once: true });
		document.head.append(script);
	}).catch((error) => {
		runtimeReadyPromise = void 0;
		throw error;
	});
	return runtimeReadyPromise;
}
Object.defineProperty(cvModule, "onRuntimeInitialized", {
	configurable: true,
	enumerable: true,
	get() {
		return runtimeInitializedHandler;
	},
	set(handler) {
		runtimeInitializedHandler = typeof handler === "function" ? handler : void 0;
		loadOpenCvRuntime();
	}
});
if (globalThis.cv && typeof globalThis.cv.then !== "function") resolveInitializedRuntime(globalThis.cv);
//#endregion
//#region node_modules/@paddleocr/paddleocr-js/dist/index.mjs
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
function readString(bytes, start, length) {
	let output = "";
	for (let index = start; index < start + length; index += 1) {
		const value = bytes[index];
		if (value === 0) break;
		output += String.fromCharCode(value);
	}
	return output.replace(/\0.*$/, "").trim();
}
function readOctal(bytes, start, length) {
	const raw = readString(bytes, start, length).replace(/\0/g, "").trim();
	return raw ? Number.parseInt(raw, 8) : 0;
}
function isEmptyBlock(bytes, offset) {
	for (let index = offset; index < offset + 512; index += 1) if (bytes[index] !== 0) return false;
	return true;
}
function normalizeEntryName(name) {
	return name.replace(/^\.?\//, "");
}
function isMetadataEntry(name) {
	const segments = normalizeEntryName(name).split("/");
	return (segments[segments.length - 1] || "").startsWith("._") || segments.includes("PaxHeader") || segments.includes("__MACOSX");
}
function extractTarEntries(buffer) {
	const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	const entries = /* @__PURE__ */ new Map();
	let offset = 0;
	while (offset + 512 <= bytes.length) {
		if (isEmptyBlock(bytes, offset)) break;
		const name = normalizeEntryName(readString(bytes, offset, 100));
		const size = readOctal(bytes, offset + 124, 12);
		const type = bytes[offset + 156];
		const dataStart = offset + 512;
		const dataEnd = dataStart + size;
		if (type !== 53 && type !== 120 && name && !isMetadataEntry(name)) entries.set(name, bytes.slice(dataStart, dataEnd));
		offset = dataStart + Math.ceil(size / 512) * 512;
	}
	return entries;
}
function pickTarEntry(entries, targetName) {
	const normalizedTarget = normalizeEntryName(targetName);
	const entry = entries.get(normalizedTarget);
	if (entry) return entry;
	for (const [name, value] of entries) if (name.endsWith(`/${normalizedTarget}`) || name === normalizedTarget) return value;
	throw new Error(`Entry "${targetName}" was not found in the tar archive.`);
}
const DEFAULT_MODEL_ASSETS = {
	"PP-OCRv5_mobile_det": { url: "https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_det_onnx.tar" },
	"PP-OCRv5_mobile_rec": { url: "https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_rec_onnx.tar" }
};
const MODEL_ENTRY_PATHS = Object.freeze({
	model: "inference.onnx",
	config: "inference.yml"
});
function isNonEmptyString(value) {
	return typeof value === "string" && value.length > 0;
}
function isObject(value) {
	return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function normalizeModelAsset(assetName, asset) {
	if (isNonEmptyString(asset)) {
		const resolvedAsset = DEFAULT_MODEL_ASSETS[asset];
		if (!resolvedAsset) throw new Error(`Asset "${assetName}" references unknown model asset "${asset}".`);
		return { url: resolvedAsset.url };
	}
	if (!isObject(asset)) throw new Error(`Asset "${assetName}" must be an object.`);
	if (!isNonEmptyString(asset.url)) throw new Error(`Asset "${assetName}" must define url.`);
	return { url: asset.url };
}
function assertModelResourceSlot(kind, slot, value) {
	if (slot === "model") {
		if (!(value instanceof Uint8Array) || value.byteLength === 0) throw new Error(`${kind} model requires a non-empty ${MODEL_ENTRY_PATHS.model} resource.`);
		return;
	}
	if (slot === "config") {
		if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${kind} model requires a non-empty ${MODEL_ENTRY_PATHS.config} resource.`);
		return;
	}
	throw new Error(`Unsupported model resource slot "${slot}".`);
}
function assertModelResources(kind, resources) {
	for (const [slot, value] of Object.entries(resources)) assertModelResourceSlot(kind, slot, value);
}
async function loadModelAsset(asset, fetchImpl = fetch) {
	const response = await fetchImpl(asset.url);
	if (!response.ok) throw new Error(`Failed to download ${asset.url}: HTTP ${String(response.status)}`);
	const buffer = await response.arrayBuffer();
	const entries = extractTarEntries(buffer);
	const modelBytes = pickTarEntry(entries, MODEL_ENTRY_PATHS.model);
	const configBytes = pickTarEntry(entries, MODEL_ENTRY_PATHS.config);
	return {
		modelBytes,
		configText: new TextDecoder().decode(configBytes),
		download: {
			url: asset.url,
			bytes: buffer.byteLength
		}
	};
}
const SUPPORTED_PIPELINE_NAME = "OCR";
function isPlainObject$1(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function toFiniteNumber(value) {
	if (value === null || value === void 0 || value === "") return;
	const normalized = Number(value);
	return Number.isFinite(normalized) ? normalized : void 0;
}
function batchSizeOrOne(value) {
	const n = toFiniteNumber(value);
	return n !== void 0 && n >= 1 ? n : 1;
}
function applyGeneralPipelineRuntimeDefaults(textType, runtimeDefaults) {
	if (textType !== "general") return runtimeDefaults;
	return {
		text_det_limit_side_len: runtimeDefaults.text_det_limit_side_len ?? 960,
		text_det_limit_type: runtimeDefaults.text_det_limit_type ?? "max",
		text_det_max_side_limit: runtimeDefaults.text_det_max_side_limit ?? 4e3,
		text_det_thresh: runtimeDefaults.text_det_thresh ?? .3,
		text_det_box_thresh: runtimeDefaults.text_det_box_thresh ?? .6,
		text_det_unclip_ratio: runtimeDefaults.text_det_unclip_ratio ?? 2,
		text_rec_score_thresh: runtimeDefaults.text_rec_score_thresh ?? 0
	};
}
function parsePipelineConfigInput(input) {
	if (typeof input === "string") {
		const parsed = jsYaml.load(input);
		if (!isPlainObject$1(parsed)) throw new Error("OCR pipeline config text must decode to an object.");
		return parsed;
	}
	if (!isPlainObject$1(input)) throw new Error("OCR pipeline config must be an object or YAML text.");
	return input;
}
function addFeatureWarning(warnings, featureName, reason) {
	warnings.push(`${featureName} is not yet supported in PaddleOCR.js${`: ${reason}`}.`);
}
function getModuleModelName(moduleConfig) {
	return typeof (moduleConfig == null ? void 0 : moduleConfig.model_name) === "string" ? moduleConfig.model_name : null;
}
function validateModuleAsset(modulePath, modelName) {
	if (!modelName) throw new Error(`${modulePath}.model_name must be provided when ${modulePath}.model_dir is set.`);
}
function getModuleAsset(assetName, modulePath, moduleConfig) {
	if ((moduleConfig == null ? void 0 : moduleConfig.model_dir) == null) return null;
	if (isPlainObject$1(moduleConfig.model_dir)) {
		const asset = normalizeModelAsset(assetName, moduleConfig.model_dir);
		validateModuleAsset(modulePath, getModuleModelName(moduleConfig));
		return asset;
	}
	throw new Error(`${modulePath}.model_dir must be null or an asset descriptor object in browser usage.`);
}
function normalizeOcrPipelineConfig(input) {
	const config = parsePipelineConfigInput(input);
	const pipelineName = config.pipeline_name ?? SUPPORTED_PIPELINE_NAME;
	if (pipelineName !== SUPPORTED_PIPELINE_NAME) throw new Error(`Unsupported pipeline_name "${pipelineName}". PaddleOCR.js currently supports only "${SUPPORTED_PIPELINE_NAME}".`);
	const warnings = [];
	const subModules = isPlainObject$1(config.SubModules) ? config.SubModules : {};
	const textDetection = isPlainObject$1(subModules.TextDetection) ? subModules.TextDetection : null;
	const textRecognition = isPlainObject$1(subModules.TextRecognition) ? subModules.TextRecognition : null;
	if (!textDetection || !textRecognition) throw new Error("OCR pipeline config must define both \"SubModules.TextDetection\" and \"SubModules.TextRecognition\".");
	const useDocPreprocessor = Boolean(config.use_doc_preprocessor);
	const useTextlineOrientation = Boolean(config.use_textline_orientation);
	const subPipelines = config.SubPipelines;
	const docPreprocessor = isPlainObject$1(subPipelines == null ? void 0 : subPipelines.DocPreprocessor) ? subPipelines.DocPreprocessor : null;
	const textLineOrientation = isPlainObject$1(subModules.TextLineOrientation) ? subModules.TextLineOrientation : null;
	if (useDocPreprocessor || docPreprocessor) addFeatureWarning(warnings, "DocPreprocessor", "config will be ignored for now");
	if (useTextlineOrientation || textLineOrientation) addFeatureWarning(warnings, "TextLineOrientation", "config will be ignored for now");
	const textType = typeof config.text_type === "string" && config.text_type.length > 0 ? config.text_type : "general";
	if (config.text_type && config.text_type !== "general") warnings.push(`text_type ${JSON.stringify(config.text_type)} is not used by PaddleOCR.js yet.`);
	const detAsset = getModuleAsset("det", "SubModules.TextDetection", textDetection);
	const recAsset = getModuleAsset("rec", "SubModules.TextRecognition", textRecognition);
	const pipelineBatchSize = batchSizeOrOne(config.batch_size);
	const textDetectionBatchSize = batchSizeOrOne(textDetection.batch_size);
	const textRecognitionBatchSizeFromModule = batchSizeOrOne(textRecognition.batch_size);
	return {
		pipelineName,
		raw: config,
		warnings,
		unsupportedFeatures: [...useDocPreprocessor || docPreprocessor ? ["DocPreprocessor"] : [], ...useTextlineOrientation || textLineOrientation ? ["TextLineOrientation"] : []],
		modelSelection: {
			textDetectionModelName: getModuleModelName(textDetection),
			textRecognitionModelName: getModuleModelName(textRecognition)
		},
		assets: {
			...detAsset ? { det: detAsset } : {},
			...recAsset ? { rec: recAsset } : {}
		},
		runtimeDefaults: applyGeneralPipelineRuntimeDefaults(textType, {
			text_det_limit_side_len: toFiniteNumber(textDetection.limit_side_len),
			text_det_limit_type: textDetection.limit_type || void 0,
			text_det_max_side_limit: toFiniteNumber(textDetection.max_side_limit),
			text_det_thresh: toFiniteNumber(textDetection.thresh),
			text_det_box_thresh: toFiniteNumber(textDetection.box_thresh),
			text_det_unclip_ratio: toFiniteNumber(textDetection.unclip_ratio),
			text_rec_score_thresh: toFiniteNumber(textRecognition.score_thresh)
		}),
		pipelineBatchSize,
		textDetectionBatchSize,
		textRecognitionBatchSize: textRecognitionBatchSizeFromModule
	};
}
function ensureServedFromHttp() {
	if (globalThis.location.protocol === "file:") throw new Error("PaddleOCR.js requires an HTTP(S) origin so model assets can be fetched.");
}
function hasDomConstructor(name) {
	return typeof globalThis[name] !== "undefined";
}
async function sourceToImageBitmap(source) {
	if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) return source;
	if (source instanceof Blob) return createImageBitmap(source);
	if (hasDomConstructor("HTMLCanvasElement") && source instanceof HTMLCanvasElement) return createImageBitmap(source);
	if (source instanceof ImageData) {
		const canvas = document.createElement("canvas");
		canvas.width = source.width;
		canvas.height = source.height;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Failed to create a 2D canvas context.");
		ctx.putImageData(source, 0, 0);
		return createImageBitmap(canvas);
	}
	if (hasDomConstructor("HTMLImageElement") && source instanceof HTMLImageElement) return createImageBitmap(source);
	throw new Error("Unsupported image source. Use a Blob, ImageBitmap, ImageData, canvas, or img.");
}
async function sourceToClonedImageBitmap(source) {
	if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) return createImageBitmap(source);
	return sourceToImageBitmap(source);
}
function bitmapToSourceMat(cv, imageBitmap) {
	const canvas = document.createElement("canvas");
	canvas.width = imageBitmap.width;
	canvas.height = imageBitmap.height;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) throw new Error("Failed to create a 2D canvas context.");
	ctx.drawImage(imageBitmap, 0, 0);
	return {
		canvas,
		mat: cv.imread(canvas)
	};
}
async function sourceToMat(cv, source) {
	if (typeof cv.Mat === "function" && source instanceof cv.Mat) {
		const cloned = source.clone();
		return {
			width: source.cols,
			height: source.rows,
			mat: cloned,
			dispose() {
				cloned.delete();
			}
		};
	}
	const imageBitmap = await sourceToImageBitmap(source);
	const sourceImage = bitmapToSourceMat(cv, imageBitmap);
	return {
		width: imageBitmap.width,
		height: imageBitmap.height,
		mat: sourceImage.mat,
		dispose() {
			sourceImage.mat.delete();
			imageBitmap.close();
		}
	};
}
async function sourceToWorkerPayload(source) {
	if (typeof ImageBitmap === "undefined" || typeof createImageBitmap !== "function") throw new Error("Worker mode requires ImageBitmap support in this browser.");
	const imageBitmap = await sourceToClonedImageBitmap(source);
	return {
		payload: {
			kind: "imageBitmap",
			imageBitmap
		},
		transferables: [imageBitmap]
	};
}
let ortModulePromise = null;
async function loadOrtModule() {
	if (ortModulePromise) return ortModulePromise;
	ortModulePromise = import("./ort.bundle.min-BDhzGUGX.js");
	return ortModulePromise;
}
async function detectWebGpuAvailability() {
	var _a;
	const gpu = (_a = globalThis.navigator) == null ? void 0 : _a.gpu;
	if (!(gpu == null ? void 0 : gpu.requestAdapter)) return {
		available: false,
		reason: "navigator.gpu is unavailable in this browser."
	};
	try {
		if (!await gpu.requestAdapter()) return {
			available: false,
			reason: "The browser did not return a WebGPU adapter."
		};
		return {
			available: true,
			reason: ""
		};
	} catch (err) {
		return {
			available: false,
			reason: err instanceof Error ? err.message : "Failed to request a WebGPU adapter."
		};
	}
}
function getProviderCandidates(backend, webgpuState) {
	if (backend === "webgpu") {
		if (!webgpuState.available) throw new Error(`WebGPU is unavailable: ${webgpuState.reason}`);
		return [["webgpu"]];
	}
	if (backend === "wasm") return [["wasm"]];
	return webgpuState.available ? [["webgpu"], ["wasm"]] : [["wasm"]];
}
function applyOrtEnvironmentOptions(ort, ortOptions) {
	const wasmOptions = ort.env.wasm;
	if (ortOptions.wasmPaths !== void 0) wasmOptions.wasmPaths = ortOptions.wasmPaths;
	if (ortOptions.numThreads !== void 0) wasmOptions.numThreads = ortOptions.numThreads;
	if (ortOptions.simd !== void 0) wasmOptions.simd = ortOptions.simd;
	if (ortOptions.proxy !== void 0) wasmOptions.proxy = ortOptions.proxy;
	if (ortOptions.disableWasmProxy) wasmOptions.proxy = false;
}
async function initOrtRuntime(ortOptions = {}) {
	const backend = typeof ortOptions === "string" ? ortOptions : ortOptions.backend === "webgpu" || ortOptions.backend === "wasm" ? ortOptions.backend : "auto";
	const webgpuState = await detectWebGpuAvailability();
	const ort = await loadOrtModule();
	if (typeof ortOptions !== "string") applyOrtEnvironmentOptions(ort, ortOptions);
	return {
		ort,
		webgpuState,
		backend
	};
}
async function createSession(ort, modelBytes, providerCandidates) {
	let lastErr = null;
	for (const executionProviders of providerCandidates) try {
		return {
			session: await ort.InferenceSession.create(modelBytes, {
				executionProviders,
				graphOptimizationLevel: "all"
			}),
			provider: executionProviders[0]
		};
	} catch (err) {
		lastErr = err;
	}
	throw lastErr instanceof Error ? lastErr : /* @__PURE__ */ new Error("Failed to create ONNX session.");
}
async function releaseSessions(...sessions) {
	await Promise.all(sessions.map(async (session) => {
		if (!(session == null ? void 0 : session.release)) return;
		await session.release();
	}));
}
function nowMs() {
	return performance.now();
}
function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}
function distance2(p0, p1) {
	const dx = p0[0] - p1[0];
	const dy = p0[1] - p1[1];
	return Math.sqrt(dx * dx + dy * dy);
}
function withTimeout(promise, ms, label) {
	let settled = false;
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			if (settled) return;
			settled = true;
			reject(/* @__PURE__ */ new Error(`${label} timed out after ${String(ms / 1e3)}s`));
		}, ms);
		promise.then((result) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve(result);
		}).catch((err) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			reject(err);
		});
	});
}
function resolveRuntimeBatchSize(override, defaultBatchSize) {
	const rawBatch = override ?? defaultBatchSize;
	const coercedBatch = typeof rawBatch === "number" ? rawBatch : typeof rawBatch === "string" ? Number.parseInt(rawBatch, 10) : NaN;
	return Math.max(1, Number.isFinite(coercedBatch) ? coercedBatch : 1);
}
function chunkArray(items, size) {
	const chunks = [];
	for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
	return chunks;
}
function deepClone(value) {
	return structuredClone(value);
}
async function runInference(session, inputTensor) {
	const inputName = session.inputNames[0];
	return (await session.run({ [inputName]: inputTensor }))[session.outputNames[0]];
}
function isPlainObject(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function parseInferenceConfigText(text) {
	const parsed = jsYaml.load(text);
	return isPlainObject(parsed) ? parsed : {};
}
function parseScaleValue(rawScale, fallback) {
	if (typeof rawScale === "number") return rawScale;
	if (typeof rawScale !== "string") return fallback;
	const normalized = rawScale.replace(/\s/g, "");
	const direct = Number(normalized);
	if (!Number.isNaN(direct)) return direct;
	const divParts = normalized.split("/");
	if (divParts.length === 2) {
		const numerator = Number(divParts[0].replace(/\.+$/, ""));
		const denominator = Number(divParts[1].replace(/\.+$/, ""));
		if (!Number.isNaN(numerator) && !Number.isNaN(denominator) && denominator !== 0) return numerator / denominator;
	}
	return fallback;
}
function getTransformOp(transformOps, opName) {
	for (const op of transformOps || []) if (Object.prototype.hasOwnProperty.call(op, opName)) return op[opName];
	return null;
}
function findModelNameInYamlNode(value) {
	if (Array.isArray(value)) {
		for (const item of value) {
			const match = findModelNameInYamlNode(item);
			if (match) return match;
		}
		return null;
	}
	if (!isPlainObject(value)) return null;
	for (const [key, childValue] of Object.entries(value)) {
		if (key === "model_name" && typeof childValue === "string" && childValue.trim()) return childValue;
		const match = findModelNameInYamlNode(childValue);
		if (match) return match;
	}
	return null;
}
function extractInferenceModelName(configText) {
	var _a;
	const parsed = parseInferenceConfigText(configText);
	const preferredCandidates = [(_a = parsed.Global) == null ? void 0 : _a.model_name, parsed.model_name];
	for (const candidate of preferredCandidates) if (typeof candidate === "string" && candidate.trim()) return candidate;
	return findModelNameInYamlNode(parsed);
}
function toBgrFloatCHWFromBgr(bgr, width, height, normalizeConfig) {
	const data = new Float32Array(3 * width * height);
	const hw = width * height;
	const mean = normalizeConfig.mean;
	const std = normalizeConfig.std;
	const scale = normalizeConfig.scale;
	for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
		const idx = y * width + x;
		const p = idx * 3;
		const b = bgr[p];
		const g = bgr[p + 1];
		const r = bgr[p + 2];
		data[idx] = (b * scale - mean[0]) / std[0];
		data[idx + hw] = (g * scale - mean[1]) / std[1];
		data[idx + 2 * hw] = (r * scale - mean[2]) / std[2];
	}
	return data;
}
function orderQuad(pts) {
	const points = pts.slice().sort((a, b) => a[0] - b[0]);
	let indexA;
	let indexB;
	let indexC;
	let indexD;
	if (points[1][1] > points[0][1]) {
		indexA = 0;
		indexD = 1;
	} else {
		indexA = 1;
		indexD = 0;
	}
	if (points[3][1] > points[2][1]) {
		indexB = 2;
		indexC = 3;
	} else {
		indexB = 3;
		indexC = 2;
	}
	return [
		points[indexA],
		points[indexB],
		points[indexC],
		points[indexD]
	];
}
function polygonArea(poly) {
	let area = 0;
	for (let i = 0; i < poly.length; i += 1) {
		const j = (i + 1) % poly.length;
		area += poly[i][0] * poly[j][1] - poly[j][0] * poly[i][1];
	}
	return Math.abs(area) * .5;
}
function polygonPerimeter(poly) {
	let peri = 0;
	for (let i = 0; i < poly.length; i += 1) {
		const j = (i + 1) % poly.length;
		peri += distance2(poly[i], poly[j]);
	}
	return peri;
}
function chooseMaxAreaPath(paths) {
	let best = null;
	let bestArea = 0;
	for (const path of paths) {
		if (path.length < 4) continue;
		const area = polygonArea(path.map((pt) => [pt.X, pt.Y]));
		if (area > bestArea) {
			bestArea = area;
			best = path;
		}
	}
	return best;
}
function unclip(poly, unclipRatio) {
	const area = polygonArea(poly);
	const perimeter = polygonPerimeter(poly);
	if (perimeter <= 0) return null;
	const distance = area * unclipRatio / perimeter;
	const path = poly.map((p) => ({
		X: Math.trunc(p[0]),
		Y: Math.trunc(p[1])
	}));
	const offset = new import_clipper.default.ClipperOffset();
	offset.AddPath(path, import_clipper.default.JoinType.jtRound, import_clipper.default.EndType.etClosedPolygon);
	const expanded = new import_clipper.default.Paths();
	offset.Execute(expanded, distance);
	const best = chooseMaxAreaPath(expanded);
	if (!best) return null;
	return best.map((pt) => [pt.X, pt.Y]);
}
function getMiniBoxFromPoints(cv, points) {
	const flat = [];
	for (const p of points) flat.push(p[0], p[1]);
	const contour = cv.matFromArray(points.length, 1, cv.CV_32FC2, flat);
	const rect = cv.minAreaRect(contour);
	const vertices = cv.RotatedRect.points(rect);
	const box = [];
	for (let i = 0; i < 4; i += 1) box.push([vertices[i].x, vertices[i].y]);
	contour.delete();
	const ordered = orderQuad(box);
	return {
		box: ordered,
		side: Math.min(distance2(ordered[0], ordered[1]), distance2(ordered[1], ordered[2]))
	};
}
function boxScoreFast(cv, predMat, box) {
	const h = predMat.rows;
	const w = predMat.cols;
	let minX = w - 1;
	let maxX = 0;
	let minY = h - 1;
	let maxY = 0;
	for (const p of box) {
		minX = Math.min(minX, p[0]);
		maxX = Math.max(maxX, p[0]);
		minY = Math.min(minY, p[1]);
		maxY = Math.max(maxY, p[1]);
	}
	minX = clamp(Math.floor(minX), 0, w - 1);
	maxX = clamp(Math.ceil(maxX), 0, w - 1);
	minY = clamp(Math.floor(minY), 0, h - 1);
	maxY = clamp(Math.ceil(maxY), 0, h - 1);
	const rw = Math.max(1, maxX - minX + 1);
	const rh = Math.max(1, maxY - minY + 1);
	const roi = predMat.roi(new cv.Rect(minX, minY, rw, rh));
	const mask = cv.Mat.zeros(rh, rw, cv.CV_8UC1);
	const shifted = box.map((p) => [Math.trunc(p[0] - minX), Math.trunc(p[1] - minY)]);
	const flat = [];
	for (const p of shifted) flat.push(p[0], p[1]);
	const pts = cv.matFromArray(shifted.length, 1, cv.CV_32SC2, flat);
	const ptsVec = new cv.MatVector();
	ptsVec.push_back(pts);
	cv.fillPoly(mask, ptsVec, new cv.Scalar(1));
	const mean = cv.mean(roi, mask)[0];
	roi.delete();
	mask.delete();
	pts.delete();
	ptsVec.delete();
	return mean;
}
const DET_BOX_MIN_SIZE = 3;
const DEFAULT_DET_MODEL_PARSE_FALLBACKS = Object.freeze({
	resizeLong: 960,
	limitType: "max",
	maxSideLimit: 4e3,
	normalize: {
		mean: [
			.485,
			.456,
			.406
		],
		std: [
			.229,
			.224,
			.225
		],
		scale: 1 / 255
	},
	postprocess: {
		thresh: .3,
		boxThresh: .6,
		maxCandidates: 1e3,
		unclipRatio: 2
	}
});
const DEFAULT_DET_MODEL_CONFIG = Object.freeze({ ...DEFAULT_DET_MODEL_PARSE_FALLBACKS });
function parseDetLimitType(raw) {
	const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
	if (v === "min" || v === "max") return v;
	return DEFAULT_DET_MODEL_PARSE_FALLBACKS.limitType;
}
function parseDetModelConfigText(text) {
	const parsed = parseInferenceConfigText(text);
	const preProcess = parsed.PreProcess;
	const transformOps = preProcess == null ? void 0 : preProcess.transform_ops;
	const resize = getTransformOp(transformOps, "DetResizeForTest");
	const normalize = getTransformOp(transformOps, "NormalizeImage");
	const postprocess2 = parsed.PostProcess || {};
	const maxSideRaw = resize == null ? void 0 : resize.max_side_limit;
	const maxSideLimit = Number(maxSideRaw);
	const maxSide = Number.isFinite(maxSideLimit) && maxSideLimit > 0 ? maxSideLimit : DEFAULT_DET_MODEL_PARSE_FALLBACKS.maxSideLimit;
	return {
		resizeLong: Number((resize == null ? void 0 : resize.resize_long) ?? DEFAULT_DET_MODEL_PARSE_FALLBACKS.resizeLong),
		limitType: parseDetLimitType(resize == null ? void 0 : resize.limit_type),
		maxSideLimit: maxSide,
		normalize: {
			mean: (normalize == null ? void 0 : normalize.mean) ?? DEFAULT_DET_MODEL_PARSE_FALLBACKS.normalize.mean,
			std: (normalize == null ? void 0 : normalize.std) ?? DEFAULT_DET_MODEL_PARSE_FALLBACKS.normalize.std,
			scale: parseScaleValue(normalize == null ? void 0 : normalize.scale, DEFAULT_DET_MODEL_PARSE_FALLBACKS.normalize.scale)
		},
		postprocess: {
			thresh: Number(postprocess2.thresh ?? DEFAULT_DET_MODEL_PARSE_FALLBACKS.postprocess.thresh),
			boxThresh: Number(postprocess2.box_thresh ?? DEFAULT_DET_MODEL_PARSE_FALLBACKS.postprocess.boxThresh),
			maxCandidates: Number(postprocess2.max_candidates ?? DEFAULT_DET_MODEL_PARSE_FALLBACKS.postprocess.maxCandidates),
			unclipRatio: Number(postprocess2.unclip_ratio ?? DEFAULT_DET_MODEL_PARSE_FALLBACKS.postprocess.unclipRatio)
		}
	};
}
function resolveDetParams(defaults, overrides) {
	return {
		limitSideLen: (overrides == null ? void 0 : overrides.limitSideLen) ?? defaults.limitSideLen,
		limitType: (overrides == null ? void 0 : overrides.limitType) ?? defaults.limitType,
		maxSideLimit: (overrides == null ? void 0 : overrides.maxSideLimit) ?? defaults.maxSideLimit,
		thresh: (overrides == null ? void 0 : overrides.thresh) ?? defaults.thresh,
		boxThresh: (overrides == null ? void 0 : overrides.boxThresh) ?? defaults.boxThresh,
		unclipRatio: (overrides == null ? void 0 : overrides.unclipRatio) ?? defaults.unclipRatio
	};
}
async function createDetModel({ ort, modelBytes, configText, backend, webgpuState, batchSize: batchSizeArg }) {
	assertModelResources("Detection", {
		model: modelBytes,
		config: configText
	});
	const config = parseDetModelConfigText(configText);
	const defaultBatchSize = Math.max(1, batchSizeArg ?? 1);
	const defaultParams = {
		limitSideLen: config.resizeLong,
		limitType: config.limitType,
		maxSideLimit: config.maxSideLimit,
		thresh: config.postprocess.thresh,
		boxThresh: config.postprocess.boxThresh,
		unclipRatio: config.postprocess.unclipRatio
	};
	let sessionState = await createDetModelSession(ort, modelBytes, backend, webgpuState);
	return {
		kind: "det",
		config,
		get provider() {
			return (sessionState == null ? void 0 : sessionState.provider) || "";
		},
		async predict(cv, mats, overrides) {
			if (!(sessionState == null ? void 0 : sessionState.session)) throw new Error("Detection model session is not initialized.");
			const params = resolveDetParams(defaultParams, overrides);
			const batchSize = resolveRuntimeBatchSize(overrides == null ? void 0 : overrides.batchSize, defaultBatchSize);
			const results = [];
			const runCtx = {
				cv,
				ort,
				config,
				session: sessionState.session
			};
			for (const chunk of chunkArray(mats, batchSize)) {
				const preps = preprocess$1({
					cv,
					ort,
					config
				}, chunk, params);
				const inputTensor = packDetBatchTensor(ort, preps);
				const internals = postprocess$1(runCtx, await runInference(sessionState.session, inputTensor), preps, params);
				for (const internal of internals) results.push({
					boxes: internal.boxes,
					srcW: internal.prep.srcW,
					srcH: internal.prep.srcH
				});
			}
			return results;
		},
		async dispose() {
			await releaseSessions(sessionState == null ? void 0 : sessionState.session);
			sessionState = null;
		}
	};
}
async function createDetModelSession(ort, modelBytes, backend, webgpuState) {
	return withTimeout(createSession(ort, modelBytes, getProviderCandidates(backend, webgpuState)), 6e4, "Detection model");
}
function preprocess$1(context, mats, params) {
	return mats.map((mat) => preprocessSample$1(context, mat, params));
}
function preprocessSample$1(context, sourceMat, params) {
	const { cv, ort, config } = context;
	const srcW = sourceMat.cols;
	const srcH = sourceMat.rows;
	const limitSideLen = Math.max(32, params.limitSideLen);
	const limitType = params.limitType;
	const maxSideLimit = Math.max(32, params.maxSideLimit);
	let scale = 1;
	if (limitType === "max") {
		const maxSide = Math.max(srcW, srcH);
		if (maxSide > limitSideLen) scale = limitSideLen / Math.max(1, maxSide);
	} else {
		const minSide = Math.min(srcW, srcH);
		if (minSide < limitSideLen) scale = limitSideLen / Math.max(1, minSide);
	}
	let dstW = Math.max(32, Math.round(srcW * scale / 32) * 32);
	let dstH = Math.max(32, Math.round(srcH * scale / 32) * 32);
	if (Math.max(dstW, dstH) > maxSideLimit) {
		const limitScale = maxSideLimit / Math.max(dstW, dstH);
		dstW = Math.max(32, Math.floor(dstW * limitScale));
		dstH = Math.max(32, Math.floor(dstH * limitScale));
	}
	dstW = clamp(dstW, 32, maxSideLimit);
	dstH = clamp(dstH, 32, maxSideLimit);
	dstW = Math.max(32, Math.round(dstW / 32) * 32);
	dstH = Math.max(32, Math.round(dstH / 32) * 32);
	const resized = new cv.Mat();
	const bgr = new cv.Mat();
	cv.resize(sourceMat, resized, new cv.Size(dstW, dstH), 0, 0, cv.INTER_LINEAR);
	if (resized.channels() === 4) cv.cvtColor(resized, bgr, cv.COLOR_RGBA2BGR);
	else if (resized.channels() === 1) cv.cvtColor(resized, bgr, cv.COLOR_GRAY2BGR);
	else resized.copyTo(bgr);
	const chw = toBgrFloatCHWFromBgr(bgr.data, dstW, dstH, config.normalize);
	resized.delete();
	bgr.delete();
	return {
		tensor: new ort.Tensor("float32", chw, [
			1,
			3,
			dstH,
			dstW
		]),
		srcW,
		srcH,
		dstW,
		dstH
	};
}
function getDetMap(outputTensor) {
	const dims = outputTensor.dims;
	const data = outputTensor.data;
	if (dims.length === 4) return {
		data,
		h: dims[2],
		w: dims[3]
	};
	if (dims.length === 3) return {
		data,
		h: dims[1],
		w: dims[2]
	};
	throw new Error(`Unexpected det output dims: [${dims.join(", ")}]`);
}
function createBatchDetTensor(ort, preps, maxH, maxW) {
	const batch = preps.length;
	const plane = 3 * maxH * maxW;
	const out = new Float32Array(batch * plane);
	for (let i = 0; i < batch; i += 1) {
		const prep = preps[i];
		const chw = prep.tensor.data;
		const { dstH, dstW } = prep;
		const base = i * plane;
		for (let c = 0; c < 3; c += 1) {
			const srcChannelBase = c * dstH * dstW;
			const dstChannelBase = base + c * maxH * maxW;
			for (let y = 0; y < dstH; y += 1) {
				const srcRow = srcChannelBase + y * dstW;
				const dstRow = dstChannelBase + y * maxW;
				out.set(chw.subarray(srcRow, srcRow + dstW), dstRow);
			}
		}
	}
	return new ort.Tensor("float32", out, [
		batch,
		3,
		maxH,
		maxW
	]);
}
function packDetBatchTensor(ort, preps) {
	return createBatchDetTensor(ort, preps, Math.max(...preps.map((p) => p.dstH)), Math.max(...preps.map((p) => p.dstW)));
}
function batchDetOutputPlaneOffset(dims, batchIndex) {
	return batchIndex * dims.slice(1).reduce((a, b) => a * b, 1);
}
function detFeatureCropDims(dstH, dstW, maxH, maxW, ohFull, owFull) {
	return {
		cropOh: Math.max(1, Math.min(ohFull, Math.round(ohFull * dstH / maxH))),
		cropOw: Math.max(1, Math.min(owFull, Math.round(owFull * dstW / maxW)))
	};
}
function sliceBatchedDetOutputPlane(ort, fullOutput, batchIndex, cropOh, cropOw, ohFull, owFull) {
	const data = fullOutput.data;
	const dims = fullOutput.dims;
	const base = batchDetOutputPlaneOffset(dims, batchIndex);
	const out = new Float32Array(cropOh * cropOw);
	for (let r = 0; r < cropOh; r += 1) {
		const rowStart = base + r * owFull;
		out.set(data.subarray(rowStart, rowStart + cropOw), r * cropOw);
	}
	return new ort.Tensor("float32", out, [
		1,
		1,
		cropOh,
		cropOw
	]);
}
function postprocess$1(context, fullOutput, preps, params) {
	const { cv, ort, config } = context;
	const od = fullOutput.dims;
	if (od.length !== 3 && od.length !== 4) throw new Error(`Unexpected det output dims: [${od.join(", ")}]`);
	const ohFull = od.length === 4 ? od[2] : od[1];
	const owFull = od.length === 4 ? od[3] : od[2];
	const nOut = od.length === 4 ? od[0] : preps.length === 1 ? 1 : od[0];
	if (nOut !== preps.length) throw new Error(`Detection batch output N=${String(nOut)} does not match input batch ${String(preps.length)}`);
	const maxH = Math.max(...preps.map((p) => p.dstH));
	const maxW = Math.max(...preps.map((p) => p.dstW));
	const items = [];
	for (let i = 0; i < preps.length; i += 1) {
		const prep = preps[i];
		const { cropOh, cropOw } = detFeatureCropDims(prep.dstH, prep.dstW, maxH, maxW, ohFull, owFull);
		const planeTensor = sliceBatchedDetOutputPlane(ort, fullOutput, i, cropOh, cropOw, ohFull, owFull);
		const boxes = decodeDetOutput({
			cv,
			config
		}, planeTensor, prep, params.thresh, params.boxThresh, params.unclipRatio);
		items.push({
			prep,
			boxes
		});
	}
	return items;
}
function decodeDetOutput(context, detOutput, meta, detThresh, boxThresh, unclipRatio) {
	const { cv, config } = context;
	const { data, h, w } = getDetMap(detOutput);
	const pred = cv.matFromArray(h, w, cv.CV_32FC1, data);
	const maskData = new Uint8Array(h * w);
	for (let i = 0; i < data.length; i += 1) maskData[i] = data[i] > detThresh ? 255 : 0;
	const bitmap = cv.matFromArray(h, w, cv.CV_8UC1, maskData);
	const contours = new cv.MatVector();
	const hierarchy = new cv.Mat();
	cv.findContours(bitmap, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
	const boxes = [];
	const candidateCount = Math.min(config.postprocess.maxCandidates, contours.size());
	for (let i = 0; i < candidateCount; i += 1) {
		const contour = contours.get(i);
		if (contour.rows < 4) {
			contour.delete();
			continue;
		}
		const points = [];
		for (let row = 0; row < contour.rows; row += 1) points.push([contour.data32S[row * 2], contour.data32S[row * 2 + 1]]);
		const mini = getMiniBoxFromPoints(cv, points);
		if (mini.side < DET_BOX_MIN_SIZE) {
			contour.delete();
			continue;
		}
		const score = boxScoreFast(cv, pred, mini.box);
		if (score < boxThresh) {
			contour.delete();
			continue;
		}
		const expanded = unclip(mini.box, unclipRatio);
		if (!expanded || expanded.length < 4) {
			contour.delete();
			continue;
		}
		const miniUnclip = getMiniBoxFromPoints(cv, expanded);
		if (miniUnclip.side < DET_BOX_MIN_SIZE + 2) {
			contour.delete();
			continue;
		}
		const poly = miniUnclip.box.map((point) => [clamp(Math.round(point[0] * meta.srcW / Math.max(1, w)), 0, meta.srcW), clamp(Math.round(point[1] * meta.srcH / Math.max(1, h)), 0, meta.srcH)]);
		boxes.push({
			poly,
			score
		});
		contour.delete();
	}
	pred.delete();
	bitmap.delete();
	contours.delete();
	hierarchy.delete();
	boxes.sort((a, b) => a.poly[0][1] - b.poly[0][1] || a.poly[0][0] - b.poly[0][0]);
	for (let i = 0; i < boxes.length - 1; i += 1) for (let j = i; j >= 0; j -= 1) if (Math.abs(boxes[j + 1].poly[0][1] - boxes[j].poly[0][1]) < 10 && boxes[j + 1].poly[0][0] < boxes[j].poly[0][0]) {
		const tmp = boxes[j];
		boxes[j] = boxes[j + 1];
		boxes[j + 1] = tmp;
	} else break;
	return boxes;
}
const DEFAULT_REC_ALPHANUMERIC_DICT = "0123456789abcdefghijklmnopqrstuvwxyz".split("");
const REC_NORMALIZE = Object.freeze({
	mean: [
		.5,
		.5,
		.5
	],
	std: [
		.5,
		.5,
		.5
	],
	scale: 1 / 255
});
const DEFAULT_REC_MODEL_PARSE_FALLBACKS = Object.freeze({
	imageShape: [
		3,
		48,
		320
	],
	charDict: []
});
const MAX_REC_WIDTH = 3200;
const DEFAULT_REC_MODEL_CONFIG = Object.freeze({ ...DEFAULT_REC_MODEL_PARSE_FALLBACKS });
function parseRecModelConfigText(text) {
	const parsed = parseInferenceConfigText(text);
	const preProcess = parsed.PreProcess;
	const resize = getTransformOp(preProcess == null ? void 0 : preProcess.transform_ops, "RecResizeImg");
	const baseCharDict = (parsed.PostProcess || {}).character_dict;
	const imageShape = resize == null ? void 0 : resize.image_shape;
	if (!imageShape || !Array.isArray(imageShape) || imageShape.length < 3) throw new Error("RecResizeImg.image_shape is required in rec inference.yml");
	return {
		imageShape,
		charDict: Array.isArray(baseCharDict) && baseCharDict.length > 0 ? [...baseCharDict, " "] : [...DEFAULT_REC_ALPHANUMERIC_DICT, " "]
	};
}
async function createRecModel({ ort, modelBytes, configText, backend, webgpuState, batchSize: batchSizeArg }) {
	assertModelResources("Recognition", {
		model: modelBytes,
		config: configText
	});
	const config = parseRecModelConfigText(configText);
	const defaultBatchSize = Math.max(1, batchSizeArg ?? 1);
	let sessionState = await createRecModelSession(ort, modelBytes, backend, webgpuState);
	return {
		kind: "rec",
		config,
		get provider() {
			return (sessionState == null ? void 0 : sessionState.provider) || "";
		},
		async predict(cv, mats, overrides) {
			if (!(sessionState == null ? void 0 : sessionState.session)) throw new Error("Recognition model session is not initialized.");
			const batchSize = resolveRuntimeBatchSize(overrides == null ? void 0 : overrides.batchSize, defaultBatchSize);
			const samples = preprocess({
				cv,
				config
			}, mats);
			const charDict = config.charDict;
			const ordered = samples.slice().sort((a, b) => a.width - b.width);
			const decoded = [];
			const targetH = config.imageShape[1];
			for (const batch of chunkArray(ordered, batchSize)) {
				const inputTensor = packRecBatchTensor(ort, batch, targetH);
				const batchResults = postprocess(await runInference(sessionState.session, inputTensor), charDict);
				for (let index = 0; index < batchResults.length; index += 1) decoded.push({
					inputIndex: batch[index].inputIndex,
					...batchResults[index]
				});
			}
			decoded.sort((a, b) => a.inputIndex - b.inputIndex);
			return decoded.map(({ text, score }) => ({
				text,
				score
			}));
		},
		async dispose() {
			await releaseSessions(sessionState == null ? void 0 : sessionState.session);
			sessionState = null;
		}
	};
}
async function createRecModelSession(ort, modelBytes, backend, webgpuState) {
	return withTimeout(createSession(ort, modelBytes, getProviderCandidates(backend, webgpuState)), 6e4, "Recognition model");
}
function preprocess(context, mats) {
	const samples = [];
	for (let i = 0; i < mats.length; i += 1) samples.push(preprocessSample(context, mats[i], i));
	return samples;
}
function preprocessSample(context, cropMat, inputIndex) {
	const { cv, config } = context;
	const [channels, targetH, baseW] = config.imageShape;
	const srcW = cropMat.cols;
	const srcH = cropMat.rows;
	if (channels !== 3) throw new Error(`Unexpected recognition channels: ${String(channels)}`);
	const ratio = srcW / Math.max(1, srcH);
	const maxWhRatio = Math.max(baseW / Math.max(1, targetH), ratio);
	const recW = clamp(Math.trunc(targetH * maxWhRatio), 1, MAX_REC_WIDTH);
	const resizedW = Math.min(recW, Math.ceil(targetH * ratio));
	const resized = new cv.Mat();
	const bgr = new cv.Mat();
	cv.resize(cropMat, resized, new cv.Size(resizedW, targetH), 0, 0, cv.INTER_LINEAR);
	if (resized.channels() === 4) cv.cvtColor(resized, bgr, cv.COLOR_RGBA2BGR);
	else if (resized.channels() === 1) cv.cvtColor(resized, bgr, cv.COLOR_GRAY2BGR);
	else resized.copyTo(bgr);
	const resizedChw = toBgrFloatCHWFromBgr(bgr.data, resizedW, targetH, REC_NORMALIZE);
	const chw = new Float32Array(3 * targetH * recW);
	const dstPerChannel = targetH * recW;
	const srcPerChannel = targetH * resizedW;
	for (let channel = 0; channel < 3; channel += 1) for (let row = 0; row < targetH; row += 1) {
		const srcStart = channel * srcPerChannel + row * resizedW;
		const dstStart = channel * dstPerChannel + row * recW;
		chw.set(resizedChw.subarray(srcStart, srcStart + resizedW), dstStart);
	}
	bgr.delete();
	resized.delete();
	return {
		inputIndex,
		width: recW,
		chw
	};
}
function createBatchTensor(ort, samples, maxW, targetH) {
	const batch = samples.length;
	const out = new Float32Array(batch * 3 * targetH * maxW);
	const dstPerChannel = targetH * maxW;
	for (let index = 0; index < batch; index += 1) {
		const sample = samples[index];
		const srcW = sample.width;
		const srcPerChannel = targetH * srcW;
		for (let channel = 0; channel < 3; channel += 1) {
			const srcBase = channel * srcPerChannel;
			const dstBase = index * (3 * dstPerChannel) + channel * dstPerChannel;
			for (let row = 0; row < targetH; row += 1) {
				const srcStart = srcBase + row * srcW;
				const dstStart = dstBase + row * maxW;
				out.set(sample.chw.subarray(srcStart, srcStart + srcW), dstStart);
			}
		}
	}
	return new ort.Tensor("float32", out, [
		batch,
		3,
		targetH,
		maxW
	]);
}
function packRecBatchTensor(ort, samples, targetH) {
	return createBatchTensor(ort, samples, samples.reduce((acc, sample) => Math.max(acc, sample.width), 1), targetH);
}
function decodeCTCSample(data, offset, timeSteps, classes, charDict) {
	let prevIdx = -1;
	let text = "";
	const probs = [];
	for (let step = 0; step < timeSteps; step += 1) {
		let maxIdx = 0;
		let maxVal = -Infinity;
		const stepOffset = offset + step * classes;
		for (let cls = 0; cls < classes; cls += 1) {
			const value = data[stepOffset + cls];
			if (value > maxVal) {
				maxVal = value;
				maxIdx = cls;
			}
		}
		if (maxIdx > 0 && maxIdx !== prevIdx) {
			const dictIdx = maxIdx - 1;
			if (dictIdx >= 0 && dictIdx < charDict.length) {
				text += charDict[dictIdx];
				probs.push(maxVal);
			}
		}
		prevIdx = maxIdx;
	}
	const score = probs.length ? probs.reduce((a, b) => a + b, 0) / probs.length : 0;
	return {
		text,
		score
	};
}
function postprocess(output, charDict) {
	const dims = output.dims;
	if (dims.length !== 3) throw new Error(`Unexpected rec output dims: [${dims.join(", ")}]`);
	const sampleCount = dims[0];
	const timeSteps = dims[1];
	const classes = dims[2];
	const data = output.data;
	const stride = timeSteps * classes;
	const results = [];
	for (let index = 0; index < sampleCount; index += 1) results.push(decodeCTCSample(data, index * stride, timeSteps, classes, charDict));
	return results;
}
function cropByPoly(cv, srcMat, poly) {
	const ordered = getMiniBoxFromPoints(cv, poly).box;
	const widthTop = Math.hypot(ordered[1][0] - ordered[0][0], ordered[1][1] - ordered[0][1]);
	const widthBottom = Math.hypot(ordered[2][0] - ordered[3][0], ordered[2][1] - ordered[3][1]);
	const heightLeft = Math.hypot(ordered[3][0] - ordered[0][0], ordered[3][1] - ordered[0][1]);
	const heightRight = Math.hypot(ordered[2][0] - ordered[1][0], ordered[2][1] - ordered[1][1]);
	const cropW = Math.max(1, Math.floor(Math.max(widthTop, widthBottom)));
	const cropH = Math.max(1, Math.floor(Math.max(heightLeft, heightRight)));
	const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
		ordered[0][0],
		ordered[0][1],
		ordered[1][0],
		ordered[1][1],
		ordered[2][0],
		ordered[2][1],
		ordered[3][0],
		ordered[3][1]
	]);
	const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
		0,
		0,
		cropW,
		0,
		cropW,
		cropH,
		0,
		cropH
	]);
	const transform = cv.getPerspectiveTransform(srcTri, dstTri);
	const warped = new cv.Mat();
	cv.warpPerspective(srcMat, warped, transform, new cv.Size(cropW, cropH), cv.INTER_CUBIC, cv.BORDER_REPLICATE, new cv.Scalar());
	srcTri.delete();
	dstTri.delete();
	transform.delete();
	if (warped.rows / Math.max(1, warped.cols) >= 1.5) {
		const rotated = new cv.Mat();
		cv.rotate(warped, rotated, cv.ROTATE_90_COUNTERCLOCKWISE);
		warped.delete();
		return rotated;
	}
	return warped;
}
let cachedCvPromise = null;
async function getOpenCv() {
	let cv;
	if (cvModule instanceof Promise) cv = await cvModule;
	else {
		const mod = cvModule;
		if (mod.Mat) cv = cvModule;
		else {
			await new Promise((resolve) => {
				mod.onRuntimeInitialized = () => {
					resolve();
				};
			});
			cv = cvModule;
		}
	}
	return { cv };
}
async function initOpenCvRuntime() {
	if (!cachedCvPromise) cachedCvPromise = getOpenCv().catch((error) => {
		cachedCvPromise = null;
		throw error;
	});
	return cachedCvPromise;
}
function firstDefined(...values) {
	for (const value of values) if (value !== void 0 && value !== null) return value;
}
function toNumberOrUndefined(value) {
	if (value === void 0 || value === null) return void 0;
	const num = Number(value);
	return Number.isFinite(num) ? num : void 0;
}
function getOcrRuntimeParams(config, defaults = {}, params = {}) {
	return {
		det: {
			limitSideLen: toNumberOrUndefined(firstDefined(params.text_det_limit_side_len, params.textDetLimitSideLen, defaults.text_det_limit_side_len, defaults.textDetLimitSideLen, config.det.resizeLong)),
			limitType: firstDefined(params.text_det_limit_type, params.textDetLimitType, defaults.text_det_limit_type, defaults.textDetLimitType, config.det.limitType),
			maxSideLimit: toNumberOrUndefined(firstDefined(params.text_det_max_side_limit, params.textDetMaxSideLimit, defaults.text_det_max_side_limit, defaults.textDetMaxSideLimit, config.det.maxSideLimit)),
			thresh: toNumberOrUndefined(firstDefined(params.text_det_thresh, params.textDetThresh, defaults.text_det_thresh, defaults.textDetThresh, config.det.postprocess.thresh)),
			boxThresh: toNumberOrUndefined(firstDefined(params.text_det_box_thresh, params.textDetBoxThresh, defaults.text_det_box_thresh, defaults.textDetBoxThresh, config.det.postprocess.boxThresh)),
			unclipRatio: toNumberOrUndefined(firstDefined(params.text_det_unclip_ratio, params.textDetUnclipRatio, defaults.text_det_unclip_ratio, defaults.textDetUnclipRatio, config.det.postprocess.unclipRatio))
		},
		pipeline: { scoreThresh: Number(firstDefined(params.text_rec_score_thresh, params.textRecScoreThresh, defaults.text_rec_score_thresh, defaults.textRecScoreThresh, 0)) }
	};
}
const DEFAULT_OCR_PIPELINE_CONFIG_TEXT = `
pipeline_name: OCR

text_type: general

use_doc_preprocessor: False
use_textline_orientation: False

SubPipelines:
  DocPreprocessor:
    pipeline_name: doc_preprocessor
    use_doc_orientation_classify: False
    use_doc_unwarping: False
    SubModules:
      DocOrientationClassify:
        module_name: doc_text_orientation
        model_name: PP-LCNet_x1_0_doc_ori
        model_dir: null
      DocUnwarping:
        module_name: image_unwarping
        model_name: UVDoc
        model_dir: null

SubModules:
  TextDetection:
    module_name: text_detection
    model_name: PP-OCRv5_mobile_det
    model_dir: null
    limit_side_len: 64
    limit_type: min
    max_side_limit: 4000
    thresh: 0.3
    box_thresh: 0.6
    unclip_ratio: 1.5
  TextLineOrientation:
    module_name: textline_orientation
    model_name: PP-LCNet_x1_0_textline_ori
    model_dir: null
    batch_size: 6
  TextRecognition:
    module_name: text_recognition
    model_name: PP-OCRv5_mobile_rec
    model_dir: null
    batch_size: 6
    score_thresh: 0.0
`.trimStart();
const DEFAULT_OCR_CONFIG = {
	det: DEFAULT_DET_MODEL_CONFIG,
	rec: DEFAULT_REC_MODEL_CONFIG
};
const DEFAULT_NORMALIZED_PIPELINE_CONFIG = normalizeOcrPipelineConfig(DEFAULT_OCR_PIPELINE_CONFIG_TEXT);
const DEFAULT_MODEL_SELECTION = Object.freeze({ ...DEFAULT_NORMALIZED_PIPELINE_CONFIG.modelSelection });
const DEFAULT_LANG_VERSION_MODEL_SELECTION = Object.freeze({ ...DEFAULT_MODEL_SELECTION });
const OCR_MODEL_ROLES = Object.freeze([{
	assetKey: "det",
	modelRole: "TextDetection",
	selectionKey: "textDetectionModelName",
	nameAliases: ["text_detection_model_name", "textDetectionModelName"],
	assetAliases: [
		"textDetectionModelAsset",
		"text_detection_model_dir",
		"textDetectionModelDir"
	],
	nameLabel: "text detection model name",
	assetLabel: "text detection model asset",
	assetRequirementError: "text_detection_model_dir requires text_detection_model_name."
}, {
	assetKey: "rec",
	modelRole: "TextRecognition",
	selectionKey: "textRecognitionModelName",
	nameAliases: ["text_recognition_model_name", "textRecognitionModelName"],
	assetAliases: [
		"textRecognitionModelAsset",
		"text_recognition_model_dir",
		"textRecognitionModelDir"
	],
	nameLabel: "text recognition model name",
	assetLabel: "text recognition model asset",
	assetRequirementError: "text_recognition_model_dir requires text_recognition_model_name."
}]);
const SUPPORTED_LANG_VERSION_MODELS = /* @__PURE__ */ new Map([
	["ch::PP-OCRv5", DEFAULT_LANG_VERSION_MODEL_SELECTION],
	["chinese_cht::PP-OCRv5", DEFAULT_LANG_VERSION_MODEL_SELECTION],
	["en::PP-OCRv5", DEFAULT_LANG_VERSION_MODEL_SELECTION],
	["japan::PP-OCRv5", DEFAULT_LANG_VERSION_MODEL_SELECTION]
]);
function readAliasedOption(options, aliases, label) {
	let resolved;
	let hasResolvedValue = false;
	for (const alias of aliases) {
		if (!(alias in options)) continue;
		const value = options[alias];
		if (!hasResolvedValue) {
			resolved = value;
			hasResolvedValue = true;
			continue;
		}
		if (value !== resolved) throw new Error(`Conflicting values provided for ${label}: ${aliases.join(", ")}.`);
	}
	return hasResolvedValue ? resolved : void 0;
}
function isLimitType(value) {
	return value === "min" || value === "max";
}
function overlayPipelineRuntimeDefaults(base, explicit) {
	const next = { ...base };
	for (const key of Object.keys(explicit)) {
		const value = explicit[key];
		if (value === void 0) continue;
		next[key] = value;
	}
	return next;
}
function readExplicitPipelineRuntimeDefaults(options) {
	const out = {};
	const limitSide = readAliasedOption(options, ["text_det_limit_side_len", "textDetLimitSideLen"], "text_det_limit_side_len");
	if (limitSide !== void 0) {
		const n = toFiniteNumber(limitSide);
		if (n !== void 0) out.text_det_limit_side_len = n;
	}
	const limitType = readAliasedOption(options, ["text_det_limit_type", "textDetLimitType"], "text_det_limit_type");
	if (limitType !== void 0 && isLimitType(limitType)) out.text_det_limit_type = limitType;
	const maxSide = readAliasedOption(options, ["text_det_max_side_limit", "textDetMaxSideLimit"], "text_det_max_side_limit");
	if (maxSide !== void 0) {
		const n = toFiniteNumber(maxSide);
		if (n !== void 0) out.text_det_max_side_limit = n;
	}
	const detThresh = readAliasedOption(options, ["text_det_thresh", "textDetThresh"], "text_det_thresh");
	if (detThresh !== void 0) {
		const n = toFiniteNumber(detThresh);
		if (n !== void 0) out.text_det_thresh = n;
	}
	const boxThresh = readAliasedOption(options, ["text_det_box_thresh", "textDetBoxThresh"], "text_det_box_thresh");
	if (boxThresh !== void 0) {
		const n = toFiniteNumber(boxThresh);
		if (n !== void 0) out.text_det_box_thresh = n;
	}
	const unclip2 = readAliasedOption(options, ["text_det_unclip_ratio", "textDetUnclipRatio"], "text_det_unclip_ratio");
	if (unclip2 !== void 0) {
		const n = toFiniteNumber(unclip2);
		if (n !== void 0) out.text_det_unclip_ratio = n;
	}
	const recScore = readAliasedOption(options, ["text_rec_score_thresh", "textRecScoreThresh"], "text_rec_score_thresh");
	if (recScore !== void 0) {
		const n = toFiniteNumber(recScore);
		if (n !== void 0) out.text_rec_score_thresh = n;
	}
	return out;
}
function toBatchSizeOption(value) {
	const n = toFiniteNumber(value);
	return n !== void 0 && n >= 1 ? Math.floor(n) : void 0;
}
function readExplicitBatchSizes(options) {
	return {
		det: toBatchSizeOption(readAliasedOption(options, ["textDetectionBatchSize", "text_detection_batch_size"], "textDetectionBatchSize")),
		rec: toBatchSizeOption(readAliasedOption(options, ["textRecognitionBatchSize", "text_recognition_batch_size"], "textRecognitionBatchSize")),
		pipeline: toBatchSizeOption(readAliasedOption(options, [
			"pipelineBatchSize",
			"pipeline_batch_size",
			"batch_size"
		], "pipelineBatchSize"))
	};
}
function mergeNormalizedPipelineConfigWithExplicit(normalized, options) {
	const explicitRuntime = readExplicitPipelineRuntimeDefaults(options);
	const explicitBatch = readExplicitBatchSizes(options);
	const merged = deepClone(normalized);
	merged.runtimeDefaults = overlayPipelineRuntimeDefaults(merged.runtimeDefaults, explicitRuntime);
	if (explicitBatch.det !== void 0) merged.textDetectionBatchSize = explicitBatch.det;
	if (explicitBatch.rec !== void 0) merged.textRecognitionBatchSize = explicitBatch.rec;
	if (explicitBatch.pipeline !== void 0) merged.pipelineBatchSize = explicitBatch.pipeline;
	return merged;
}
function resolveWarningBehavior(value) {
	if (value === "ignore" || value === "error") return value;
	return "warn";
}
function emitPipelineWarnings(warnings, behavior) {
	if (!warnings.length || behavior === "ignore") return;
	if (behavior === "error") throw new Error(warnings.join(" "));
	for (const warning of warnings) console.warn(`[PaddleOCR.js] ${warning}`);
}
function resolveModelAssetByName(_modelRole, modelName) {
	const asset = DEFAULT_MODEL_ASSETS[modelName];
	if (!asset) throw new Error(`Unknown model asset "${modelName}".`);
	return { url: asset.url };
}
function getSelectedModelName(baseSelection, configSelection, explicitSelection, selectionKey) {
	return (explicitSelection == null ? void 0 : explicitSelection[selectionKey]) ?? (configSelection == null ? void 0 : configSelection[selectionKey]) ?? (baseSelection == null ? void 0 : baseSelection[selectionKey]) ?? null;
}
function createResolvedModelSelection(baseSelection, configSelection, explicitSelection) {
	return Object.fromEntries(OCR_MODEL_ROLES.map((role) => [role.selectionKey, getSelectedModelName(baseSelection, configSelection, explicitSelection, role.selectionKey)]));
}
function validateLoadedModelName(modelRole, expectedModelName, configText) {
	if (!expectedModelName) throw new Error(`${modelRole} model selection must define model_name.`);
	const declaredModelName = extractInferenceModelName(configText);
	if (!declaredModelName) throw new Error(`${modelRole} in inference.yml must define model_name.`);
	if (declaredModelName !== expectedModelName) throw new Error(`${modelRole} in inference.yml declares model_name "${declaredModelName}" but requested model_name is "${expectedModelName}".`);
}
function resolveSelectedAsset(assetRole, modelRole, selectionKey, baseSelection, configSelection, explicitSelection, configAssets, explicitAssets) {
	const explicitAsset = explicitAssets == null ? void 0 : explicitAssets[assetRole];
	if (explicitAsset) return explicitAsset;
	const explicitModelName = explicitSelection == null ? void 0 : explicitSelection[selectionKey];
	if (explicitModelName) return resolveModelAssetByName(modelRole, explicitModelName);
	const configAsset = configAssets == null ? void 0 : configAssets[assetRole];
	if (configAsset) return configAsset;
	const configModelName = configSelection == null ? void 0 : configSelection[selectionKey];
	if (configModelName) return resolveModelAssetByName(modelRole, configModelName);
	const baseModelName = baseSelection == null ? void 0 : baseSelection[selectionKey];
	if (baseModelName) return resolveModelAssetByName(modelRole, baseModelName);
	return null;
}
function createOcrAssets(baseSelection, configSelection, explicitSelection, configAssets, explicitAssets) {
	const assets = Object.fromEntries(OCR_MODEL_ROLES.map((role) => [role.assetKey, resolveSelectedAsset(role.assetKey, role.modelRole, role.selectionKey, baseSelection, configSelection, explicitSelection, configAssets, explicitAssets)]));
	if (Object.values(assets).some((asset) => !asset)) throw new Error("OCR model selection must define both detection and recognition models.");
	return assets;
}
function getExplicitModelSelection(options) {
	const modelSelection = {};
	const assets = {};
	let hasAnyOption = false;
	for (const role of OCR_MODEL_ROLES) {
		const modelName = readAliasedOption(options, role.nameAliases, role.nameLabel);
		const asset = readAliasedOption(options, role.assetAliases, role.assetLabel);
		if (modelName !== void 0) {
			modelSelection[role.selectionKey] = modelName;
			hasAnyOption = true;
		}
		if (asset !== void 0) {
			if (modelName === void 0) throw new Error(role.assetRequirementError);
			assets[role.assetKey] = asset;
			hasAnyOption = true;
		}
	}
	if (!hasAnyOption) return null;
	return {
		modelSelection,
		assets
	};
}
function resolveBaseModelSelection(options, includeDefaultBase = false) {
	const ocrVersion = readAliasedOption(options, ["ocrVersion", "ocr_version"], "ocrVersion");
	if (!options.lang && !ocrVersion) return includeDefaultBase ? DEFAULT_MODEL_SELECTION : null;
	const lang = options.lang || "ch";
	const resolvedOcrVersion = ocrVersion || "PP-OCRv5";
	const modelSelection = SUPPORTED_LANG_VERSION_MODELS.get(`${lang}::${resolvedOcrVersion}`);
	if (!modelSelection) throw new Error(`Unsupported lang/ocrVersion combination: lang="${lang}", ocrVersion="${resolvedOcrVersion}".`);
	return modelSelection;
}
function resolveConstructionOptions(options = {}) {
	const pipelineInput = options.pipelineConfig;
	const userPipelineConfig = pipelineInput != null ? normalizeOcrPipelineConfig(pipelineInput) : null;
	const warningBehavior = resolveWarningBehavior(options.unsupportedBehavior);
	const warnings = (userPipelineConfig == null ? void 0 : userPipelineConfig.warnings) || [];
	const baseSelection = resolveBaseModelSelection(options, !userPipelineConfig);
	const configSelection = (userPipelineConfig == null ? void 0 : userPipelineConfig.modelSelection) || null;
	const configAssets = (userPipelineConfig == null ? void 0 : userPipelineConfig.assets) || null;
	const explicitOptions = getExplicitModelSelection(options);
	const explicitSelection = (explicitOptions == null ? void 0 : explicitOptions.modelSelection) || null;
	const explicitAssets = (explicitOptions == null ? void 0 : explicitOptions.assets) || null;
	const resolvedModelSelection = createResolvedModelSelection(baseSelection, configSelection, explicitSelection);
	const assets = createOcrAssets(baseSelection, configSelection, explicitSelection, configAssets, explicitAssets);
	const baseNormalized = userPipelineConfig ?? DEFAULT_NORMALIZED_PIPELINE_CONFIG;
	if (userPipelineConfig) emitPipelineWarnings(warnings, warningBehavior);
	const merged = mergeNormalizedPipelineConfigWithExplicit(baseNormalized, options);
	merged.modelSelection = resolvedModelSelection;
	merged.assets = { ...assets };
	return merged;
}
function resolveBackend(raw) {
	if (raw === "webgpu" || raw === "wasm") return raw;
	return "auto";
}
function normalizeOrtOptions(ortOptions = {}) {
	return {
		backend: resolveBackend(ortOptions.backend),
		...ortOptions.wasmPaths !== void 0 ? { wasmPaths: ortOptions.wasmPaths } : {},
		...ortOptions.numThreads !== void 0 ? { numThreads: ortOptions.numThreads } : {},
		...ortOptions.simd !== void 0 ? { simd: ortOptions.simd } : {},
		...ortOptions.proxy !== void 0 ? { proxy: ortOptions.proxy } : {}
	};
}
function resolveWorkerOptions(workerOption) {
	if (!workerOption) return {
		enabled: false,
		createWorker: null
	};
	if (workerOption === true) return {
		enabled: true,
		createWorker: null
	};
	if (typeof workerOption === "object") {
		const opts = workerOption;
		return {
			enabled: true,
			createWorker: typeof opts.createWorker === "function" ? opts.createWorker : null
		};
	}
	throw new Error("worker must be a boolean or an options object.");
}
function resolvePaddleOCROptions(options = {}) {
	return {
		pipelineConfig: resolveConstructionOptions(options),
		ortOptions: normalizeOrtOptions(options.ortOptions || {})
	};
}
function cloneDefaultOcrConfig() {
	return deepClone(DEFAULT_OCR_CONFIG);
}
function noopEnsureServedFromHttp() {}
function getResolvedAssets(assets) {
	const det = assets == null ? void 0 : assets.det;
	const rec = assets == null ? void 0 : assets.rec;
	if (!det || typeof det !== "object" || !rec || typeof rec !== "object") throw new Error("PaddleOCRCore requires pre-resolved detection and recognition asset descriptors.");
	return {
		det,
		rec
	};
}
var OcrPipelineRunner = class {
	constructor(options) {
		__publicField(this, "options");
		__publicField(this, "modelConfig");
		__publicField(this, "runtimeDefaults");
		__publicField(this, "cv");
		__publicField(this, "ort");
		__publicField(this, "detModel");
		__publicField(this, "recModel");
		__publicField(this, "webgpuState");
		__publicField(this, "pipelineConfig");
		__publicField(this, "lastInitializationSummary");
		__publicField(this, "ensureServedFromHttp");
		__publicField(this, "sourceToMat");
		this.options = options;
		this.modelConfig = cloneDefaultOcrConfig();
		this.pipelineConfig = options.pipelineConfig;
		this.runtimeDefaults = { ...options.pipelineConfig.runtimeDefaults };
		this.cv = null;
		this.ort = null;
		this.detModel = null;
		this.recModel = null;
		this.webgpuState = {
			available: false,
			reason: ""
		};
		this.lastInitializationSummary = null;
		this.ensureServedFromHttp = options.ensureServedFromHttp || noopEnsureServedFromHttp;
		this.sourceToMat = options.sourceToMat;
	}
	async initialize() {
		this.ensureServedFromHttp();
		const start = nowMs();
		const { cv } = await initOpenCvRuntime();
		this.cv = cv;
		const { ort, webgpuState, backend } = await initOrtRuntime(this.options.ortOptions || {});
		this.ort = ort;
		this.webgpuState = webgpuState;
		const assets = getResolvedAssets(this.pipelineConfig.assets);
		const fetchImpl = this.options.fetch || fetch;
		const loadedAssets = await Promise.all([loadModelAsset(assets.det, fetchImpl), loadModelAsset(assets.rec, fetchImpl)]);
		validateLoadedModelName("TextDetection", this.pipelineConfig.modelSelection.textDetectionModelName, loadedAssets[0].configText);
		validateLoadedModelName("TextRecognition", this.pipelineConfig.modelSelection.textRecognitionModelName, loadedAssets[1].configText);
		await this.disposeModelsOnly();
		const detBatchSize = this.pipelineConfig.textDetectionBatchSize;
		const recBatchSize = this.pipelineConfig.textRecognitionBatchSize;
		const [detModel, recModel] = await Promise.all([createDetModel({
			ort: this.ort,
			modelBytes: loadedAssets[0].modelBytes,
			configText: loadedAssets[0].configText,
			backend,
			webgpuState,
			batchSize: detBatchSize
		}), createRecModel({
			ort: this.ort,
			modelBytes: loadedAssets[1].modelBytes,
			configText: loadedAssets[1].configText,
			backend,
			webgpuState,
			batchSize: recBatchSize
		})]);
		this.detModel = detModel;
		this.recModel = recModel;
		this.modelConfig = {
			det: this.detModel.config,
			rec: this.recModel.config
		};
		const elapsed = nowMs() - start;
		this.lastInitializationSummary = {
			backend,
			webgpuAvailable: webgpuState.available,
			detProvider: this.detModel.provider,
			recProvider: this.recModel.provider,
			assets: loadedAssets.map((asset) => asset.download),
			elapsedMs: elapsed,
			pipelineConfigWarnings: this.pipelineConfig.warnings
		};
		return this.lastInitializationSummary;
	}
	getInitializationSummary() {
		return this.lastInitializationSummary;
	}
	getModelConfig() {
		return this.modelConfig;
	}
	async predict(input, params = {}) {
		var _a, _b, _c;
		if (!this.sourceToMat) throw new Error("PaddleOCR source adapter is not configured.");
		if (!this.detModel || !this.recModel || !this.cv || !this.ort) await this.initialize();
		const cv = this.cv;
		const detModel = this.detModel;
		const recModel = this.recModel;
		if (!cv || !detModel || !recModel) throw new Error("Initialization did not complete. Call initialize() first.");
		const sources = Array.isArray(input) ? input : [input];
		const sourceToMat2 = this.sourceToMat;
		const sourceBatches = chunkArray(sources, Math.max(1, Math.floor(this.pipelineConfig.pipelineBatchSize) || 1));
		const totalStart = nowMs();
		const resolved = getOcrRuntimeParams(this.modelConfig, this.runtimeDefaults, params);
		let sumDetMs = 0;
		let sumRecMs = 0;
		const partials = [];
		for (const batchSources of sourceBatches) {
			const sourceImages = await Promise.all(batchSources.map((source) => Promise.resolve(sourceToMat2(cv, source))));
			try {
				const detStart = nowMs();
				const detResults = await detModel.predict(cv, sourceImages.map((s) => s.mat), resolved.det);
				sumDetMs += nowMs() - detStart;
				const recStart = nowMs();
				const perImageItems = [];
				for (let imgIdx = 0; imgIdx < detResults.length; imgIdx += 1) {
					const detBoxes = ((_a = detResults[imgIdx]) == null ? void 0 : _a.boxes) ?? [];
					const cropMats = [];
					for (let boxIdx = 0; boxIdx < detBoxes.length; boxIdx += 1) cropMats.push(cropByPoly(cv, sourceImages[imgIdx].mat, detBoxes[boxIdx].poly));
					try {
						const recResults = cropMats.length ? await recModel.predict(cv, cropMats) : [];
						const items = [];
						for (let boxIdx = 0; boxIdx < recResults.length; boxIdx += 1) {
							const rec = recResults[boxIdx];
							if (rec.text && rec.score >= resolved.pipeline.scoreThresh) items.push({
								poly: detBoxes[boxIdx].poly,
								text: rec.text,
								score: rec.score
							});
						}
						perImageItems.push(items);
					} finally {
						for (const mat of cropMats) mat.delete();
					}
				}
				sumRecMs += nowMs() - recStart;
				for (let i = 0; i < sourceImages.length; i += 1) {
					const sourceImage = sourceImages[i];
					const detBoxes = ((_b = detResults[i]) == null ? void 0 : _b.boxes) ?? [];
					const items = perImageItems[i] ?? [];
					partials.push({
						image: {
							width: sourceImage.width,
							height: sourceImage.height
						},
						items,
						detectedBoxes: detBoxes.length,
						recognizedCount: items.length
					});
				}
			} finally {
				for (const sourceImage of sourceImages) sourceImage.dispose();
			}
		}
		const totalElapsed = nowMs() - totalStart;
		const requestedBackend = ((_c = this.options.ortOptions) == null ? void 0 : _c.backend) ?? "auto";
		return partials.map((p) => ({
			image: p.image,
			items: p.items,
			metrics: {
				detMs: sumDetMs,
				recMs: sumRecMs,
				totalMs: totalElapsed,
				detectedBoxes: p.detectedBoxes,
				recognizedCount: p.recognizedCount
			},
			runtime: {
				requestedBackend,
				detProvider: detModel.provider,
				recProvider: recModel.provider,
				webgpuAvailable: this.webgpuState.available
			}
		}));
	}
	async disposeModelsOnly() {
		var _a, _b;
		await Promise.all([(_a = this.detModel) == null ? void 0 : _a.dispose(), (_b = this.recModel) == null ? void 0 : _b.dispose()]);
		this.detModel = null;
		this.recModel = null;
	}
	async dispose() {
		await this.disposeModelsOnly();
	}
};
const REQUEST_KIND = "worker-transport-request";
const RESPONSE_KIND = "worker-transport-response";
function createTransportRequest(type, payload, requestId) {
	return {
		kind: REQUEST_KIND,
		type,
		payload,
		requestId
	};
}
function isTransportResponse(message) {
	return typeof message === "object" && message !== null && "kind" in message && message.kind === RESPONSE_KIND;
}
function deserializeError(error) {
	const normalized = error || {};
	const instance = new Error(normalized.message || "Unknown worker error.");
	instance.name = normalized.name || "Error";
	if (normalized.stack) instance.stack = normalized.stack;
	return instance;
}
var WorkerTransportClient = class {
	constructor(workerOptions = {}) {
		__publicField(this, "workerOptions");
		__publicField(this, "worker");
		__publicField(this, "pending");
		__publicField(this, "nextRequestId");
		__publicField(this, "disposed");
		this.workerOptions = workerOptions;
		this.worker = null;
		this.pending = /* @__PURE__ */ new Map();
		this.nextRequestId = 1;
		this.disposed = false;
	}
	ensureActive() {
		if (this.disposed) throw new Error("Worker transport client has been disposed.");
	}
	ensureWorker() {
		this.ensureActive();
		if (this.worker) return this.worker;
		const workerFactory = this.workerOptions.createWorker;
		if (typeof workerFactory !== "function") throw new Error("Worker transport client requires a createWorker() factory.");
		const worker = workerFactory();
		worker.onmessage = (event) => {
			const message = event.data;
			if (!isTransportResponse(message)) return;
			const pending = this.pending.get(message.requestId);
			if (!pending) return;
			this.pending.delete(message.requestId);
			if (message.status === "success") pending.resolve(message.payload);
			else pending.reject(deserializeError(message.error));
		};
		worker.onerror = (event) => {
			const error = new Error(event.message || "OCR worker failed.");
			for (const pending of this.pending.values()) pending.reject(error);
			this.pending.clear();
		};
		this.worker = worker;
		return worker;
	}
	request(type, payload, transferables = []) {
		const worker = this.ensureWorker();
		const requestId = this.nextRequestId;
		this.nextRequestId += 1;
		return new Promise((resolve, reject) => {
			this.pending.set(requestId, {
				resolve,
				reject
			});
			worker.postMessage(createTransportRequest(type, payload, requestId), transferables);
		});
	}
	disposeWorker() {
		if (!this.worker) return;
		this.worker.terminate();
		this.worker = null;
	}
	dispose() {
		if (this.disposed) return;
		this.disposed = true;
		for (const pending of this.pending.values()) pending.reject(/* @__PURE__ */ new Error("Worker transport client has been disposed."));
		this.pending.clear();
		this.disposeWorker();
	}
};
function createWorkerTransportClient(workerOptions) {
	return new WorkerTransportClient(workerOptions);
}
function createDefaultWorker() {
	if (typeof Worker !== "function") throw new Error("worker mode requires Web Worker support in this environment.");
	return (() => {
		const _w = new URL("./assets/worker-entry-Dtffs1su.js", import.meta.url);
		return new Worker(_w, { type: "module" });
	})();
}
var WorkerBackedPaddleOCR = class {
	constructor(options, transportClient) {
		__publicField(this, "options");
		__publicField(this, "lastInitializationSummary");
		__publicField(this, "modelConfig");
		__publicField(this, "transportClient");
		__publicField(this, "initPromise");
		__publicField(this, "disposed");
		this.options = options;
		this.lastInitializationSummary = null;
		this.modelConfig = cloneDefaultOcrConfig();
		this.transportClient = transportClient;
		this.initPromise = null;
		this.disposed = false;
	}
	ensureActive() {
		if (this.disposed) throw new Error("PaddleOCR worker instance has been disposed.");
	}
	async initialize() {
		this.ensureActive();
		if (this.lastInitializationSummary) return this.lastInitializationSummary;
		if (!this.initPromise) {
			const ortOpts = this.options.ortOptions || {};
			if (ortOpts["wasmPaths"] === void 0 && true) console.warn("[PaddleOCR.js] Worker mode: ortOptions.wasmPaths is not set — falling back to CDN (%s). For version consistency between main thread and worker, set ortOptions.wasmPaths to the path where your bundler outputs the onnxruntime-web WASM files (e.g. ortOptions: { wasmPaths: \"/assets/\" }).", "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/");
			const wasmCdnFallback = ortOpts["wasmPaths"] === void 0 && true ? { wasmPaths: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/" } : {};
			this.initPromise = this.transportClient.request("init", { options: {
				...this.options,
				ortOptions: {
					...ortOpts,
					...wasmCdnFallback,
					disableWasmProxy: true
				}
			} }).then((rawPayload) => {
				const payload = rawPayload;
				this.lastInitializationSummary = payload.summary;
				this.modelConfig = payload.modelConfig;
				return this.lastInitializationSummary;
			}).catch((error) => {
				this.initPromise = null;
				this.transportClient.dispose();
				throw error;
			});
		}
		return this.initPromise;
	}
	getInitializationSummary() {
		return this.lastInitializationSummary;
	}
	getModelConfig() {
		return this.modelConfig;
	}
	async predict(input, params = {}) {
		this.ensureActive();
		await this.initialize();
		const sources = Array.isArray(input) ? input : [input];
		const payloads = await Promise.all(sources.map((source) => sourceToWorkerPayload(source)));
		const combinedPayloads = payloads.map((p) => p.payload);
		const combinedTransferables = payloads.flatMap((p) => p.transferables);
		return this.transportClient.request("predict", {
			sources: combinedPayloads,
			params
		}, combinedTransferables);
	}
	async dispose() {
		if (this.disposed) return;
		this.disposed = true;
		try {
			await this.transportClient.request("dispose", {});
		} catch {}
		this.transportClient.dispose();
	}
};
function createWorkerBackedPaddleOCR(options, workerOptions = {}) {
	return new WorkerBackedPaddleOCR(options, createWorkerTransportClient({
		...workerOptions,
		createWorker: workerOptions.createWorker || createDefaultWorker
	}));
}
var PaddleOCR = class PaddleOCR extends OcrPipelineRunner {
	constructor(options) {
		super({
			...options,
			ensureServedFromHttp,
			sourceToMat
		});
	}
	static async create(options = {}) {
		const workerOptions = resolveWorkerOptions(options.worker);
		if (workerOptions.enabled && options.fetch) throw new Error("worker mode does not support a custom fetch implementation.");
		const resolvedOptions = resolvePaddleOCROptions(options);
		const instance = workerOptions.enabled ? createWorkerBackedPaddleOCR(resolvedOptions, { createWorker: workerOptions.createWorker ?? void 0 }) : new PaddleOCR({
			...resolvedOptions,
			fetch: options.fetch
		});
		if (options.initialize !== false) await instance.initialize();
		return instance;
	}
};
//#endregion
export { PaddleOCR };

//# sourceMappingURL=paddleocr-browser.js.map