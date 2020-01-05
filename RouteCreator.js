//TODO: Add query params handling
//TODO: Add Body suport

/**
 * File Describes API routes.
 */

//Key represents :  protocol used in route (i.e. GET)
const PROTOCOL = Symbol("PROTOCOL");
//Key represents : if current path segment is dynamiclly supplied (i.e. generated id)
const DYNAMIC = Symbol("DYNAMIC");
//Key represents : [private usage] a part of the route tree section (non leaf)
const ROUTE = Symbol("ROUTE");
//Key represents : [optional] by default route path is taken by key name, unless NAME is given.
const NAME = Symbol("NAME");
//const PARAMS = Symbol("PARAMS"); 

function warnLog(...message){
    console.warn(...message);
}


function errorLog(...message){
    console.error(...message);
}

const METHOD = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE'
}

/**
 * Routes tree definition, 
 * the following Symbols define:
 * PROTOCOL : protocol used in route
 * DYNAMIC  : if this part of route is a variable to be supplied
 * NAME : route path part, if not given key will be taken as route path part
 * ROUTE: Route object corresponding to tree (NOTE: this is auto generated in init function)
 */
let Routes = {

    activation: {
        [PROTOCOL]: METHOD.GET,
        serialNumber: {
            [DYNAMIC]: true,
            [PROTOCOL]: METHOD.PUT
        }
    },

    org: {
        [PROTOCOL]: METHOD.GET,

        id: {
            [DYNAMIC]: true,
            fleet: {
                id: {
                    [DYNAMIC]: true,
                    activation: {
                        [PROTOCOL]: METHOD.GET,
                        serialNumber: {
                            [DYNAMIC]: true,
                            [PROTOCOL]: METHOD.PUT
                        }
                    }
                }
            },
            user: {
                permissions: {
                    [PROTOCOL]: METHOD.GET
                }
            },

            vehicle: {
                [PROTOCOL]: METHOD.GET,
                metadata: {
                    [PROTOCOL]: METHOD.GET,
                }

            }
        }
    }
}

/**
 * Represents a Single route 
 * used to get full route path
 */
class Route {

    constructor(name, protocol = METHOD.GET, fatherRoute = null, isDynamic = false) {
        this.name = name;
        this.isDynamic = isDynamic;
        this.fatherRoute = fatherRoute;
        this.protocol = protocol;
        this.dynamicCount = isDynamic ? 1 : 0;
        if (this.fatherRoute) {
            this.dynamicCount += this.fatherRoute.dynamicCount;
        }
        this.body = null;
    }

    /**
     * get current route path with the supplied dynamic parts
     * @param  {...String} args path dynamic parts
     */
    path(...args) {
        const DELIM = "/";
        let fPath = "";

        if (args.length != this.dynamicCount) {
            //ERROR
            errorLog("WARNING : received wrong amount of variables [got:", args.length, " expected:", this.dynamicCount, "]");
        }

        if (this.fatherRoute) {
            let fatherArgs = args.slice(0, this.fatherRoute.dynamicCount);
            fPath = this.fatherRoute.path(...fatherArgs);
        }
        let name = (this.isDynamic) ? args[this.dynamicCount - 1] : this.name;
        return fPath + DELIM + name;
    }

    setBody(data) {
        if(this.protocol === METHOD.GET){
            warnLog("body of GET request is mostly ignored, are you sure you meant to set body ?");
        }
        this.body = data;
    }
}

/**
 * return true if given value is an object
 * @param {any} value value to be checked if object
 */
function isObject(value) {
    return value && typeof value === 'object' && value.constructor === Object;
}

/**
 * Adds Route object to the given route tree
 * @param {*} data route tree
 * @param {*} name name of current route part
 * @param {*} prefix Route object representing father route
 */
function initRoutes(data, name = null, prefix = null) {
    let curRouteGetter = null;
    if (name) {
        if (data[NAME]) {
            name = data[NAME];
        }
        let protocol = data[PROTOCOL];
        let isDynamic = !!data[DYNAMIC];
        curRouteGetter = () => new Route(name, protocol, prefix, isDynamic);
        Object.defineProperty(data, ROUTE, { get: curRouteGetter });
        //data[ROUTE] = curRouteGetter;
    }
    Object.keys(data).forEach(key => {
        if (isObject(data[key])) {
            initRoutes(data[key], key, curRouteGetter && curRouteGetter());
        }
    });
}


initRoutes(Routes);

function test() {
    let r = Routes.org.id;
    console.log("T:", r[ROUTE]);
    console.log("T:", r[ROUTE].path());
    return
}

test();

//export {Routes,METHOD,ROUTE};


