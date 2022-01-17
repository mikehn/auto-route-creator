"use strict";

var _index = require("../index");

var _faker = _interopRequireDefault(require("faker"));

var _passenger, _speedGet, _speedPost, _id2, _cars, _passenger2, _speedGet2, _speedPost2, _id4, _cars2, _id5, _cars3, _MOCK_RESPONSE_DEFINI, _pathArgs2;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var SYMBOLS = _index.RouteCreator.SYMBOLS,
    METHOD = _index.RouteCreator.METHOD,
    initRoutes = _index.RouteCreator.initRoutes,
    getRoute = _index.RouteCreator.getRoute,
    joinResponseRoutes = _index.RouteCreator.joinResponseRoutes,
    BIND = _index.RouteCreator.BIND;
var mock = _index.AutoMock.mock,
    setMockData = _index.AutoMock.setMockData;

/**
 * Routes tree definition, 
 * the following Symbols define:
 * PROTOCOL : protocol used in route
 * DYNAMIC  : if this part of route is a variable to be supplied
 * NAME : route path part, if not given key will be taken as route path part
 * ROUTE: Route object corresponding to tree (NOTE: this is auto generated in init function)
 */
var PROTOCOL = SYMBOLS.PROTOCOL,
    DYNAMIC = SYMBOLS.DYNAMIC,
    NAME = SYMBOLS.NAME,
    QUERY = SYMBOLS.QUERY,
    BODY = SYMBOLS.BODY,
    RESPONSE = SYMBOLS.RESPONSE;
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
  cars: (_cars = {}, _defineProperty(_cars, PROTOCOL, METHOD.GET), _defineProperty(_cars, QUERY, ["limit", "start", "model"]), _defineProperty(_cars, "id", (_id2 = {}, _defineProperty(_id2, DYNAMIC, DKEY_CAR_ID), _defineProperty(_id2, "passenger", (_passenger = {}, _defineProperty(_passenger, PROTOCOL, METHOD.GET), _defineProperty(_passenger, QUERY, passengersQueryParams), _defineProperty(_passenger, "id", _defineProperty({}, DYNAMIC, "pid")), _passenger)), _defineProperty(_id2, "speedGet", (_speedGet = {}, _defineProperty(_speedGet, NAME, "speed"), _defineProperty(_speedGet, PROTOCOL, METHOD.GET), _defineProperty(_speedGet, QUERY, QUERY_PARAMS_SPEED), _speedGet)), _defineProperty(_id2, "speedPost", (_speedPost = {}, _defineProperty(_speedPost, NAME, "speed"), _defineProperty(_speedPost, PROTOCOL, METHOD.POST), _speedPost)), _id2)), _defineProperty(_cars, "permissions", {
    users: {},
    verify: {}
  }), _cars)
};
var ROUTES2 = {
  cars: (_cars2 = {}, _defineProperty(_cars2, PROTOCOL, METHOD.GET), _defineProperty(_cars2, "id", (_id4 = {}, _defineProperty(_id4, DYNAMIC, DKEY_CAR_ID), _defineProperty(_id4, QUERY, ["limit", "type", "model"]), _defineProperty(_id4, "passenger", (_passenger2 = {}, _defineProperty(_passenger2, PROTOCOL, METHOD.GET), _defineProperty(_passenger2, QUERY, passengersQueryParams), _defineProperty(_passenger2, "id", _defineProperty({}, DYNAMIC, true)), _passenger2)), _defineProperty(_id4, "speedGet", (_speedGet2 = {}, _defineProperty(_speedGet2, NAME, "speed"), _defineProperty(_speedGet2, PROTOCOL, METHOD.GET), _defineProperty(_speedGet2, QUERY, QUERY_PARAMS_SPEED), _speedGet2)), _defineProperty(_id4, "speedPost", (_speedPost2 = {}, _defineProperty(_speedPost2, NAME, "speed"), _defineProperty(_speedPost2, PROTOCOL, METHOD.POST), _defineProperty(_speedPost2, BODY, speedPostBody), _defineProperty(_speedPost2, QUERY, QUERY_PARAMS_SPEED), _speedPost2)), _id4)), _cars2)
};
var MOCK_RESPONSE_DEFINITION = (_MOCK_RESPONSE_DEFINI = {}, _defineProperty(_MOCK_RESPONSE_DEFINI, RESPONSE, {
  template: {
    message: "hello world2:String"
  }
}), _defineProperty(_MOCK_RESPONSE_DEFINI, "cars", (_cars3 = {}, _defineProperty(_cars3, RESPONSE, {
  template: {
    cars: [{
      id: "{{datatype.uuid}}:string",
      manufacturer: "{{vehicle.manufacturer}}:string",
      model: "{{vehicle.model}}:string",
      pass: function pass() {
        return function () {
          return Math.floor(Math.random() * 10);
        };
      },
      fuelTypes: [],
      owner: "",
      cost: null
    }]
  },
  dynamicKeys: [BIND(DKEY_CAR_ID, "id")],
  filter: function filter(responseData, req) {
    var cars = responseData.cars;
    console.log(">", responseData);
    var start = Number(req.query && req.query.start || 0);
    var limit = Number(req.query && req.query.limit || cars.length + 1);
    var model = req.query && req.query.model || null;
    return cars.slice(start, start + limit).filter(function (car) {
      return model ? car.model === model : true;
    });
  }
}), _defineProperty(_cars3, "id", (_id5 = {}, _defineProperty(_id5, RESPONSE, {
  template: function template(url) {
    return function (req, mData, proto) {
      var allCars = mData["/cars"][METHOD.GET].data.cars;
      var id = req.params[DKEY_CAR_ID];
      var selected = allCars.find(function (car) {
        return car.id === id;
      });

      var vin = _faker["default"].vehicle.vin();

      var data = Object.assign({
        vin: vin
      }, selected); // without this line, mock will revaluate vin every time (see speed as an example)

      setMockData(url, proto, data);
      return data;
    };
  }
}), _defineProperty(_id5, "speedGet", _defineProperty({}, RESPONSE, {
  template: function template() {
    return function (req) {
      var isKM = !(req.query && req.query.isKM === "false"); //Note we did not set mock data, every time this route will be called, function revaluates.

      return {
        speed: "".concat(_faker["default"].datatype.number(160 * (isKM ? 1 : 0.62))).concat(isKM ? "kph" : "mph")
      };
    };
  }
})), _id5)), _defineProperty(_cars3, "permissions", _defineProperty({}, RESPONSE, {
  template: function template() {
    return function (req, mockData, proto, resOverride) {
      // example how to override response, 
      // once you invoke resOverride, you must handle response yourself
      var res = resOverride();
      res.status(401);
      res.send('User does not have permission to view this section');
    };
  }
})), _cars3)), _MOCK_RESPONSE_DEFINI);
initRoutes(joinResponseRoutes(ROUTES1, MOCK_RESPONSE_DEFINITION));
initRoutes(ROUTES2); // Sending path arguments as an object ,and  Query params an array

