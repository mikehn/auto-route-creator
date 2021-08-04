
import { SYMBOLS, METHOD, initRoutes, getRoute, getPath } from "../RouteCreator";
/**
 * Routes tree definition, 
 * the following Symbols define:
 * PROTOCOL : protocol used in route
 * DYNAMIC  : if this part of route is a variable to be supplied
 * NAME : route path part, if not given key will be taken as route path part
 * ROUTE: Route object corresponding to tree (NOTE: this is auto generated in init function)
 */
let { PROTOCOL, DYNAMIC, NAME, QUERY, BODY } = SYMBOLS;



let passengersQueryParams = ({ ageLimit, heightLimit }) => {
    if (!ageLimit)
        console.error("age must be supplied");
    if (ageLimit < 0 || ageLimit > 120) {
        console.error("age limit must be between 0-120 got", ageLimit);
        return null;
    }
    return Object.assign({ ageLimit }, heightLimit ? { heightLimit } : {});
}
let getCarsQueryParams = (carsLimit, carsType, carsColor) => ({ carsLimit, carsType, carsColor });
let getSpeedQueryParams = (isKm) => ({ isKm });

let speedPostBody = (speed) => ({ speed });
let speedPostQuery = (isKm) => ({ isKm });

const ROUTES1 = {

    cars: {
        [PROTOCOL]: METHOD.GET,
        id: {
            [DYNAMIC]: "cid",
            [QUERY]: getCarsQueryParams,
            passenger: {
                [PROTOCOL]: METHOD.GET,
                [QUERY]: passengersQueryParams,
                id: {
                    [DYNAMIC]: "pid",
                }
            },
            speed1: {
                [NAME]: "speed",
                [PROTOCOL]: METHOD.GET,
                [QUERY]: getSpeedQueryParams
            },
            speed2: {
                [NAME]: "speed",
                [PROTOCOL]: METHOD.POST,
                [BODY]: speedPostBody
            }
        }
    },
};

const ROUTES2 = {

    cars: {
        [PROTOCOL]: METHOD.GET,
        id: {
            [DYNAMIC]: true,
            [QUERY]: ["limit", "type", "color"],
            passenger: {
                [PROTOCOL]: METHOD.GET,
                [QUERY]: passengersQueryParams,

                id: {
                    [DYNAMIC]: true,
                }
            },
            speed1: {
                [NAME]: "speed",
                [PROTOCOL]: METHOD.GET,
                [QUERY]: getSpeedQueryParams
            },
            speed2: {
                [NAME]: "speed",
                [PROTOCOL]: METHOD.POST,
                [BODY]: speedPostBody,
                [QUERY]: speedPostQuery
            }


        }

    },

};





initRoutes(ROUTES1);
initRoutes(ROUTES2);

// Sending path arguments as an object ,and  Query params an array
mockFetch(getRoute(ROUTES1.cars.id, { pathArgs: { cid: "mike" }, queryParams: [10, "subaru", "red"] }));

//Sending path arguments as a string (works for single path), and Query param as object
mockFetch(getRoute(ROUTES2.cars.id, { pathArgs: "MIKE", queryParams: {color:"gold"} }));

mockFetch(getRoute(ROUTES1.cars.id.passenger.id, { pathArgs: { cid: "mike", pid: "p1" } }));
// user defined query params
mockFetch(getRoute(ROUTES1.cars.id.speed2, { pathArgs: { cid: "fiat" }, queryParams:"isKm=true", bodyParams: 120 }))

/**
 * Fake fetch API to simulate real use case
 * @param {*} route 
 */
function mockFetch(route) {
    let BASE_API = "https://my-mock.com";
    let url = BASE_API + route.path();
    console.log(`Fetch:[${route.protocol}]:[${url}]`);
    if (route.body) {
        console.log("with the following body:");
        console.log(route.body);
    }

}
