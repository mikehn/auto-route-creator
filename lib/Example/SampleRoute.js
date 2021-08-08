"use strict";

var _RouteCreator = require("../RouteCreator");

var _AutoMockServer = require("../AutoMockServer");

var _passenger, _speedGet, _speedPost, _id2, _cars, _passenger2, _speedGet2, _speedPost2, _id4, _cars2, _cars3, _MOCK_RESPONSE_DEFINI, _pathArgs2;

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
    BODY = _RouteCreator.SYMBOLS.BODY,
    RESPONSE = _RouteCreator.SYMBOLS.RESPONSE;
/**
 * Example query param function, you would use a function if you need some extra logic being applied
 * should return a key value object representing the Query params
 */

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
/**
 * Example query params as an array of strings, should be 
 */


var QUERY_PARAMS_SPEED = ["isKM"];
var DKEY_CAR_ID = "CID";

var speedPostBody = function speedPostBody(speed) {
  return {
    speed: speed
  };
};

var ROUTES1 = {
  cars: (_cars = {}, _defineProperty(_cars, PROTOCOL, _RouteCreator.METHOD.GET), _defineProperty(_cars, "id", (_id2 = {}, _defineProperty(_id2, DYNAMIC, DKEY_CAR_ID), _defineProperty(_id2, QUERY, ["carsLimit", "carsType", "carsColor"]), _defineProperty(_id2, "passenger", (_passenger = {}, _defineProperty(_passenger, PROTOCOL, _RouteCreator.METHOD.GET), _defineProperty(_passenger, QUERY, passengersQueryParams), _defineProperty(_passenger, "id", _defineProperty({}, DYNAMIC, "pid")), _passenger)), _defineProperty(_id2, "speedGet", (_speedGet = {}, _defineProperty(_speedGet, NAME, "speed"), _defineProperty(_speedGet, PROTOCOL, _RouteCreator.METHOD.GET), _defineProperty(_speedGet, QUERY, QUERY_PARAMS_SPEED), _speedGet)), _defineProperty(_id2, "speedPost", (_speedPost = {}, _defineProperty(_speedPost, NAME, "speed"), _defineProperty(_speedPost, PROTOCOL, _RouteCreator.METHOD.POST), _speedPost)), _id2)), _cars)
};
var ROUTES2 = {
  cars: (_cars2 = {}, _defineProperty(_cars2, PROTOCOL, _RouteCreator.METHOD.GET), _defineProperty(_cars2, "id", (_id4 = {}, _defineProperty(_id4, DYNAMIC, DKEY_CAR_ID), _defineProperty(_id4, QUERY, ["limit", "type", "color"]), _defineProperty(_id4, "passenger", (_passenger2 = {}, _defineProperty(_passenger2, PROTOCOL, _RouteCreator.METHOD.GET), _defineProperty(_passenger2, QUERY, passengersQueryParams), _defineProperty(_passenger2, "id", _defineProperty({}, DYNAMIC, true)), _passenger2)), _defineProperty(_id4, "speedGet", (_speedGet2 = {}, _defineProperty(_speedGet2, NAME, "speed"), _defineProperty(_speedGet2, PROTOCOL, _RouteCreator.METHOD.GET), _defineProperty(_speedGet2, QUERY, QUERY_PARAMS_SPEED), _speedGet2)), _defineProperty(_id4, "speedPost", (_speedPost2 = {}, _defineProperty(_speedPost2, NAME, "speed"), _defineProperty(_speedPost2, PROTOCOL, _RouteCreator.METHOD.POST), _defineProperty(_speedPost2, BODY, speedPostBody), _defineProperty(_speedPost2, QUERY, QUERY_PARAMS_SPEED), _speedPost2)), _id4)), _cars2)
};
var MOCK_RESPONSE_DEFINITION = (_MOCK_RESPONSE_DEFINI = {}, _defineProperty(_MOCK_RESPONSE_DEFINI, RESPONSE, {
  template: {
    message: "hello world:String"
  }
}), _defineProperty(_MOCK_RESPONSE_DEFINI, "cars", (_cars3 = {}, _defineProperty(_cars3, RESPONSE, {
  template: {
    cars: [{
      id: "{{datatype.uuid}}:string",
      manufacturer: "{{vehicle.manufacturer}}:string",
      model: "{{vehicle.model}}:string"
    }]
  },
  dynamicKeys: [(0, _RouteCreator.BIND)(DKEY_CAR_ID, "id")]
}), _defineProperty(_cars3, "id", _defineProperty({}, RESPONSE, {
  template: function template(url) {
    return function (req, mData) {
      console.log("REQ", req.params);
      var allCars = mData["/cars"][_RouteCreator.METHOD.GET].cars;
      var id = url.split("/")[2];
      var selected = allCars.find(function (car) {
        return car.id === id;
      });
      console.log(url.split("/"), id, selected);
      return selected;
    };
  }
})), _cars3)), _MOCK_RESPONSE_DEFINI);
(0, _RouteCreator.initRoutes)((0, _RouteCreator.joinResponseRoutes)(ROUTES1, MOCK_RESPONSE_DEFINITION));
(0, _RouteCreator.initRoutes)(ROUTES2); // Sending path arguments as an object ,and  Query params an array

