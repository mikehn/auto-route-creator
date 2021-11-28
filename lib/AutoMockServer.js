"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMockData = getMockData;
exports.setMockData = setMockData;
exports.autoMock = void 0;

var _AppMethod;

function _readOnlyError(name) { throw new Error("\"" + name + "\" is read-only"); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

//require("@babel/register")({ presets: ["@babel/env"] }); // for transpiling es6 and beyond
//let { Routes, getRoute } = require("../src/services/network/Routes");
//let { Routes } = require("./MockTemplate");
var _require = require("./RouteCreator"),
    SYMBOLS = _require.SYMBOLS,
    METHOD = _require.METHOD,
    getRoute = _require.getRoute;

var DEFAULT_RES_MARKER = Symbol("DEFAULT_RES_MARKER");

var faker = require("faker");

var fs = require("fs");

var express = require("express");

var app = express();

var log = function log() {
  var _console;

  (_console = console).log.apply(_console, arguments);
};

var DELETE = METHOD.DELETE,
    GET = METHOD.GET,
    POST = METHOD.POST,
    PUT = METHOD.PUT;
var AppMethod = (_AppMethod = {}, _defineProperty(_AppMethod, DELETE, "delete"), _defineProperty(_AppMethod, GET, "get"), _defineProperty(_AppMethod, POST, "post"), _defineProperty(_AppMethod, PUT, "put"), _AppMethod);
var EMPTY_RES = "No response definition for this route";
var PROTOCOL = "protocol";
var PORT = 3002;
var DEFAULT_DATA_SET_SIZE = 5;
var TYPES = {
  BOOL: "bool",
  NUMBER: "number",
  STRING: "STRING"
};

var IDENT = function IDENT(a) {
  return a;
};

var dKeyValues = {};
var dKeyObj = {};
var mockData = {};
var routeMeta = {};
var dRoutes = {};
var dataSize = null;
var defaultRes = null;

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initDRoutes(routes, baseRoute) {
  //if (!!routes[SYMBOLS.DYNAMIC]) {
  var proto = routes[SYMBOLS.PROTOCOL];
  var isArray = Array.isArray(dRoutes[baseRoute]);

  if (baseRoute.includes(":") && (!dRoutes[baseRoute] || !isArray || !dRoutes[baseRoute].includes(proto))) {
    if (isArray) {
      dRoutes[baseRoute].push(proto);
    } else {
      dRoutes[baseRoute] = [proto];
    }
  } //}


  var rKeys = Object.keys(routes); //let currentRouteTree=routes;

  rKeys.forEach(function (key) {
    var route = routes[key];
    var dKey = route[SYMBOLS.DYNAMIC];
    var routeName = !!dKey ? ":" + dKey : getRoute(route).name;
    initDRoutes(routes[key], baseRoute + "/" + routeName);
  });
}

function basicConfiguration(app, routes) {
  app.use(express.json()); // for parsing application/json

  app.use(express.urlencoded({
    extended: true
  })); // for parsing application/x-www-form-urlencoded
  //Logger

  app.use("/", function (req, res, next) {
    log("Req:[".concat(req.method, "]:").concat(req.url));
    next();
  }); // Init Dynamic routes

  initDRoutes(routes, "");
}

function addDynamicValues(val, req, proto, resOverride) {
  var filter = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : IDENT;

  if (typeof val === 'function') {
    return val(req, mockData, proto, resOverride);
  } else {
    if (isObject(val) || Array.isArray(val)) {
      Object.keys(val).forEach(function (key) {
        val[key] = addDynamicValues(val[key], req, proto, IDENT);
      });
    }
  }

  return filter(val, req);
}

function initPath(proto, req, res) {
  var url = req.baseUrl + req.path;

  if (!mockData[url] || mockData[url][proto].data == DEFAULT_RES_MARKER) {
    if (defaultRes) {
      defaultRes(req, res);
    } else {
      res.send(EMPTY_RES);
    }

    return;
  }

  if (proto == METHOD.DELETE) {}

  if (proto == METHOD.PUT) {
    mockData[url][METHOD.GET] = {
      data: req.body
    };
  }

  var mockObj = mockData[url][proto];
  var isResponseOverride = false;

  var resOverride = function resOverride() {
    isResponseOverride = true;
    return res;
  };

  var jsonRes = addDynamicValues(mockObj.data, req, proto, resOverride, mockObj.filter);

  if (!isResponseOverride) {
    res.json(jsonRes);
  }
}

function initServerPaths(app) {
  //console.log(mockData);
  Object.keys(dRoutes).forEach(function (route) {
    var protocolStrList = dRoutes[route];
    protocolStrList.forEach(function (proto) {
      app[AppMethod[proto]](route, function (req, res) {
        initPath(proto, req, res);
      });
    });
  });
  Object.keys(mockData).forEach(function (url) {
    Object.keys(mockData[url]).forEach(function (proto) {
      var protocolStr = AppMethod[proto];
      app[protocolStr](url, function (req, res) {
        initPath(proto, req, res);
      });
    }); //let childRoute = route[key];
    //let protocol = childRoute[SYMBOLS.PROTOCOL];
    //let url = childRoute[SYMBOLS.ROUTE].path({ isMock: true });
    //initServerPaths(childRoute, app);
  });
}
/**
 * @param {Object} Options {port,dataSize,defaultRes:(req,res)=>{}}
 */


function startMock(routes) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var app = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : app;
  var port = options.port || PORT;
  dataSize = options.defaultListSize || DEFAULT_DATA_SET_SIZE;
  defaultRes = options.defaultRes;
  updateRoutesData(routes);
  basicConfiguration(app, routes);
  initServerPaths(app);
  app.listen(port, function () {
    return log("Mock server on port ".concat(port, "!"));
  });
}