mockFetch(getRoute(ROUTES1.cars, {
  pathArgs: _defineProperty({}, DKEY_CAR_ID, "mike"),
  queryParams: [10, "subaru", "red"]
})); //Fetch:[GET]:[https://my-mock.com/cars/mike?carsLimit=10&carsType=subaru&carsColor=red]
//------------------------------
//Sending path arguments as a string (works for single path), and Query param as object

mockFetch(getRoute(ROUTES2.cars.id, {
  pathArgs: "MIKE",
  queryParams: {
    color: "gold"
  }
})); //Fetch:[GET]:[https://my-mock.com/cars/MIKE?color=gold]
//------------------------------
//Sending multiple path args

mockFetch(getRoute(ROUTES1.cars.id.passenger.id, {
  pathArgs: (_pathArgs2 = {}, _defineProperty(_pathArgs2, DKEY_CAR_ID, "mike"), _defineProperty(_pathArgs2, "pid", "p1"), _pathArgs2)
})); //Fetch:[GET]:[https://my-mock.com/cars/mike/passenger/p1]
//------------------------------
// user defined query params, note that definition in ROUTES1.cars.id.speedPost has no BODY function, so what is given is sent

mockFetch(getRoute(ROUTES1.cars.id.speedPost, {
  pathArgs: _defineProperty({}, DKEY_CAR_ID, "fiat"),
  queryParams: "name=ferret&color=purple",
  bodyParams: 120
})); // Fetch:[POST]:[https://my-mock.com/cars/fiat/speed?name=ferret&color=purple]
// with the following body:
// 120
//------------------------------
// user defined query params, here in ROUTES2.cars.id.speedPost we have a body function, what is given will be sent to function

mockFetch(getRoute(ROUTES2.cars.id.speedPost, {
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
} //let fs = require("fs");
//var key = fs.readFileSync("key");
//var cert = fs.readFileSync("cert");


mock(ROUTES1, {
  defaultRes: function defaultRes(req, res) {
    res.sendStatus(404);
  },
  defaultListSize: 4 //port: 3400,
  //defaultRes: (req, res) => res.sendStatus(404),
  //https: { key, cert },

});