mockFetch((0, _RouteCreator.getRoute)(ROUTES1.cars.id, {
  pathArgs: _defineProperty({}, DKEY_CAR_ID, "mike"),
  queryParams: [10, "subaru", "red"]
})); //Fetch:[GET]:[https://my-mock.com/cars/mike?carsLimit=10&carsType=subaru&carsColor=red]
//------------------------------
//Sending path arguments as a string (works for single path), and Query param as object

mockFetch((0, _RouteCreator.getRoute)(ROUTES2.cars.id, {
  pathArgs: "MIKE",
  queryParams: {
    color: "gold"
  }
})); //Fetch:[GET]:[https://my-mock.com/cars/MIKE?color=gold]
//------------------------------
//Sending multiple path args

mockFetch((0, _RouteCreator.getRoute)(ROUTES1.cars.id.passenger.id, {
  pathArgs: (_pathArgs2 = {}, _defineProperty(_pathArgs2, DKEY_CAR_ID, "mike"), _defineProperty(_pathArgs2, "pid", "p1"), _pathArgs2)
})); //Fetch:[GET]:[https://my-mock.com/cars/mike/passenger/p1]
//------------------------------
// user defined query params, note that definition in ROUTES1.cars.id.speedPost has no BODY function, so what is given is sent

mockFetch((0, _RouteCreator.getRoute)(ROUTES1.cars.id.speedPost, {
  pathArgs: _defineProperty({}, DKEY_CAR_ID, "fiat"),
  queryParams: "name=ferret&color=purple",
  bodyParams: 120
})); // Fetch:[POST]:[https://my-mock.com/cars/fiat/speed?name=ferret&color=purple]
// with the following body:
// 120
//------------------------------
// user defined query params, here in ROUTES2.cars.id.speedPost we have a body function, what is given will be sent to function

mockFetch((0, _RouteCreator.getRoute)(ROUTES2.cars.id.speedPost, {
  pathArgs: _defineProperty({}, DKEY_CAR_ID, "fiat"),
  queryParams: "isKm=true",
  bodyParams: 120
})); // Fetch:[POST]:[https://my-mock.com/cars/fiat/speed?isKm=true]
// with the following body:
// { speed: 120 }
//------------------------------

/**
 * Fake fetch API to simulate real use case
 * @param {*} route 
 */

function mockFetch(route) {
  var BASE_API = "https://my-mock.com";
  var url = BASE_API + route.path();
  console.log("Fetch: [".concat(route.protocol, "]: [").concat(url, "]"));

  if (route.body) {
    console.log("with the following body:");
    console.log(route.body);
  }
}

(0, _AutoMockServer.autoMock)(ROUTES1);