function isString(value) {
  return typeof value === "string";
}

function isObject(value) {
  return value && _typeof(value) === "object" && value.constructor === Object;
}

function isBoolean(value) {
  return typeof value === "boolean";
}

function logError() {
  var _console2;

  (_console2 = console).error.apply(_console2, arguments);
}

function getStrParts(str) {
  var DELIM = ":";
  if (str === "") return "";
  if (!str) return str;

  if (!str || str.length == 0) {
    logError("received wrong string template expected <name>:<type>");
  }

  var parts = str.split(DELIM);

  if (parts.length > 2) {
    logError("received wrong string template " + str + " expected <name>:<type>");
  }

  if (parts.length == 1) {
    log(parts[0], " no type was supplied assuming string");
    parts = [parts[0], "string"];
  }

  return {
    name: parts[0],
    type: parts[1]
  };
}

function dataParser(data, params) {
  if (typeof data === 'function') {
    return data(params);
  } else if (isObject(data)) {
    return updateObjectData(data, params);
  } else if (Array.isArray(data)) {
    return updateArrayData(data, params);
  } else if (isString(data)) {
    return getValueFromString(data, params);
  } else {
    //logError("template only supports array, object or string but got", data);
    return null;
  }
}

function convertValue(data, type) {
  switch (type) {
    case TYPES.NUMBER:
      return Number(data);

    case TYPES.STRING:
      return "" + data;

    case TYPES.BOOL:
      return "".concat(data) === "true";
  }

  return data;
}

function getValueFromString(str, params) {
  var _getStrParts = getStrParts(str),
      type = _getStrParts.type,
      name = _getStrParts.name;

  if (name === "") return "";
  if (!name) return name;

  if (name[0] == '[' && name[name.length - 1] == ']') {
    name = str.substring(1, name.length - 1);
    var parts = name.split("|");
    var randInt = getRandomInt(0, Math.max(100, parts.length));
    name = parts[randInt % parts.length];
  }

  return convertValue(faker.fake(name), type);
}

function updateArrayData(arr, params) {
  var TEMPLATE_LOC = 0;
  if (!arr || arr.length == 0) return [];
  var template = arr[TEMPLATE_LOC];
  var data = new Array(dataSize);

  for (var i = 0; i < data.length; ++i) {
    data[i] = dataParser(template, params);
  }

  return data;
}

function updateObjectData(obj, params) {
  var res = {};
  Object.keys(obj).forEach(function (key) {
    res[key] = dataParser(obj[key], params);
  });
  return res;
}

function getAllValuesBykey(data, key) {
  var res = [];

  if (Array.isArray(data)) {
    data.forEach(function (val) {
      if (isObject(val)) {
        res.push(val[key]);
      } else {
        res.push(val);
      }
    });
    return res;
  }

  if (isObject(data)) {
    if (data[key]) {
      return data[key];
    }

    var allKeys = Object.keys(data);
    var curRes;

    for (var i = 0; i < allKeys.length; ++i) {
      curRes = getAllValuesBykey(data[allKeys[i]], key); // if (curRes.length < res) {
      // 	res = curRes;
      // }

      if (curRes && curRes.length > 0) res.push.apply(res, _toConsumableArray(curRes));
    }
  }

  return {
    dkey: res,
    dkObj: data
  };
}

