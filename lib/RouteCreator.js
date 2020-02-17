"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initRoutes = initRoutes;
exports.getPath = getPath;
exports.getRoute = getRoute;
exports.pathOptions = pathOptions;
exports.SYMBOLS = exports.METHOD = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

//Key represents :  protocol used in route (i.e. GET)
var PROTOCOL = Symbol("PROTOCOL"); //Key represents : if current path segment is dynamically supplied (i.e. generated id)

var DYNAMIC = Symbol("DYNAMIC"); //Key represents : [private usage] a part of the route tree section (non leaf)

var ROUTE = Symbol("ROUTE"); //Key represents : [optional] by default route path is taken by key name, unless NAME is given.

var NAME = Symbol("NAME");
var QUERY = Symbol("QUERY");
var BODY = Symbol("BODY");
var RESPONSE = Symbol("RESPONSE");
var SYMBOLS = {
  PROTOCOL: PROTOCOL,
  DYNAMIC: DYNAMIC,
  ROUTE: ROUTE,
  NAME: NAME,
  QUERY: QUERY,
  BODY: BODY,
  RESPONSE: RESPONSE
};
exports.SYMBOLS = SYMBOLS;
var METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};
exports.METHOD = METHOD;

var IS_OBJ = function IS_OBJ(e) {
  return e !== null && _typeof(e) === "object";
};

var IS_STR = function IS_STR(e) {
  return typeof e === 'string' || e instanceof String;
};

var IS_UNDEF = function IS_UNDEF(e) {
  return typeof e === 'undefined';
};

function warnLog() {
  var _console;

  (_console = console).warn.apply(_console, arguments);
}

function errorLog() {
  var _console2;

  (_console2 = console).error.apply(_console2, arguments);
}

function getQueryString(queryObject) {
  if (!queryObject) return "";
  var OPEN_BRACE = '[';
  var QUERY_DELIM = '?';
  var CLOSE_BRACE = ']';
  var PARAM_DELIM = '=';
  var PARAN_GROUP_DELIM = "&";

  var getQueryStringRec = function getQueryStringRec(queryObject, prefix) {
    var queryString = [];

    for (var key in queryObject) {
      if (queryObject.hasOwnProperty(key)) {
        var curValue = queryObject[key];
        var curStr = prefix ? prefix + OPEN_BRACE + key + CLOSE_BRACE : key;
        var encodedStr = IS_OBJ(curValue) ? getQueryStringRec(curValue, curStr) : encodeURIComponent(curStr) + PARAM_DELIM + encodeURIComponent(curValue);
        queryString.push(encodedStr);
      }
    }

    return queryString.join(PARAN_GROUP_DELIM);
  };

  return QUERY_DELIM + getQueryStringRec(queryObject);
}

function pathOptions(pathArgs, queryParams, bodyParams) {
  return {
    pathArgs: pathArgs,
    queryParams: queryParams,
    bodyParams: bodyParams
  };
}
/**
 * Represents a Single route 
 * used to get full route path and path parameters
 */


