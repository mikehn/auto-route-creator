//require("@babel/register")({ presets: ["@babel/env"] }); // for transpiling es6 and beyond
//let { Routes, getRoute } = require("../src/services/network/Routes");
//let { Routes } = require("./MockTemplate");
import express, { Request, Response, NextFunction } from 'express';
import { faker } from '@faker-js/faker';
const { SYMBOLS, METHOD, getRoute } = require('./RouteCreator');
const DEFAULT_RES_MARKER = Symbol('DEFAULT_RES_MARKER');
const fs = require('fs');
let http = require('http');
let https = require('https');

type LogLevel = 'INFO' | 'ERROR' | 'WARNING' | 'TRACE' | 'DATA';
type AppMethod = 'delete' | 'get' | 'post' | 'put' | 'patch';

interface MockOptions {
  port?: number;
  defaultListSize?: number;
  defaultRes?: (req: Request, res: Response) => void;
  https?: { key: Buffer; cert: Buffer };
  log?: LogLevel[] | ((level: LogLevel, ...msg: string[]) => void);
  interceptor?: (
    req: Request,
    res: Response,
    next: NextFunction,
    mockData: any
  ) => {};
  onMockStart?: () => void;
  templateParser?: (str: string, path?: string) => any;
}

//var express = require('express');
var app = express();

// Logger
let logFactory =
  (enabledLevels: LogLevel[]) =>
  (level, ...msg) => {
    if (enabledLevels.includes(level)) console.log(`[${level}]:`, ...msg);
  };
/* default logging */
let log: (level: LogLevel, ...msg: string[]) => void = logFactory([
  'INFO',
  'ERROR',
  'WARNING',
  'TRACE', //TODO:FIX: remove trace from default
]);

//type Mockdata = Record<string,Record<AppMethod

const { DELETE, GET, POST, PUT, PATCH } = METHOD;
const AppMethod = {
  [DELETE]: 'delete',
  [GET]: 'get',
  [POST]: 'post',
  [PUT]: 'put',
  [PATCH]: 'patch',
};
const EMPTY_RES = 'No response definition for this route';
const PROTOCOL = 'protocol';
const PORT = 3002;
const DEFAULT_DATA_SET_SIZE = 5;
const TYPES = {
  BOOL: 'BOOL',
  NUMBER: 'NUMBER',
  STRING: 'STRING',
};
const IDENT = (a, req) => a;

let dKeyValues = {};
let dKeyObj = {};
let mockData = {};
let routeMeta = {};
let dRoutes = {};
let dataSize = null;
let defaultRes = null;
let templateParser: (str: string, path: string) => any;

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initDRoutes(routes, baseRoute) {
  //if (!!routes[SYMBOLS.DYNAMIC]) {

  let protoList = routes[SYMBOLS.PROTOCOL] || [GET];
  if (!Array.isArray(protoList)) protoList = [protoList];
  protoList.forEach((proto) => {
    let isArray = Array.isArray(dRoutes[baseRoute]);
    if (
      baseRoute.includes(':') &&
      (!dRoutes[baseRoute] || !isArray || !dRoutes[baseRoute].includes(proto))
    ) {
      if (isArray) {
        dRoutes[baseRoute].push(proto);
      } else {
        dRoutes[baseRoute] = [proto];
      }
    }
    //}
    let rKeys = Object.keys(routes);

    //let currentRouteTree=routes;
    rKeys.forEach((key) => {
      let route = routes[key];
      let dKey = route[SYMBOLS.DYNAMIC];
      let routeName = !!dKey ? ':' + dKey : getRoute(route).name;
      initDRoutes(routes[key], baseRoute + '/' + routeName);
    });
  });
}

function basicConfiguration(app, routes) {
  app.use(express.json()); // for parsing application/json
  app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

  //Logger
  app.use('/', (req, res, next) => {
    log('TRACE', `Req:[${req.method}]:${req.url}`);
    next();
  });
  // Init Dynamic routes
  initDRoutes(routes, '');
}

function addDynamicValues(val, req, proto, resOverride, filter = IDENT) {
  if (typeof val === 'function') {
    return val(req, mockData, proto, resOverride);
  } else {
    if (isObject(val) || Array.isArray(val)) {
      Object.keys(val).forEach((key) => {
        val[key] = addDynamicValues(val[key], req, proto, IDENT);
      });
    }
  }
  return filter(val, req);
}

