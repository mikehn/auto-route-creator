/**
 * Optional additions (not part of the mock service)
 * 
 * This file demonstrates the usage of the route creator engine, where applications can use the route definition
 * To manage api calls with parameter checking, and structure integrity check.
 * 
 * in this specific file we define the rest of the path parameters
 * 
 * This is an addition to the mock, users who want to utilize the fact that the route paths are defined in mock,
 * and instead of recreating this path tree, 
 * can use it to get the path and have the bonus of path correctness being validated
 */

import { AutoMock, RouteCreator } from "auto-route-creator";
let { initRoutes, getRoute, joinResponseRoutes, BIND, METHOD, SYMBOLS } = RouteCreator;
let { autoMock, setMockData, getMockData } = AutoMock;
import faker from "faker";

/**
 * Routes tree definition, 
 * the following Symbols define:
 * PROTOCOL : protocol used in route
 * DYNAMIC  : if this part of route is a variable to be supplied
 * NAME : route path part, if not given key will be taken as route path part
 * ROUTE: Route object corresponding to tree (NOTE: this is auto generated in init function)
 */
let { PROTOCOL, DYNAMIC, NAME, QUERY, BODY } = SYMBOLS;


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
        [QUERY]: ["limit", "startFrom", "manufacturer"],
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
                //if not specified will default to GET
            }
        }
    },
};

const ROUTES2 = {

    cars: {
        [PROTOCOL]: METHOD.GET,
        id: {
            [DYNAMIC]: DKEY_CAR_ID,
            checkups: {
                [QUERY]: ["limit", "startFrom", "isPass"],
            },
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



initRoutes(ROUTES1);
initRoutes(ROUTES2);


export { ROUTES1, ROUTES2, DKEY_CAR_ID };


