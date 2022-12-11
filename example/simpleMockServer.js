import { RouteCreator, AutoMock } from "auto-route-creator";
let { BIND } = RouteCreator;
let { RESPONSE, DYNAMIC } = RouteCreator.SYMBOLS;

const ROUTES = {
    users: {
        [RESPONSE]: {
            template: [{
                id: "{{datatype.uuid}}:string",
                level: "[1|3|4|8|12]:number",
                name: "{{name.firstName}}:string",
                email: "{{internet.email}}:string",
                address: "{{address.streetAddress}}, {{address.state}}, {{address.zipCode}}:string",
                createdAt: "{{date.past}}:string",
            }],

            dynamicKeys: [BIND("uid", "id")],
        },
        id: {
            [DYNAMIC]: "uid",
            [RESPONSE]: {
                template: {
                    email: "{{internet.email}}:string",
                }
            }
        }

    },
    cars: {
        [RESPONSE]: {
            template:
                [
                    {
                        id: "{{datatype.uuid}}:string",
                        manufacturer: "{{vehicle.manufacturer}}:string",
                        // invoked once at creation time
                        passengers: () => Math.floor(Math.random() * 10),
                        // invoked on every API call
                        currentSpeed: () => () => Math.floor(Math.random() * 160),
                        fuelType: "[Gasoline|Diesel|Ethanol]:string",
                        cost: "{{datatype.number}}:number"
                    }
                ],

            // a filter function that is called every time on the generated response
            filter: (responseData, req) => {
                let fuel = (req.query && req.query.fuel);
                if (fuel)
                    return responseData.filter(({ fuelType }) => fuelType == fuel);
                return responseData;
            },

        },
    },
};

RouteCreator.initRoutes(ROUTES);
AutoMock.mock(ROUTES, {
    port: 3004,
    defaultListSize: 10,
    interceptor: (req, res, next, mData) => {
        if (req.url == '/users') {
            //do some actions, i.e. delay / redirect etc.
            console.log("Got users request, delaying response")
            setTimeout(() => { next(); }, 2000);
        } else {
            next();
        }
    },
});

/*
AutoMock.mock(MOCK_ROUTES, {
    defaultListSize: REPETITION_COUNT,
    port: process.env.MOCK_PORT ?? DEFAULT_PORT,
    defaultRes: (req, res) => res.sendStatus(404),
    interceptor: (req, res, next, mData) => {
      //console.log("mData", mData);
      //remove query params and hash from url
      let path = req.url?.split(/[?#]/)[0];
  
      if (path && mData[path] && mData[path][req.method]) {
        const requestMetaData = mData[path][req.method]?.metadata;
        if (!requestMetaData?.isEmptyResponse) {
          const routeId = requestMetaData?.id;
          //Anything not in map is included by default.
          const isMocked = enabledRoutesMap[routeId] ?? true;
          if (isMocked) res.set("x-mock-source", "true");
        }
      }
      next();
    },
    log: true,
    https: { key, cert },
  });
  */
