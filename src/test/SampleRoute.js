import { AutoMock, RouteCreator } from "../index";

let { SYMBOLS, METHOD, initRoutes, getRoute, joinResponseRoutes, BIND } = RouteCreator;
let { mock, setMockData } = AutoMock;
import faker from "faker";
/**
 * Routes tree definition, 
 * the following Symbols define:
 * PROTOCOL : protocol used in route
 * DYNAMIC  : if this part of route is a variable to be supplied
 * NAME : route path part, if not given key will be taken as route path part
 * ROUTE: Route object corresponding to tree (NOTE: this is auto generated in init function)
 */
let { PROTOCOL, DYNAMIC, NAME, QUERY, BODY, RESPONSE } = SYMBOLS;


/**
 * Example query param function, you would use a function if you need some extra logic being applied
 * should return a key value object representing the Query params
 */
const passengersQueryParams = ({ ageLimit, heightLimit }) => {
    if (!ageLimit)
        console.error("age must be supplied");
    if (ageLimit < 0 || ageLimit > 120) {
        console.error("age limit must be between 0-120 got", ageLimit);
        return null;
    }
    return Object.assign({ ageLimit }, heightLimit ? { heightLimit } : {});
}

/**
 * Example query params as an array of strings, should be 
 */
const QUERY_PARAMS_SPEED = ["isKM"];

const DKEY_CAR_ID = "CID";

let speedPostBody = (speed) => ({ speed });


const ROUTES1 = {
    cars: {
        [PROTOCOL]: METHOD.GET,
        [QUERY]: ["limit", "start", "model"],
        id: {
            [DYNAMIC]: DKEY_CAR_ID,
            passenger: {
                [PROTOCOL]: METHOD.GET,
                [QUERY]: passengersQueryParams,
                id: {
                    [DYNAMIC]: "pid",
                }
            },
            speedGet: {
                [NAME]: "speed",
                [PROTOCOL]: METHOD.GET,
                [QUERY]: QUERY_PARAMS_SPEED
            },
            speedPost: {
                [NAME]: "speed",
                [PROTOCOL]: METHOD.POST,
            }
        },
        permissions: {
            users: {

            },
            verify: {

            }

        }
    },
};

const ROUTES2 = {

    cars: {
        [PROTOCOL]: METHOD.GET,
        id: {
            [DYNAMIC]: DKEY_CAR_ID,
            [QUERY]: ["limit", "type", "model"],
            passenger: {
                [PROTOCOL]: METHOD.GET,
                [QUERY]: passengersQueryParams,

                id: {
                    [DYNAMIC]: true,
                }
            },
            speedGet: {
                [NAME]: "speed",
                [PROTOCOL]: METHOD.GET,
                [QUERY]: QUERY_PARAMS_SPEED
            },
            speedPost: {
                [NAME]: "speed",
                [PROTOCOL]: METHOD.POST,
                [BODY]: speedPostBody,
                [QUERY]: QUERY_PARAMS_SPEED
            }


        }

    },
};