var Route =
/*#__PURE__*/
function () {
  function Route(name) {
    var protocol = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : METHOD.GET;
    var query = arguments.length > 2 ? arguments[2] : undefined;
    var fatherRoute = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var isDynamic = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    var dynamicKey = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
    var pathParts = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : [];

    _classCallCheck(this, Route);

    this.name = name;
    this.dynamicKey = dynamicKey;
    this.query = query;
    this.queryParams = undefined;
    this.pathArgs = undefined;
    this.isDynamic = isDynamic;
    this.fatherRoute = fatherRoute;
    this.protocol = protocol;
    this.dynamicCount = isDynamic ? 1 : 0;
    this.pathParts = pathParts;

    if (this.fatherRoute) {
      this.dynamicCount += this.fatherRoute.dynamicCount;
    }

    this.body = null;
  }
  /**
   * get current route path with the supplied dynamic parts
   * @param  {...String} args path dynamic parts
   */


  _createClass(Route, [{
    key: "path",
    value: function path() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var DYNAMIC_SYM = ":";
      var DELIM = "/";
      var fPath = "";
      var pathArgLength = 0;
      var pathArgs = options.pathArgs,
          queryParams = options.queryParams,
          isMock = options.isMock;
      pathArgs = pathArgs || this.pathArgs;

      if (pathArgs) {
        if (Array.isArray(pathArgs)) {
          pathArgLength = pathArgs.length;
        } else if (IS_OBJ(pathArgs)) {
          pathArgLength = Object.keys(pathArgs).length;
        } else {
          pathArgs = [pathArgs];
          pathArgLength = pathArgs.length;
        }
      }

      if (pathArgLength != this.dynamicCount && !isMock) {
        //ERROR
        errorLog("WARNING : received wrong amount of path arguments for ", this.name, " [got:", pathArgLength, " expected:", this.dynamicCount, "]");
      }

      if (this.fatherRoute) {
        var fatherArgs = pathArgs;
        if (Array.isArray(pathArgs)) fatherArgs = pathArgs.slice(0, this.fatherRoute.dynamicCount);else if (IS_OBJ(pathArgs) && this.dynamicKey in pathArgs) {
          fatherArgs = Object.assign({}, pathArgs);
          delete fatherArgs[this.dynamicKey];
        }
        fPath = this.fatherRoute.path(Object.assign({
          isMock: isMock
        }, pathOptions(fatherArgs)));
      }

      var name = this.name;

      if (this.isDynamic) {
        if (isMock) {
          if (IS_STR(this.isDynamic)) this.name = this.isDynamic;
          var uniqueName = DYNAMIC_SYM + this.name;
          name = uniqueName;
        } else if (Array.isArray(pathArgs)) {
          name = pathArgs[this.dynamicCount - 1];
        } else if (IS_OBJ(pathArgs)) {
          if (!this.dynamicKey || !IS_STR(this.dynamicKey)) {
            errorLog("Did not supply key for the path part : [", name, "]");
          } else {
            if (IS_UNDEF(pathArgs[this.dynamicKey])) {
              errorLog("Need to supply in options value for key [".concat(this.dynamicKey, "] for path part ").concat(name));
            } else {
              name = pathArgs[this.dynamicKey];
            }
          }
        }
      }

      var qParams = queryParams || this.queryParams;

      if (qParams && !Array.isArray(qParams)) {
        qParams = [qParams];
      }

      var qParamStr = qParams ? getQueryString(this.query.apply(this, _toConsumableArray(qParams))) : "";
      return fPath + DELIM + name + qParamStr;
    }
  }, {
    key: "setQueryParams",
    value: function setQueryParams() {
      for (var _len = arguments.length, queryParams = new Array(_len), _key = 0; _key < _len; _key++) {
        queryParams[_key] = arguments[_key];
      }

      this.queryParams = queryParams;
    }
  }, {
    key: "setBody",
    value: function setBody(data) {
      if (this.protocol === METHOD.GET) {
        warnLog("body of GET request is mostly ignored, are you sure you meant to set body ?");
      }

      this.body = data;
    }
  }, {
    key: "setPathArgs",
    value: function setPathArgs(pathArgs) {
      this.pathArgs = pathArgs;
    }
  }]);

  return Route;
}();
/**
 * return true if given value is an object
 * @param {any} value value to be checked if object
 */


function isObject(value) {
  return value && _typeof(value) === 'object' && value.constructor === Object;
}
/**
 * Adds Route object to the given route tree
 * @param {*} data route tree
 * @param {*} name name of current route part
 * @param {*} prefix Route object representing father route
 */


function initRoutes(data) {
  var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var prefix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var prevNames = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var pathParts = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
  var curRouteGetter = null;

  if (name) {
    if (data[NAME]) {
      name = data[NAME];
    } else {
      data[NAME] = name;
    }

    if (data[DYNAMIC]) {
      var curNameCount = 0;

      if (prevNames[name] !== undefined) {
        curNameCount = prevNames[name] + 1;
        name = name + curNameCount;
      }

      prevNames = Object.assign({}, prevNames, _defineProperty({}, name, curNameCount));
      data[NAME] = name;
    }

    var defaultQuery = function defaultQuery() {
      for (var _len2 = arguments.length, qParam = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        qParam[_key2] = arguments[_key2];
      }

      if (qParam.length > 0) {
        errorLog("No query params were defined, yet received following params ", JSON.stringify(qParam, null, 2));
      }

      return null;
    };

    var query = data[QUERY] || defaultQuery;

    if (typeof query !== "function") {
      var errorMessage = "Invalid type of QUERY supplied, expected function got :".concat(_typeof(query));
      errorLog(errorMessage);

      query = function query() {
        errorLog("Ignoring query:\n", errorMessage);
      };
    }

    var protocol = data[PROTOCOL] || METHOD.GET;
    data[PROTOCOL] = protocol;
    var isDynamic = !!data[DYNAMIC];
    pathParts.push(data[NAME]);

    curRouteGetter = function curRouteGetter() {
      return new Route(name, protocol, query, prefix, isDynamic, data[DYNAMIC], pathParts);
    };

    Object.defineProperty(data, ROUTE, {
      get: curRouteGetter
    }); //data[ROUTE] = curRouteGetter;
  }

  Object.keys(data).forEach(function (key) {
    if (isObject(data[key])) {
      initRoutes(data[key], key, curRouteGetter && curRouteGetter(), prevNames, _toConsumableArray(pathParts));
    }
  });
}

function getRoute(treePath) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var pathArgs = options.pathArgs,
      queryParams = options.queryParams,
      bodyParams = options.bodyParams;
  var route = treePath[ROUTE];
  if (bodyParams) route.setBody(bodyParams);

  if (queryParams) {
    if (!Array.isArray(queryParams)) queryParams = [queryParams];
    route.setQueryParams.apply(route, _toConsumableArray(queryParams));
  }

  if (pathArgs) route.setPathArgs(pathArgs);
  return route;
}

function getPath(treePath) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var route = getRoute(treePath, options);
  return route.path();
}