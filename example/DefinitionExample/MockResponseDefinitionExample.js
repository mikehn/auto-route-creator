import { AutoMock, RouteCreator } from "auto-route-creator";
import { DKEY_CAR_ID } from "./RoutesDefinitionExample";
let { getRoute, BIND, METHOD, SYMBOLS } = RouteCreator;
let { autoMock, setMockData, getMockData } = AutoMock;

const { RESPONSE } = SYMBOLS;

const MOCK_RESPONSE_DEFINITION = {
    [RESPONSE]: {
        template: { message: "hello world:String" }
    },
    cars: {
        [RESPONSE]: {
            template: {
                cars: [
                    {
                        id: "{{datatype.uuid}}:string",
                        manufacturer: "{{vehicle.manufacturer}}:string",
                        model: "{{vehicle.model}}:string",
                        condition: "[Excellent|Very Good|Good|Fair]",
                    }
                ]
            },
            dynamicKeys: [BIND(DKEY_CAR_ID, "id")]
        },

        id: {
            [RESPONSE]: {
                template: (url) => (req, mData, proto) => {
                    let allCars = mData["/cars"][METHOD.GET].cars;
                    let id = req.params[DKEY_CAR_ID];
                    let selected = allCars.find(car => car.id === id);
                    let vin = faker.vehicle.vin();
                    let data = Object.assign({ vin }, selected);

                    // without this line, mock will revaluate vin every time (see speed as an example)
                    setMockData(url, proto, data);
                    return data;
                }
            },

            checkups: {
                
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

    }
}


export { MOCK_RESPONSE_DEFINITION };