const MOCK_RESPONSE_DEFINITION = {
    [RESPONSE]: {
        template: { message: "hello world2:String" }
    },
    cars: {
        [RESPONSE]: {
            template: {
                cars: [
                    {
                        id: "{{datatype.uuid}}:string",
                        manufacturer: "{{vehicle.manufacturer}}:string",
                        model: "{{vehicle.model}}:string",
                        pass: () => () => Math.floor(Math.random() * 10),
                        fuelTypes: [],
                        owner: "",
                        cost: null
                    }
                ],
            },
            dynamicKeys: [BIND(DKEY_CAR_ID, "id")],
            filter: (responseData, req) => {
                let cars = responseData.cars;
                console.log(">", responseData)
                let start = Number((req.query && req.query.start) || 0);
                let limit = Number((req.query && req.query.limit) || cars.length + 1);
                let model = (req.query && req.query.model) || null;
                return cars.slice(start, start + limit).filter((car => model ? car.model === model : true));
            }
        },

        id: {
            [RESPONSE]: {
                template: (url) => (req, mData, proto) => {
                    let allCars = mData["/cars"][METHOD.GET].data.cars;
                    let id = req.params[DKEY_CAR_ID];
                    let selected = allCars.find(car => car.id === id);
                    let vin = faker.vehicle.vin();
                    let data = Object.assign({ vin }, selected);

                    // without this line, mock will revaluate vin every time (see speed as an example)
                    setMockData(url, proto, data);
                    return data;
                }
            },

            speedGet: {
                [RESPONSE]: {
                    template: () => (req) => {
                        let isKM = !(req.query && req.query.isKM === "false");
                        //Note we did not set mock data, every time this route will be called, function revaluates.
                        return { speed: `${faker.datatype.number(160 * (isKM ? 1 : 0.62))}${isKM ? "kph" : "mph"}` };
                    }
                }
            }
        },
        permissions: {
            [RESPONSE]: {
                template: () => (req, mockData, proto, resOverride) => {
                    // example how to override response, 
                    // once you invoke resOverride, you must handle response yourself
                    let res = resOverride();
                    res.status(401);
                    res.send('User does not have permission to view this section');
                }
            }
        }
    }
}


initRoutes(joinResponseRoutes(ROUTES1, MOCK_RESPONSE_DEFINITION));
initRoutes(ROUTES2);


// Sending path arguments as an object ,and  Query params an array
mockFetch(getRoute(ROUTES1.cars, { pathArgs: { [DKEY_CAR_ID]: "mike" }, queryParams: [10, "subaru", "red"] }));
//Fetch:[GET]:[https://my-mock.com/cars/mike?carsLimit=10&carsType=subaru&carsColor=red]

//------------------------------

//Sending path arguments as a string (works for single path), and Query param as object
mockFetch(getRoute(ROUTES2.cars.id, { pathArgs: "MIKE", queryParams: { color: "gold" } }));
//Fetch:[GET]:[https://my-mock.com/cars/MIKE?color=gold]

//------------------------------

//Sending multiple path args
mockFetch(getRoute(ROUTES1.cars.id.passenger.id, { pathArgs: { [DKEY_CAR_ID]: "mike", pid: "p1" } }));
//Fetch:[GET]:[https://my-mock.com/cars/mike/passenger/p1]

//------------------------------

// user defined query params, note that definition in ROUTES1.cars.id.speedPost has no BODY function, so what is given is sent
mockFetch(getRoute(ROUTES1.cars.id.speedPost, { pathArgs: { [DKEY_CAR_ID]: "fiat" }, queryParams: "name=ferret&color=purple", bodyParams: 120 }))
// Fetch:[POST]:[https://my-mock.com/cars/fiat/speed?name=ferret&color=purple]
// with the following body:
// 120

//------------------------------

// user defined query params, here in ROUTES2.cars.id.speedPost we have a body function, what is given will be sent to function
mockFetch(getRoute(ROUTES2.cars.id.speedPost, { pathArgs: { [DKEY_CAR_ID]: "fiat" }, queryParams: "isKm=true", bodyParams: 120 }))
// Fetch:[POST]:[https://my-mock.com/cars/fiat/speed?isKm=true]
// with the following body:
// { speed: 120 }

//------------------------------


/**
 * Fake fetch API to simulate real use case
 * @param {*} route 
 */
function mockFetch(route) {
    let BASE_API = "https://my-mock.com";
    let url = BASE_API + route.path();
    console.log(`Fetch: [${route.protocol}]: [${url}]`);
    if (route.body) {
        console.log("with the following body:");
        console.log(route.body);
    }

}
//let fs = require("fs");
//var key = fs.readFileSync("key");
//var cert = fs.readFileSync("cert");
mock(ROUTES1, {
    defaultRes: (req, res) => { res.sendStatus(404); },
    defaultListSize: 4,
    interceptor: (req, res, next, mData) => {
        if (mData[req.url]) {
            res.set("x-mock-data", "true");
        }
        next();
    }
    //port: 3400,
    //defaultRes: (req, res) => res.sendStatus(404),
    //https: { key, cert },
});
