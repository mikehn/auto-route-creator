import { AutoMock, RouteCreator } from "auto-route-creator";
import { DKEY_CAR_ID } from "./RoutesDefinitionExample";
import faker from "faker";
let { BIND, METHOD, SYMBOLS } = RouteCreator;
let { setMockData, getMockData } = AutoMock;

const { RESPONSE } = SYMBOLS;

const MOCK_RESPONSE_DEFINITION = {
    [RESPONSE]: {
        template: { message: "hello world:String" }
    },
    cars: {
        [RESPONSE]: {
            // Response template
            template: {
                cars: [ // note this is an array, meaning anything defined inside will be auto generated multiple times (depending on mock options)
                    {  // template here is object of keys and values that are strings in the following format <random-expression>:<type>  
                        id: "{{datatype.uuid}}:string", //datatype.uuid - will generate random uuid (random expression defaults to fakerjs expression)
                        manufacturer: "{{vehicle.manufacturer}}:string",
                        model: "{{vehicle.model}}:string",
                        condition: "[Excellent|Very Good|Good|Fair]", // can use [] as a shorthand for multiple values.
                    }
                ]
            },

            // can add a filter function that is called every time on the generated response
            filter: (responseData, req) => {
                let cars = responseData.cars;
                let start = Number((req.query && req.query.start) || 0);
                let limit = Number((req.query && req.query.limit) || cars.length + 1);
                let manufacturer = (req.query && req.query.manufacturer) || null;
                return cars.slice(start, start + limit).filter((car => manufacturer ? car.manufacturer === manufacturer : true));
            },

            //use this to bind a template value to 
            dynamicKeys: [BIND(DKEY_CAR_ID, "id")]
        },

        id: {
            [RESPONSE]: {
                //template can be a function as well, which return value will be the response value, if the return value is a function,
                // then it will be called on every request, as opposed to being called once and cached.
                template: (url) => (req, mData, proto) => {
                    let allCars = mData["/cars"][METHOD.GET].data.cars;
                    let id = req.params[DKEY_CAR_ID];
                    let selected = allCars.find(car => car.id === id);
                    let vin = faker.vehicle.vin();
                    let data = Object.assign({ vin }, selected);

                    // use setMockData to cache result  
                    // without this line, mock will revaluate vin every time (see speed as an example)
                    setMockData(url, proto, data);
                    return data;
                }
            },

            passenger: {
                [RESPONSE]: {
                    template: { // you can mix functions with string values in template decalaration
                        id: "{{datatype.uuid}}:string",
                        name: (url) => { // this function will be called once and cached (name will not be regenerated below.)
                            let gender = Math.random() < 0.2 ? 1 : 0;
                            return faker.name.findName(null, null, gender);
                        }
                    }
                }
            },

            speedGet: {
                [RESPONSE]: {
                    //here we use a function that returns function without caching, if you invoke this request several times you will get different speed every time.
                    template: () => (req) => {
                        let isKM = !(req.query && req.query.isKM === "false");
                        //Note we did not set mock data, every time this route will be called, function revaluates.
                        return { speed: `${faker.datatype.number(160 * (isKM ? 1 : 0.62))}${isKM ? "kph" : "mph"}` };
                    }
                }
            }
        },

    }
}

const MOCK_JOINED_DEF = RouteCreator.joinResponseRoutes(ROUTES1, MOCK_RESPONSE_DEFINITION);
AutoMock.mock(MOCK_JOINED_DEF, { port: 3004 });
