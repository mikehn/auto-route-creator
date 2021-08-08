//require("@babel/register")({ presets: ["@babel/env"] }); // for transpiling es6 and beyond
//let { Routes, getRoute } = require("../src/services/network/Routes");
//let { Routes } = require("./MockTemplate");
let { SYMBOLS, METHOD, getRoute } = require("./RouteCreator");
let faker = require("faker");
var fs = require("fs");
var express = require("express");
var app = express();
let log = (...msg) => { console.log(...msg) };

const { DELETE, GET, POST, PUT } = METHOD;
const AppMethod = { [DELETE]: "delete", [GET]: "get", [POST]: "post", [PUT]: "put" };
const EMPTY_RES = "No response definition for this route";
const PROTOCOL = "protocol";
const PORT = 3002;
const DEFAULT_DATA_SET_SIZE = 5;
const TYPES = {
	BOOL: "bool",
	NUMBER: "number",
	STRING: "STRING"
};

let dKeyValues = {};
let dKeyObj = {};
let mockData = {};
let routeMeta = {};
let dRoutes = {};

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function basicConfiguration(app,routes) {
	app.use(express.json()); // for parsing application/json
	app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

	//Logger
	app.use("/", (req, res, next) => {
		console.log("Received: ", req.url);
		next();
	});
}

function addDynamicValues(val, req) {
	if (typeof val === 'function') {
		return val(req, mockData);
	} else {
		if (isObject(val) || Array.isArray(val)) {
			Object.keys(val).forEach(key => {
				val[key] = addDynamicValues(val[key], req)
			})
		}
	}
	return val;

}

function initServerPaths(route, app) {
	//console.log(mockData);
	console.log(">>", dRoutes)
	Object.keys(mockData).forEach((url) => {
		Object.keys(mockData[url]).forEach((proto) => {
			let protocolStr = AppMethod[proto];
			app[protocolStr](url, (req, res, next) => {

				if (proto == METHOD.DELETE) {
				}
				if (proto == METHOD.PUT) {
					mockData[url][METHOD.GET] = req.body;
				}

				res.json(addDynamicValues(mockData[url][proto], req));

			});
		});
		//let childRoute = route[key];
		//let protocol = childRoute[SYMBOLS.PROTOCOL];
		//let url = childRoute[SYMBOLS.ROUTE].path({ isMock: true });
		//initServerPaths(childRoute, app);
	});
}

/////////////
function startMock(routes, port, app = app) {
	updateRoutesData(routes);
	basicConfiguration(app, routes);
	initServerPaths(routes, app);
	app.listen(port, () => console.log(`Mock server on port ${port}!`));
}

function isString(value) {
	return typeof value === "string";
}

function isObject(value) {
	return value && typeof value === "object" && value.constructor === Object;
}

function isBoolean(value) {
	return typeof value === "boolean";
}

function logError(...str) {
	console.error(...str);
}

function getStrParts(str) {
	const DELIM = ":";
	if (!str || str.length == 0) {
		logError("received wrong string template expected <name>:<type>");
	}
	let parts = str.split(DELIM);
	if (parts.length > 2) {
		logError("received wrong string template expected <name>:<type>");
	}
	if (parts.length == 1) {
		console.log(parts[0], " no type was supplied assuming string");
		parts = [parts[0], "string"];
	}
	return { name: parts[0], type: parts[1] };
}

function dataParser(data, params) {
	if (typeof data === 'function') {
		return data(params);
	}
	else if (isObject(data)) {
		return updateObjectData(data, params);
	} else if (Array.isArray(data)) {
		return updateArrayData(data, params);
	} else if (isString(data)) {
		return getValueFromString(data, params);
	} else {
		logError("template only supports array, object or string but got", data);
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
			return `${data}` === "true";
	}
	return data;
}

function getValueFromString(str, params) {
	let { type, name } = getStrParts(str);
	if (name[0] == '[' && name[name.length - 1] == ']') {
		name = str.substring(1, name.length - 1);
		let parts = name.split("|");
		let randInt = getRandomInt(0, Math.max(100, parts.length));
		name = parts[randInt % parts.length];
	}

	return convertValue(faker.fake(name), type);
}

function updateArrayData(arr, params) {
	const TEMPLATE_LOC = 0;
	if (!arr || arr.length == 0) return;
	let template = arr[TEMPLATE_LOC];
	let data = new Array(DEFAULT_DATA_SET_SIZE);
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
		return res;
	}

	if (isObject(data)) {
		if (data[key]) {
			return data[key];
		}
		let allKeys = Object.keys(data);

		let curRes;
		for (let i = 0; i < allKeys.length; ++i) {
			curRes = getAllValuesBykey(data[allKeys[i]], key);
			// if (curRes.length < res) {
			// 	res = curRes;
			// }
			if (curRes && curRes.length > 0)
				res.push(...curRes);
		}
	}
	return { dkey: res, dkObj: data };
}

function addMockData(rUrl, routeProtocol, data, did) {
	// console.log("DID", did, rUrl)
	// if (did && !dRoutes[did]) {
	// 	let dPath = rUrl.substring(0, rUrl.lastIndexOf("/"));
	// 	dRoutes[did] = dPath;
	// }

	if (!mockData[rUrl]) {
		mockData[rUrl] = {};
	}

	mockData[rUrl][routeProtocol] = data;
	routeMeta[rUrl] = routeMeta[rUrl] || {};
	if (!routeMeta[rUrl][PROTOCOL]) routeMeta[rUrl][PROTOCOL] = [];
	routeMeta[rUrl][PROTOCOL].push(routeProtocol);
}

function updateDataSet(route, baseRoute) {
	const routeProtocol = route[SYMBOLS.PROTOCOL];
	if (!routeProtocol) {
		routeProtocol = METHOD.GET;
	}
	let routeObj = getRoute(route);
	let dId = routeObj.name;
	let pathList = [`${baseRoute}/${dId}`];

	if (!!route[SYMBOLS.DYNAMIC]) {
		dId = isString(route[SYMBOLS.DYNAMIC]) ? route[SYMBOLS.DYNAMIC] : dId;
		dId = `${baseRoute}|${dId}`;
		if (dKeyValues[dId]) pathList = dKeyValues[dId].map((id) => `${baseRoute}/${id}`);
	}

	let routRes = route[SYMBOLS.RESPONSE];
	if (!routRes) {
		pathList.forEach((path) => {
			addMockData(path, routeProtocol, EMPTY_RES, route[SYMBOLS.DYNAMIC]);
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

				let { name, type: objKey } = getStrParts(key);
				let { dkey, dkObj } = getAllValuesBykey(data, objKey);
				//log("D>",path,key,dkey)
				dKeyValues[`${path}|${name}`] = dkey; //TODO:M: extract to func
				dKeyObj[name] = dkObj;
			});
			addMockData(path, routeProtocol, data, route[SYMBOLS.DYNAMIC]);
		});
	}

	return pathList;

}

function updateRoutesData(routes) {
	//routes = { "/": routes };
	let pathKey = "";
	let rKeys = Object.values(routes).map((val) => ({ val, pathKey }));
	let paths = {};
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


//updateDataSet(Routes.api.example.test);

let autoMock = (routes, port) => startMock(routes, port || PORT, app);

function getMockData(path, protocol) {
	if (mockData[path]) {
		return mockData[path][protocol];
	}
	return null;
}

function setMockData(path, protocol, data) {
	if (!mockData[path]) {
		mockData[path] = {};
	}
	mockData[path][protocol] = data;
}

export { autoMock, getMockData, setMockData }