[![NPM version][npm-image]][npm-url]

Client Side Routes Manager, enables route validation, completion and definition.
enables creating a quick automatic mock, using the defined routes.

## Installation

```
$ npm install react-dropdown  --save
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
let CAR_ROUTE = getRoute(MY_ROUTES.cars.id, { pathArgs: { [DKEY_CAR_ID]: "1234" } });
//Use this in your fetch commands
console.log(CAR_ROUTE.path()); // Prints:   /cars/1234
console.log(CAR_ROUTE.protocol);// Prints:   GET

export { MY_ROUTES };
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
//TBD
```

[npm-image]: https://img.shields.io/npm/v/react-dropdown.svg?style=flat-square
[npm-url]: https://npmjs.org/package/auto-route-creator.svg
