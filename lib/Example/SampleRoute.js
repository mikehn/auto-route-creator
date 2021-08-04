"use strict";

var _RouteCreator = require("../RouteCreator");

var _passenger, _speed, _speed2, _id2, _cars, _passenger2, _speed3, _speed4, _id4, _cars2;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Routes tree definition, 
 * the following Symbols define:
 * PROTOCOL : protocol used in route
 * DYNAMIC  : if this part of route is a variable to be supplied
 * NAME : route path part, if not given key will be taken as route path part
 * ROUTE: Route object corresponding to tree (NOTE: this is auto generated in init function)
 */
var PROTOCOL = _RouteCreator.SYMBOLS.PROTOCOL,
    DYNAMIC = _RouteCreator.SYMBOLS.DYNAMIC,
    NAME = _RouteCreator.SYMBOLS.NAME,
    QUERY = _RouteCreator.SYMBOLS.QUERY,
    BODY = _RouteCreator.SYMBOLS.BODY;

var passengersQueryParams = function passengersQueryParams(_ref) {
  var ageLimit = _ref.ageLimit,
      heightLimit = _ref.heightLimit;
  if (!ageLimit) console.error("age must be supplied");

  if (ageLimit < 0 || ageLimit > 120) {
    console.error("age limit must be between 0-120 got", ageLimit);
    return null;
  }

  return Object.assign({
    ageLimit: ageLimit
  }, heightLimit ? {
    heightLimit: heightLimit
  } : {});
};

var getCarsQueryParams = function getCarsQueryParams(carsLimit, carsType, carsColor) {
  return {
    carsLimit: carsLimit,
    carsType: carsType,
    carsColor: carsColor
  };
};

var getSpeedQueryParams = function getSpeedQueryParams(isKm) {
  return {
    isKm: isKm
  };
};

var speedPostBody = function speedPostBody(speed) {
  return {
    speed: speed
  };
};

var speedPostQuery = function speedPostQuery(isKm) {
  return {
    isKm: isKm
  };
};

var ROUTES1 = {
  cars: (_cars = {}, _defineProperty(_cars, PROTOCOL, _RouteCreator.METHOD.GET), _defineProperty(_cars, "id", (_id2 = {}, _defineProperty(_id2, DYNAMIC, "cid"), _defineProperty(_id2, QUERY, getCarsQueryParams), _defineProperty(_id2, "passenger", (_passenger = {}, _defineProperty(_passenger, PROTOCOL, _RouteCreator.METHOD.GET), _defineProperty(_passenger, QUERY, passengersQueryParams), _defineProperty(_passenger, "id", _defineProperty({}, DYNAMIC, "pid")), _passenger)), _defineProperty(_id2, "speed1", (_speed = {}, _defineProperty(_speed, NAME, "speed"), _defineProperty(_speed, PROTOCOL, _RouteCreator.METHOD.GET), _defineProperty(_speed, QUERY, getSpeedQueryParams), _speed)), _defineProperty(_id2, "speed2", (_speed2 = {}, _defineProperty(_speed2, NAME, "speed"), _defineProperty(_speed2, PROTOCOL, _RouteCreator.METHOD.POST), _defineProperty(_speed2, BODY, speedPostBody), _speed2)), _id2)), _cars)
};
var ROUTES2 = {
  cars: (_cars2 = {}, _defineProperty(_cars2, PROTOCOL, _RouteCreator.METHOD.GET), _defineProperty(_cars2, "id", (_id4 = {}, _defineProperty(_id4, DYNAMIC, true), _defineProperty(_id4, QUERY, ["limit", "type", "color"]), _defineProperty(_id4, "passenger", (_passenger2 = {}, _defineProperty(_passenger2, PROTOCOL, _RouteCreator.METHOD.GET), _defineProperty(_passenger2, QUERY, passengersQueryParams), _defineProperty(_passenger2, "id", _defineProperty({}, DYNAMIC, true)), _passenger2)), _defineProperty(_id4, "speed1", (_speed3 = {}, _defineProperty(_speed3, NAME, "speed"), _defineProperty(_speed3, PROTOCOL, _RouteCreator.METHOD.GET), _defineProperty(_speed3, QUERY, getSpeedQueryParams), _speed3)), _defineProperty(_id4, "speed2", (_speed4 = {}, _defineProperty(_speed4, NAME, "speed"), _defineProperty(_speed4, PROTOCOL, _RouteCreator.METHOD.POST), _defineProperty(_speed4, BODY, speedPostBody), _defineProperty(_speed4, QUERY, speedPostQuery), _speed4)), _id4)), _cars2)
};
(0, _RouteCreator.initRoutes)(ROUTES1);
(0, _RouteCreator.initRoutes)(ROUTES2); // Sending path arguments as an object ,and  Query params an array

mockFetch((0, _RouteCreator.getRoute)(ROUTES1.cars.id, {
  pathArgs: {
    cid: "mike"
  },
  queryParams: [10, "subaru", "red"]
}));
mockFetch((0, _RouteCreator.getRoute)(ROUTES1.cars.id, {
  pathArgs: {
    cid: "mike"
  },
  queryParams: {
    carsType: "BABALOBA"
  }
})); //Sending path arguments as a string (works for single path), and Query param as object

mockFetch((0, _RouteCreator.getRoute)(ROUTES2.cars.id, {
  pathArgs: "MIKE",
  queryParams: {
    color: "gold"
  }
}));
mockFetch((0, _RouteCreator.getRoute)(ROUTES1.cars.id.passenger.id, {
  pathArgs: {
    cid: "mike",
    pid: "p1"
  }
})); // user defined query params

mockFetch((0, _RouteCreator.getRoute)(ROUTES1.cars.id.speed2, {
  pathArgs: {
    cid: "fiat"
  },
  queryParams: "isKm=true",
  bodyParams: 120
}));
/**
 * Fake fetch API to simulate real use case
 * @param {*} route 
 */

function mockFetch(route) {
  var BASE_API = "https://my-mock.com";
  var url = BASE_API + route.path();
  console.log("Fetch:[".concat(route.protocol, "]:[").concat(url, "]"));

  if (route.body) {
    console.log("with the following body:");
    console.log(route.body);
  }
}