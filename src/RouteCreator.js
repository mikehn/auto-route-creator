//TODO: add exception and logging properties.

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
const QUERY = Symbol("QUERY");
const BODY = Symbol("BODY");

let SYMBOLS = { PROTOCOL, DYNAMIC, ROUTE, NAME, QUERY, BODY };

const METHOD = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE'
}

const IS_OBJ = (e) => (e !== null && typeof e === "object");
const IS_STR = (e) => (typeof e === 'string' || e instanceof String);
const IS_UNDEF = (e) => (typeof e === 'undefined');

function warnLog(...message) {
    console.warn(...message);
}

function errorLog(...message) {
    console.error(...message);
}

function getQueryString(queryObject) {
    console.log("queryObject", queryObject);
    if (!queryObject) return "";
    const OPEN_BRACE = '[';
    const QUERY_DELIM = '?';
    const CLOSE_BRACE = ']';
    const PARAM_DELIM = '=';
    const PARAN_GROUP_DELIM = "&";
    let getQueryStringRec = (queryObject, prefix) => {
        let queryString = [];
        for (let key in queryObject) {
            if (queryObject.hasOwnProperty(key)) {
                let curValue = queryObject[key];
                let curStr = prefix ? (prefix + OPEN_BRACE + key + CLOSE_BRACE) : key;
                let encodedStr = IS_OBJ(curValue) ?
                    getQueryStringRec(curValue, curStr)
                    :
                    encodeURIComponent(curStr) + PARAM_DELIM + encodeURIComponent(curValue);

                queryString.push(encodedStr);
            }
        }
        return queryString.join(PARAN_GROUP_DELIM);
    }
    return QUERY_DELIM + getQueryStringRec(queryObject);
}


function pathOptions(pathArgs, queryParams, bodyParams) {
    return { pathArgs, queryParams, bodyParams }
}

/**
 * Represents a Single route 
 * used to get full route path and path parameters
 */
class Route {

    constructor(name, protocol = METHOD.GET, query, fatherRoute = null, isDynamic = false, dynamicKey = null) {
        this.name = name;
        this.dynamicKey = dynamicKey;
        this.query = query;
        this.queryParams = undefined;
        this.pathArgs = undefined;
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
    path(options = {}) {
        const DELIM = "/";
        let fPath = "";
        let pathArgLength = 0;

        let { pathArgs, queryParams } = options;
        pathArgs = pathArgs || this.pathArgs;

        if (pathArgs) {
            if (Array.isArray(pathArgs)) {
                pathArgLength = pathArgs.length;
            } else if (IS_OBJ(pathArgs)) {
                pathArgLength = Object.keys(pathArgs).length;
            } else {
                pathArgs = [pathArgs];
                pathArgLength = pathArgs.length;
            }
        }
        if (pathArgLength != this.dynamicCount) {
            //ERROR
            errorLog("WARNING : received wrong amount of path arguments [got:", pathArgLength, " expected:", this.dynamicCount, "]");
        }

        if (this.fatherRoute) {
            let fatherArgs = pathArgs;
            if (Array.isArray(pathArgs))
                fatherArgs = pathArgs.slice(0, this.fatherRoute.dynamicCount);
            else if (IS_OBJ(pathArgs) && (this.dynamicKey in pathArgs)) {
                fatherArgs = Object.assign({}, pathArgs);
                delete fatherArgs[this.dynamicKey];
            }
            fPath = this.fatherRoute.path(pathOptions(fatherArgs));
        }
        let name = this.name;
        if (this.isDynamic) {
            if (Array.isArray(pathArgs)) {
                name = pathArgs[this.dynamicCount - 1];
            }
            else if (IS_OBJ(pathArgs)) {
                console.log("this.dynamicKey", pathArgs, this.dynamicKey)
                if (!this.dynamicKey || !IS_STR(this.dynamicKey)) {
                    errorLog("Did not supply key for the path part : [", name, "]");
                } else {
                    console.log("PATH", pathArgs)
                    if (IS_UNDEF(pathArgs[this.dynamicKey])) {
                        errorLog(`Need to supply in options value for key [${this.dynamicKey}] for path part ${name}`);
                    } else {
                        name = pathArgs[this.dynamicKey];
                    }
                }
            }
        }


        let qParams = queryParams || this.queryParams;
        if (qParams && !Array.isArray(qParams)) {
            qParams = [qParams];
        }

        console.log(">>>>", qParams);
        let qParamStr = qParams ? getQueryString(this.query(...qParams)) : "";
        return fPath + DELIM + name + qParamStr;
    }

    setQueryParams(...queryParams) {
        this.queryParams = queryParams;
    }

    setBody(data) {
        if (this.protocol === METHOD.GET) {
            warnLog("body of GET request is mostly ignored, are you sure you meant to set body ?");
        }
        this.body = data;
    }

    setPathArgs(pathArgs) {
        this.pathArgs = pathArgs;
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
        let defaultQuery = (...qParam) => {
            if (qParam.length > 0) {
                errorLog("No query params were defined, yet received following params ", JSON.stringify(qParam, null, 2))
            }
            return null;
        }

        let query = data[QUERY] || defaultQuery;
        if (typeof query !== "function") {
            let errorMessage = `Invalid type of QUERY supplied, expected function got :${typeof query}`;
            errorLog(errorMessage);
            query = () => { errorLog("Ignoring query:\n", errorMessage); }
        }
        let protocol = data[PROTOCOL] || METHOD.GET;
        let isDynamic = !!data[DYNAMIC];
        curRouteGetter = () => new Route(name, protocol, query, prefix, isDynamic, data[DYNAMIC]);
        Object.defineProperty(data, ROUTE, { get: curRouteGetter });
        //data[ROUTE] = curRouteGetter;
    }
    Object.keys(data).forEach(key => {
        if (isObject(data[key])) {
            initRoutes(data[key], key, curRouteGetter && curRouteGetter());
        }
    });
}

function getRoute(treePath, options = {}) {
    console.log("OP",options);
    let { pathArgs, queryParams, bodyParams } = options;
    let route = treePath[ROUTE];
    if (bodyParams)
        route.setBody(bodyParams);
    if (queryParams){
        if(!Array.isArray(queryParams))
            queryParams= [queryParams]
            console.log("queryParams",queryParams);
        route.setQueryParams(...queryParams);
    }if (pathArgs)
        route.setPathArgs(pathArgs);
    return route;
}

function getPath(treePath, options = {}) {
    let route = getRoute(treePath, options);
    return route.path();
}

export { METHOD, SYMBOLS, initRoutes, getPath, getRoute };


