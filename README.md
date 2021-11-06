[![NPM version][npm-image]][npm-url]

Client Side Routes Manager, enables route validation, completion and definition.
enables creating a quick automatic mock, using the defined routes.

## Installation

```
$ npm install auto-route-creator  --save
```

## Basic Usage

a more comprehensive example can be found in [example folder](https://github.com/mikehn/autoRouteJs/tree/master/example)

### Route Definition

```Javascript
import { RouteCreator } from "auto-route-creator";
let { METHOD, SYMBOLS, getRoute } = RouteCreator;
let { PROTOCOL, DYNAMIC, QUERY, NAME } = SYMBOLS;
const DKEY_CAR_ID = "CID";
const DKEY_D_ID = "DID";

//Define your server routes as a tree
const MY_ROUTES = {
    cars: {
        [PROTOCOL]: METHOD.GET,
        [QUERY]: ["limit", "startFrom", "model"], // Query param
        id: {
            [DYNAMIC]: DKEY_CAR_ID, // Marks this as a dynamic part of route
            drivers: {
                [PROTOCOL]: METHOD.POST,
                id: {
                    //Note that when no protocol is defined GET is assumed
                    [DYNAMIC]: DKEY_D_ID
                }
            },
        }
    }
}
RouteCreator.initRoutes(MY_ROUTES)
export { MY_ROUTES };


//// Example usegae (this would be placed in logical locations in your app)

let CAR_ROUTE = getRoute(MY_ROUTES.cars.id, { pathArgs: { [DKEY_CAR_ID]: "1234" } });

fetchExample(CAR_ROUTE).then(car=>console.log());

function fetchExample(route) {
    const BASE_API = "http://localhost:3004";
    const URL = BASE_API + route.path();
    let fetchOptions = {
        method: route.protocol,
        body: route.body
    }
    return fetch(URL, fetchOptions).then(rj => rj.json());
}

```

one major advantage defining routes this way is we get auto complete, and refactoring is extremely easy.
i.e. imagine we decide to move the drivers path up one level so it is not under a specific car id.

If routes were defined in a non tree way, you would have to change all dependent routes.
in our example we would simply cut and paste and get

```Javascript
const MY_ROUTES = {
    cars: {
        [PROTOCOL]: METHOD.GET,
        [QUERY]: ["limit", "startFrom", "model"], // Query param

        drivers: {
                [PROTOCOL]: METHOD.POST,
                id: {
                    //Note that when no protocol is defined GET is assumed
                    [DYNAMIC]: DKEY_D_ID
                }
        },

        id: {
            [DYNAMIC]: DKEY_CAR_ID, // Marks this as a dynamic part of route

        }
    }
}
```

as all usage depends on structure, you would get an error areas where previous path was used and not updated, making sure you do not forget to update.
even better, if you have a refactor tool the change is seamless.

### Automatic Mock Definition

with a few additions, you can get an automatic mock server filled with random values based on your route definition.

```Javascript
import { AutoMock, RouteCreator } from "auto-route-creator";
let { BIND, SYMBOLS } = RouteCreator;
let { setMockData, getMockData } = AutoMock;

const { RESPONSE } = SYMBOLS;

const MOCK_RESPONSE_DEFINITION = {
    cars: {
        [RESPONSE]: {
            template: {
                cars: [
                    {
                        id: "{{datatype.uuid}}:string",
                        manufacturer: "{{vehicle.manufacturer}}:string",
                        model: "{{vehicle.model}}:string",
                        condition: "[Excellent|Very Good|Good|Fair]:string",
                    }
                ]
            },
            dynamicKeys: [BIND(DKEY_CAR_ID, "id")]
        },

        id: {
            [RESPONSE]: {
                template: {
                    color:"[blue|white|black]:string",
                    //Static - will be evaluated once
                    year: (url)=>"200"+Math.floor(Math.random()*10),
                    //Dynamic - will be evaluated at runtime
                    speed: (url)=>(req, data, proto)=>Math.floor(Math.random()*100)
                }
            },
        }
    }
};

//usually in a separate location join the 2 definitions (ROUTES + MOCK)
const MOCK_JOINED_DEF = RouteCreator.joinResponseRoutes(MY_ROUTES, MOCK_RESPONSE_DEFINITION);
//Run Mock server
AutoMock.mock(MOCK_JOINED_DEF,{port:3004});
```

as you can see above there are various ways to create mock data, simplest is by utilizing the random values generator [faker-js](https://github.com/marak/Faker.js/) under the hood to parse string and create random values.
i.e. in the above example we used

```Javascript
 cars: [
            {
                id: "{{datatype.uuid}}:string",
                ...
            }
        ]
```

in the above example, cars gets an array, telling the mock server this is an array value, the object inside the array is what will fill the array.

In the object above we mock the car object, focusing on the `object.id`, its value is generated with the following pattern

```Javascript
 { id: "{{datatype.uuid}}:string" }
```

where `"{{datatype.uuid}}"` part is the pattern for generating random uuid (uses [faker-js](https://github.com/marak/Faker.js/) syntax) and `string` marks the data type to convert into.

note you can also generate your own values using a function instead of a string value.
i.e.

```Javascript
year: (url)=>"200"+Math.floor(Math.random()*10), // will be generated once on bring up
```

By returning another function from that function you can generate values at run time.
To learn more read below

```Javascript
year: ()=>()=>"200"+Math.floor(Math.random()*10), // will be regenerated on every request
```

## Defining Request Routes

Define your routes by creating a Object representing routes as a tree
i.e. if you have the following route `/cars/:id/speed` it will be represented as

```Javascript
let ROUTES = {
    cars:{
        id:{
            [DYNAMIC]: "cid", //more on this below
            speed:{
                // route definitions
            }
        }
    }
}
```

adding a different route `/cars/:id/passenger` requires only to add another child under id.
by using the following symbols, inside each paths object you can describe the request as follows:

| Request Symbols | Definition                                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PROTOCOL        | used to define route protocol (defaults to GET, use RouteCreator.METHOD for enums)                                                                                                                                                                                                                                                                                          |
| DYNAMIC         | a string value that marks this part of route as dynamic, i.e. `/cars/:id` the id part is dynamic and should be supplied for request, if not an error will be issued. the value should be a unique name used to reference this id later on                                                                                                                                   |
| NAME            | a string value used to change the default name of the path part, which is the path object key                                                                                                                                                                                                                                                                               |
| QUERY           | used to define the request query param keys, if wrong keys supplied a warning is issued, can receive a string array (i.e. `["limit","StartFrom"]`) defining the query keys, or a function for any custom validation or processing you might require (see [example](https://github.com/mikehn/autoRouteJs/blob/master/example/DefinitionExample/RoutesDefinitionExample.js)) |
| BODY            | function given here will be used on supplied body and replace route body with its return value                                                                                                                                                                                                                                                                              |

once definition is complete, routes should be initialized using the init function `initRoutes(ROUTES)`

note this function works in place and does not return a value, this is to alow the definition object to retain its structure and features such as refactor auto complete and such.

A full example of routes [here](https://github.com/mikehn/autoRouteJs/blob/master/example/DefinitionExample/RoutesDefinitionExample.js)

## Using request routes definition

once you have routes defined and initialized you can use them to generate your request path and headers by calling the `RouteCreator.getRoute` function

for example

```Javascript
let options = {
     pathArgs: { "cid": "mike" }, // Note "cid" is the DYNAMIC name we gave earlier in route definition
     queryParams: [2, 0, true]
};

let  route = getRoute(ROUTES.cars.id.checkups, options);
// /cars/mike?carsLimit=10&carsType=subaru&carsColor=red
```

### getRoute API

```Javascript
let route = getRoute(routeObject,Options)
```

gets the route object of the given path and options.

<b>arguments</b>

- <b>routeObject</b> - is a path in the previously defined ROUTE object.
- <b>Options</b> - an object in the following format `{pathArgs:..., queryParams:...,bodyParams:,...}` where:
  - `pathArgs` - holds the paths dynamic parts values, should be an object with the key matching the name given in the `[DYNAMIC]` part of the route and the value the path value. i.e. `{cid:1234}` will replace the car id part of the route with `1234`
  - `queryParams` - hold the query param values can be an object with key/value matching the query param name and value or an array of values fitting query param declaration order
  - bodyParams - holds body of message, can be in any format, if `[BODY]` was supplied in route, this value will be passed through the `[BODY]` function first.

<b>return value</b>

object representing the route and all its data
object has following properties:

- `route.path()` - returns the string representation of the path with query params and path parts
- `route.body` - request body
- `route.protocol` - request protocol

usage Example

```Javascript
// route is defined and supplied with path argument
// if argument was missing a warning would be issued
let CAR_ROUTE = getRoute(MY_ROUTES.cars.id, { pathArgs: { [DKEY_CAR_ID]: "1234" } });
//fetch wrapper
fetchExample(CAR_ROUTE).then(car=>console.log());

//function takes the route object and constructs a fetch request
function fetchExample(route) {
    const BASE_API = "http://localhost:3004";
    const URL = BASE_API + route.path();
    let fetchOptions = {
        method: route.protocol,
        body: route.body
    }
    return fetch(URL, fetchOptions).then(rj => rj.json());
}
```

## Mock definition

Bu default you can run mock as is on all routes, you will however receive a message for every route that no definition was supplied, to define return values, you can add definitions on the routes object itself, which is not recommended as you want to separate routes definition from the mock definition.

see full usage example [here](https://github.com/mikehn/autoRouteJs/blob/master/example/EndUsageExample/ClientUsageExample.js)

[npm-image]: https://img.shields.io/npm/v/auto-route-creator.svg?style=flat-square
[npm-url]: https://npmjs.org/package/auto-route-creator
