import { mock, PATH_SYMBOLS } from "auto-route-creator";

let { RESPONSE } = PATH_SYMBOLS;

const ROUTES = {
    cars: {
        [RESPONSE]: {
            template:
                [
                    {
                        id: "{{datatype.uuid}}:string",
                        manufacturer: "{{vehicle.manufacturer}}:string",
                        fuelType: "[Gasoline|Diesel|Ethanol]:string",
                        cost: "{{datatype.number}}:number",
                        // invoked once at creation time 
                        passengers: () => Math.floor(Math.random() * 10),
                        // invoked on every API call (only use if need updating values on each call)
                        currentSpeed: () => () => Math.floor(Math.random() * 160),
                    }
                ],

            // optional : a filter function that is called every time on the generated response
            filter: (responseData, req) => {
                let fuel = (req.query && req.query.fuel);
                if (fuel)
                    return responseData.filter(({ fuelType }) => fuelType == fuel);
                return responseData;
            },

        },
    },
};

// Start the mock
mock(ROUTES);