function deepClone(val, res = {}, currentKey = null) {
  if (!(isObject(val) || Array.isArray(val))) {
    return val;
  } else {
    res = Array.isArray(val) ? [] : {};
    Object.keys(val).forEach((key) => {
      res[key] = deepClone(val[key], res[key], key);
    });
  }
  return res;
}

function initPath(proto, req, res) {
  let url = req.baseUrl + req.path;

  if (
    !mockData[url] ||
    !mockData[url][proto] ||
    mockData[url][proto].data == DEFAULT_RES_MARKER
  ) {
    if (defaultRes) {
      log(
        'TRACE',
        `No mock definition for ${proto}:${url}, using default response`
      );
      defaultRes(req, res);
    } else if (mockData[url][METHOD.GET] && proto == METHOD.PUT) {
      log(
        'TRACE',
        `using default definition for ${proto} - inserting body to mock`
      );
      mockData[url][METHOD.GET] = {
        ...mockData[url][METHOD.GET],
        data: req.body,
      };
      res.send(req.body);
    } else {
      log(
        'TRACE',
        `No mock definition for ${proto}:${url}, returning empty response`
      );
      res.send(EMPTY_RES);
    }
    return;
  }

  let mockObj = mockData[url][proto];
  let isResponseOverride = false;
  let resOverride = () => {
    log('TRACE', `response override for ${url}`);
    isResponseOverride = true;
    return res;
  };
  let jsonRes = addDynamicValues(
    deepClone(mockObj.data),
    req,
    proto,
    resOverride,
    mockObj.filter
  );
  if (!isResponseOverride) {
    log('DATA', `response for ${url}`, JSON.stringify(jsonRes, null, 2));
    res.json(jsonRes);
  }
}

function initServerPaths(app) {
  Object.keys(dRoutes).forEach((route) => {
    let protocolStrList = dRoutes[route];
    protocolStrList.forEach((proto) => {
      app[AppMethod[proto]](route, (req, res) => {
        initPath(proto, req, res);
      });
    });
  });

  Object.keys(mockData).forEach((url) => {
    Object.keys(mockData[url]).forEach((proto) => {
      let protocolStr = AppMethod[proto];
      log('TRACE', `Adding server endpoint for ${proto}:${url}`);
      app[protocolStr](url, (req, res) => {
        initPath(proto, req, res);
      });
    });
    //let childRoute = route[key];
    //let protocol = childRoute[SYMBOLS.PROTOCOL];
    //let url = childRoute[SYMBOLS.ROUTE].path({ isMock: true });
    //initServerPaths(childRoute, app);
  });
}

function isString(value) {
  return typeof value === 'string' || value instanceof String;
}

function isObject(value) {
  return value && typeof value === 'object' && value.constructor === Object;
}

function isBoolean(value) {
  return typeof value === 'boolean';
}

function logError(...str) {
  console.error(...str);
}

