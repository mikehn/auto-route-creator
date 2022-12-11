[![NPM version][npm-image]][npm-url]

Auto route creator enables you to bring up a mock server simulating real looking data in minutes, you only supply a template of the data and Auto Route Creator will generate thousands of random data entries based on the given template. in addition Auto Route Creator is fully customizable and enables adding interceptors, route actions and more

## Installation

```
$ npm install auto-route-creator
```

## Basic Usage

Using auto-route-creator we can serve 1000 users records with just a few lines of code
every user having a unique id with a real random name, email, address and so on.

```javascript
import { mock, PATH_SYMBOLS } from 'auto-route-creator';

let { RESPONSE } = PATH_SYMBOLS;

const ROUTES = {
  users: {
    [RESPONSE]: {
      template: [
        {
          id: '{{datatype.uuid}}:string',
          grade: '[3|5|7|8|99]:string',
          firstName: '{{name.firstName}}:string',
          lastName: '{{name.lastName}}:string',
          email: '{{internet.email}}:string',
          address: '{{address.streetAddress}}, {{address.state}}:string',
          // invoked once at creation time
          // (use if need logic beyond template)
          age: () => Math.floor(Math.random() * 100),
          // invoked on every API call
          // (only use if updating values on each call)
          currentSpeed: () => () => Math.floor(Math.random() * 160),
        },
      ],

      // optional : a filter function
      // that is called every time on the generated response
      filter: (responseData, req) => {
        let ageFilter = req.query && req.query.age;
        if (ageFilter)
          return responseData.filter(({ age }) => age == ageFilter);
        return responseData;
      },
    },
  },
};

// Start the mock
mock(ROUTES, { port: 3004, defaultListSize: 1000 });
```

calling `http://localhost:3004/users` will retrieve 1000 user entries

Code breakdown

- defines the routes, This is the network path structure of your data, in the example above we defined a single route `const ROUTES = { users: {...}}`
  which corresponds to `http://localhost:3004/users`
- adds the response template ( `[RESPONSE]: {
  template:...}` ) to the path locations you want to mock, see below regarding the response template syntax.
- adds optional filter method ( `filter: (responseData, req) => ... ` ) which can be used to filter based on request parameters
- fires up the mock server `mock(ROUTES, { port: 3004, defaultListSize: 1000 });` here we supplied 2 options `port` and `defaultListSize` but this is optional, below you can see all options and their default values.

## Template

TBD

## Mock Options

## Advanced usage

a more comprehensive example can be found in [example folder](https://github.com/mikehn/autoRouteJs/tree/master/example)

### Binding Routes

Binding routes enables us to use response data from a route to generate routes based on those values,
as a common example, we can use user id's to create specific routes per user,

i.e. we have the following route `http://localhost:3004/users` which returns 2 users with id's `1234` and `1248`.

to get the users specific data we might have the following API calls

- `http://localhost:3004/users/1234`
- `http://localhost:3004/users/1248`

The mock can generate these automatically by using the BIND method.

below is an example usage of BIND
TBD

[npm-image]: https://img.shields.io/npm/v/auto-route-creator.svg?style=flat-square
[npm-url]: https://npmjs.org/package/auto-route-creator
