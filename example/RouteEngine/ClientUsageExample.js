/**
 * Optional additions (not part of the mock service)
 * 
 * This file demonstrates the usage of the route creator engine, where applications can use the route definition
 * To manage api calls with parameter checking, and structure integrity check.
 * 
 * in this file we use the previously defined Routes from ./RoutesDefinitionExample.js
 * 
 * This is an addition to the mock, users who want to utilize the fact that the route paths are defined in mock,
 * and instead of recreating this path tree, 
 * can use it to get the path and have the bonus of path correctness being validated
 */

import { RouteCreator } from "auto-route-creator";
import { ROUTES1, ROUTES2, DKEY_CAR_ID } from "./RoutesDefinitionExample";
import fetch from "node-fetch";
let { getRoute } = RouteCreator;

// Sending path arguments as an object 
fakeFetch(getRoute(ROUTES1.cars.id, { pathArgs: { [DKEY_CAR_ID]: "mike" } }));
//Fetch:[GET]:[https://my-mock.com/cars/mike]
//------------------------------

//Sending path arguments as a string (works for single path)
fakeFetch(getRoute(ROUTES2.cars.id, { pathArgs: "MIKE" }));
//Fetch:[GET]:[https://my-mock.com/cars/MIKE]
//------------------------------

//Sending Query params as an object
fakeFetch(getRoute(ROUTES1.cars, { queryParams: { limit: 4, startFrom: 2 } }));
// Fetch: [GET]: [https://my-mock.com/cars?limit=4&startFrom=2]
//------------------------------

//Sending Query params as an array
fakeFetch(getRoute(ROUTES1.cars, { queryParams: [4, 2, "honda"] }));
// Fetch: [GET]: [https://my-mock.com/cars?limit=4&startFrom=2&manufacturer=honda]
//------------------------------

//Sending multiple path args
fakeFetch(getRoute(ROUTES1.cars.id.passenger.id, { pathArgs: { [DKEY_CAR_ID]: "mike", pid: "p1" } }));
//Fetch:[GET]:[https://my-mock.com/cars/mike/passenger/p1]
//------------------------------

// user defined query params, note that definition in ROUTES1.cars.id.speedPost has no BODY function, so what is given is sent
fakeFetch(getRoute(ROUTES1.cars.id.speedPost, { pathArgs: { [DKEY_CAR_ID]: "fiat" }, queryParams: "name=ferret&color=purple", bodyParams: 120 }))
// Fetch:[POST]:[https://my-mock.com/cars/fiat/speed?name=ferret&color=purple]
// with the following body:
// 120
//------------------------------

// user defined query params, here in ROUTES2.cars.id.speedPost we have a body function, what is given will be sent to function
fakeFetch(getRoute(ROUTES2.cars.id.speedPost, { pathArgs: { [DKEY_CAR_ID]: "fiat" }, queryParams: "isKm=true", bodyParams: 120 }))
// Fetch:[POST]:[https://my-mock.com/cars/fiat/speed?isKm=true]
// with the following body:
// { speed: 120 }
//------------------------------
// Test the auto mock (run the Mock Server Usage Example - npm run mock:example)

let mockTest = async () => {
    try {
        let getAllCarsRes = await fetchFromMock(getRoute(ROUTES1.cars));
        console.log("CAR", cars);
        let firstCarId = getAllCarsRes.cars[0].id;
        let firstCar = getRoute(ROUTES1.cars.id, { pathArgs: { [DKEY_CAR_ID]: firstCarId }, queryParams: [10, "subaru", "red"] })
    } catch (_) {
        console.log("Failed to fetch, check if server is running (npm run mock:example)");
    }
};
mockTest();




/**
 * Fake fetch API to simulate real use case
 * @param {*} route 
 */
function fakeFetch(route) {
    let BASE_API = "https://my-mock.com";
    let url = BASE_API + route.path();
    console.log(`Fake Fetch: [${route.protocol}]: [${url}]`);
    if (route.body) {
        console.log("with the following body:");
        console.log(route.body);
    }
}



//If mock server is up (this will print mock results to above queries)
function fetchFromMock(route) {
    const BASE_API = "http://localhost:3004";
    const URL = BASE_API + route.path();
    let fetchOptions = {
        method: route.protocol,
        body: route.body
        //headers,
        // mode: "no-cors",
        //cache: 'no-cache'
    }
    return fetch(URL, fetchOptions)
        .then(rj => {
            const contentType = rj.headers.get("content-type");
            if (rj.status != 200)
                console.log(`${URL} failed with status ${rj.status}`);
            if (contentType && contentType.indexOf("application/json") !== -1)
                return rj.json();
            return rj.text();
        });
}


function fetchExample(route) {
    const BASE_API = "http://localhost:3004";
    const URL = BASE_API + route.path();
    let fetchOptions = {
        method: route.protocol,
        body: route.body
    }
    return fetch(URL, fetchOptions).then(rj => rj.json());
}