function addMockData(rUrl, routeProtocol, data, route) {
  if (!mockData[rUrl]) {
    mockData[rUrl] = {};
  }

  mockData[rUrl][routeProtocol] = {
    data: data
  };
  mockData[rUrl][routeProtocol].filter = route[SYMBOLS.RESPONSE] && route[SYMBOLS.RESPONSE].filter || IDENT;
  routeMeta[rUrl] = routeMeta[rUrl] || {};
  if (!routeMeta[rUrl][PROTOCOL]) routeMeta[rUrl][PROTOCOL] = [];
  routeMeta[rUrl][PROTOCOL].push(routeProtocol);
}

function updateDataSet(route, baseRoute) {
  var routeProtocol = route[SYMBOLS.PROTOCOL];

  if (!routeProtocol) {
    routeProtocol = (_readOnlyError("routeProtocol"), METHOD.GET);
  }

  var routeObj = getRoute(route);
  var dId = routeObj.name;
  var pathList = ["".concat(baseRoute, "/").concat(dId)];

  if (!!route[SYMBOLS.DYNAMIC]) {
    dId = isString(route[SYMBOLS.DYNAMIC]) ? route[SYMBOLS.DYNAMIC] : dId;
    dId = "".concat(baseRoute, "|").concat(dId);
    if (dKeyValues[dId]) pathList = dKeyValues[dId].map(function (id) {
      return "".concat(baseRoute, "/").concat(id);
    });
  }

  var routRes = route[SYMBOLS.RESPONSE];

  if (!routRes) {
    pathList.forEach(function (path) {
      addMockData(path, routeProtocol, DEFAULT_RES_MARKER, route);
    });
    return pathList;
  } //let storageKey = routRes.mockId || routeObj.path({ isMock: true });
  //let dynamicRefs = routRes.dynamicRefs || [];


  var dynamicKeys = routRes.dynamicKeys || [];

  if (routRes.template) {
    pathList.forEach(function (path) {
      var data = dataParser(routRes.template, path);
      dynamicKeys.forEach(function (key) {
        var _getStrParts2 = getStrParts(key),
            name = _getStrParts2.name,
            objKey = _getStrParts2.type;

        var _getAllValuesBykey = getAllValuesBykey(data, objKey),
            dkey = _getAllValuesBykey.dkey,
            dkObj = _getAllValuesBykey.dkObj; //log("D>",path,key,dkey)


        dKeyValues["".concat(path, "|").concat(name)] = dkey; //TODO:M: extract to func

        dKeyObj[name] = dkObj;
      });
      addMockData(path, routeProtocol, data, route);
    });
  }

  return pathList;
}

function updateRoutesData(routes) {
  //let routes = { "/": routes2 };
  var pathKey = "";
  var rKeys = Object.values(routes).map(function (val) {
    return {
      val: val,
      pathKey: pathKey
    };
  }); //let rKeys = [{ val: routes, pathKey: "/" }];

  var paths = {};
  routes[SYMBOLS.PROTOCOL] = routes[SYMBOLS.PROTOCOL] || GET; //routes[SYMBOLS.NAME] = "/";

  routes[SYMBOLS.ROUTE] = {
    name: "/"
  };
  updateDataSet(routes, "");

  while (rKeys.length > 0) {
    var ckey = rKeys.shift();
    var curPaths = updateDataSet(ckey.val, ckey.pathKey);
    paths[ckey.pathKey] = curPaths;
    var children = Object.values(ckey.val);
    if (!children) continue; //if (curPaths.length >= 1) {

    for (var i = 0; i < children.length; i++) {
      for (var j = 0; j < curPaths.length; j++) {
        rKeys.push({
          val: children[i],
          pathKey: curPaths[j]
        });
      }
    } //} else
    //    rKeys.push(...children);

  }
} //updateDataSet(Routes.api.example.test);


var autoMock = function autoMock(routes, options) {
  return startMock(routes, options, app);
};

exports.autoMock = autoMock;

function getMockData(path, protocol) {
  if (mockData[path]) {
    return mockData[path][protocol].data;
  }

  return null;
}

function setMockData(path, protocol, data, filter) {
  if (!mockData[path]) {
    mockData[path] = {};
  }

  mockData[path][protocol] = {
    data: data,
    filter: filter
  };
}