function getStrParts(value: string): { name: any; type: string } {
  const DELIM = ':';
  let parts = value.split(DELIM);
  const hasType = parts.length > 1;
  let lastPart = parts.pop();
  if (parts.length === 0) return { name: lastPart, type: TYPES.STRING };
  if (!TYPES[lastPart.toUpperCase().trim()]) {
    if (hasType)
      log('WARNING', `Unknown type [${lastPart.trim()}] defaulting to string`);
    return { name: value, type: TYPES.STRING };
  }
  return { name: parts.join(DELIM), type: lastPart };
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

function convertValue(data: any, type: string) {
  let typeUpper = type.toUpperCase();
  switch (typeUpper) {
    case TYPES.NUMBER:
      return Number(data);
    case TYPES.STRING:
      return String(data);
    case TYPES.BOOL:
      return `${data}` === 'true';
  }
  return data;
}

function defaultTemplateParser(template: string) {
  if (!isString(template)) return template;

  let { name, type } = getStrParts(template);

  if (name[0] == '[' && name[name.length - 1] == ']') {
    name = template.substring(1, name.length - 1);
    let parts = name.split('|');
    let randInt = getRandomInt(0, parts.length * 2);
    name = parts[randInt % parts.length];
  }

  return convertValue(faker.helpers.fake(name), type);
}

function getValueFromString(str, params) {
  if (templateParser) return templateParser(str, params);
  return defaultTemplateParser(str);
}

function updateArrayData(arr, params) {
  const TEMPLATE_LOC = 0;
  if (!arr || arr.length == 0) return [];
  let template = arr[TEMPLATE_LOC];
  let data = new Array(dataSize);
  for (let i = 0; i < data.length; ++i) {
    data[i] = dataParser(template, params);
  }
  return data;
}

function updateObjectData(obj, params) {
  let res = {};
  Object.keys(obj).forEach((key) => {
    res[key] = dataParser(obj[key], params);
  });
  return res;
}

function getAllValuesBykey(data, key) {
  let res = [];
  if (Array.isArray(data)) {
    data.forEach((val) => {
      if (isObject(val)) {
        res.push(val[key]);
      } else {
        res.push(val);
      }
    });
  } else if (isObject(data)) {
    if (data[key]) {
      return data[key];
    }
    let allKeys = Object.keys(data);

    let curRes;
    for (let i = 0; i < allKeys.length; ++i) {
      curRes = getAllValuesBykey(data[allKeys[i]], key).dkey;
      // if (curRes.length < res) {
      // 	res = curRes;
      // }
      if (curRes && curRes.length > 0) res.push(...curRes);
    }
  }
  return { dkey: res, dkObj: data };
}

function addMockData(rUrl, routeProtocol, data, routRes) {
  if (rUrl == '//') rUrl = '/';
  if (!mockData[rUrl]) {
    mockData[rUrl] = {};
  }

  mockData[rUrl][routeProtocol] = { data };
  mockData[rUrl][routeProtocol].filter = (routRes && routRes.filter) || IDENT;
  mockData[rUrl][routeProtocol].metadata = routRes && routRes.metadata;

  routeMeta[rUrl] = routeMeta[rUrl] || {};
  if (!routeMeta[rUrl][PROTOCOL]) routeMeta[rUrl][PROTOCOL] = [];
  routeMeta[rUrl][PROTOCOL].push(routeProtocol);
}

/**
 * turns non array values to values inside an array, leaves array values untouched
 * @param value if value not an array, place inside array
 */
function convertToArray<t>(value: t | t[]): any[] {
  if (Array.isArray(value)) return value;
  return [value];
}

function updateDataSet(route, baseRoute) {
  const KEY_DELIM = ':';

  let routeObj = getRoute(route);
  let dId = routeObj.name;
  let pathList = [`${baseRoute}/${dId}`];

  if (!!route[SYMBOLS.DYNAMIC]) {
    dId = isString(route[SYMBOLS.DYNAMIC]) ? route[SYMBOLS.DYNAMIC] : dId;
    dId = `${baseRoute}|${dId}`;
    if (dKeyValues[dId])
      pathList = dKeyValues[dId].map((id) => `${baseRoute}/${id}`);
  }

  let routerProtocolList = convertToArray(route[SYMBOLS.PROTOCOL] || [GET]);
  let responseList = convertToArray(route[SYMBOLS.RESPONSE]);

  const isDefaultResponse =
    responseList.length == 1 && routerProtocolList.length > 1;
  const doesResponseMatchProtoList =
    responseList.length > 1 && routerProtocolList.length != responseList.length;

  //TODO:REF:extract validation to functions
  //default protocol response cannot be used without GET as first.
  if (
    doesResponseMatchProtoList ||
    (isDefaultResponse && routerProtocolList[0] != GET)
  ) {
    if (!isDefaultResponse) {
      log(
        'ERROR',
        `Route ${baseRoute}/${dId} has multiple responses (${responseList.length}) without a matching protocol list (${routerProtocolList.length}). add to [PROTOCOL] field an array with corresponding protocol.`
      );
    }
    let minLength = Math.min(responseList.length, routerProtocolList.length);
    log(
      'WARNING',
      `${baseRoute}/${dId}: Mismatch between response definition count and protocol count, taking only first ${minLength} definitions`
    );
    if (isDefaultResponse)
      log(
        'WARNING',
        `${baseRoute}/${dId} cannot be used as default response, as first element in protocol array must be 'GET'`
      );
    routerProtocolList = routerProtocolList.slice(0, minLength);
    responseList = responseList.slice(0, minLength);
  } else if (isDefaultResponse) {
    log(
      'TRACE',
      `${baseRoute}/${dId} : got [${routerProtocolList.join(
        ','
      )}] protocols but only a single response definition, will be using defaults for all others`
    );
  }

  for (let i = 0; i < routerProtocolList.length; i++) {
    let routeProtocol = routerProtocolList[i];
    let routRes = responseList[i];

    if (!routRes) {
      pathList.forEach((path) => {
        addMockData(path, routeProtocol, DEFAULT_RES_MARKER, routRes);
      });
      return pathList;
    }

    //let storageKey = routRes.mockId || routeObj.path({ isMock: true });
    //let dynamicRefs = routRes.dynamicRefs || [];
    let dynamicKeys = routRes.dynamicKeys || [];

    if (routRes.template) {
      pathList.forEach((path) => {
        let data = dataParser(routRes.template, path);
        dynamicKeys.forEach((key) => {
          let [name, objKey] = key.split(KEY_DELIM);
          let { dkey, dkObj } = getAllValuesBykey(data, objKey);
          dKeyValues[`${path}|${name}`] = dkey; //TODO:M: extract to func
          dKeyObj[name] = dkObj;
        });
        addMockData(path, routeProtocol, data, routRes);
      });
    }
  }
  return pathList;
}

function updateRoutesData(routes) {
  //let routes = { "/": routes2 };
  let pathKey = '';
  let rKeys = Object.values(routes).map((val) => ({ val, pathKey }));
  //let rKeys = [{ val: routes, pathKey: "/" }];
  let paths = {};
  routes[SYMBOLS.PROTOCOL] = routes[SYMBOLS.PROTOCOL] || [GET];
  //routes[SYMBOLS.NAME] = "/";
  routes[SYMBOLS.ROUTE] = { name: '/' };
  updateDataSet(routes, '');

  while (rKeys.length > 0) {
    let ckey = rKeys.shift();
    let curPaths = updateDataSet(ckey.val, ckey.pathKey);
    paths[ckey.pathKey] = curPaths;
    let children = Object.values(ckey.val);
    if (!children) continue;
    //if (curPaths.length >= 1) {
    for (let i = 0; i < children.length; i++) {
      for (let j = 0; j < curPaths.length; j++) {
        rKeys.push({ val: children[i], pathKey: curPaths[j] });
      }
    }
    //} else
    //    rKeys.push(...children);
  }
}

let autoMock = (routes: Object, options: MockOptions) =>
  startMock(routes, options, app);

function getMockData(path: string, protocol: string) {
  if (mockData[path]) {
    return mockData[path][protocol].data;
  }
  return null;
}

function setMockData(
  path: string,
  protocol: string,
  data: any,
  filter: (reqData: any, req: Request) => any
) {
  if (!mockData[path]) {
    mockData[path] = {};
  }
  mockData[path][protocol] = { data, filter };
}

function startMock(routes, options: MockOptions = {}, mApp = app): void {
  const port = options.port || PORT;
  const defaultOnMockStart = () => {};
  const httpsCredentials = options.https; // {key: privateKey, cert: certificate};
  templateParser = options.templateParser;
  dataSize = options.defaultListSize || DEFAULT_DATA_SET_SIZE;
  defaultRes = options.defaultRes;
  if (options.interceptor)
    mApp.use((req, res, next) => options.interceptor(req, res, next, mockData));

  if (options.log) {
    if (Array.isArray(options.log)) log = logFactory(options.log);
    else if (typeof options.log === 'function') log = options.log;
    else {
      log(
        'ERROR',
        'Unknown log definition, can only be either log level array, or logging function. see documentation for more details'
      );
    }
  }

  updateRoutesData(routes);
  basicConfiguration(mApp, routes);
  initServerPaths(mApp);
  const server = httpsCredentials
    ? https.createServer(httpsCredentials, mApp)
    : http.createServer(mApp);
  server.listen(port, () => {
    if (options.onMockStart) options.onMockStart();
    else defaultOnMockStart();
    log('INFO', `Mock server on port ${port}!`);
  });
}

export { autoMock, getMockData, setMockData, MockOptions, TYPES };
