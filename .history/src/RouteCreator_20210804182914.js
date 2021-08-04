
//Key represents :  protocol used in route (i.e. GET)
const PROTOCOL = Symbol("PROTOCOL");
//Key represents : if current path segment is dynamically supplied (i.e. generated id)
const DYNAMIC = Symbol("DYNAMIC");
//Key represents : [private usage] a part of the route tree section (non leaf)
const ROUTE = Symbol("ROUTE");
//Key represents : [optional] by default route path is taken by key name, unless NAME is given.
const NAME = Symbol("NAME");
const QUERY = Symbol("QUERY");
const BODY = Symbol("BODY");
const RESPONSE = Symbol("RESPONSE");

let SYMBOLS = { PROTOCOL, DYNAMIC, ROUTE, NAME, QUERY, BODY, RESPONSE };

const METHOD = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
}

const EMPTY = null;

const IS_OBJ = (e) => (e !== null && typeof e === "object");
const IS_STR = (e) => (typeof e === 'string' || e instanceof String);
const IS_UNDEF = (e) => (typeof e === 'undefined');


var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARG_NAMES = /([^\s,]+)/g;
function getParamNames(func) {
    var functionText = func.toString().replace(STRIP_COMMENTS, '');
    var res = functionText.slice(functionText.indexOf('(') + 1, functionText.indexOf(')')).match(ARG_NAMES);
    if (res === null)
        res = [];
    return res;
}


function warnLog(...message) {
    console.warn(...message);
}

function errorLog(...message) {
    console.error(...message);
}

function getQueryString(queryFunc, queryParams) {
    const QUERY_DELIM = '?';
    if (!queryParams) return ""
    let qObject = queryParams;
    console.log("queryParams", queryParams, Array.isArray(queryParams), typeof queryParams === 'object')
    if (Array.isArray(queryParams))
        qObject = queryFunc(EMPTY, ...queryParams);
    else if (typeof queryParams === 'object') {
        console.log(Object.keys(queryParams), Object.values(queryParams))
        qObject = queryFunc(Object.keys(queryParams), ...Object.values(queryParams));
    }
    return QUERY_DELIM + (new URLSearchParams(qObject).toString());

    // if (!queryObject) return "";
    // const OPEN_BRACE = '[';
    // const QUERY_DELIM = '?';
    // const CLOSE_BRACE = ']';
    // const PARAM_DELIM = '=';
    // const PARAN_GROUP_DELIM = "&";
    // let getQueryStringRec = (queryObject, prefix) => {
    //     let queryString = [];
    //     for (let key in queryObject) {
    //         if (queryObject.hasOwnProperty(key)) {
    //             let curValue = queryObject[key];
    //             let curStr = prefix ? (prefix + OPEN_BRACE + key + CLOSE_BRACE) : key;
    //             let encodedStr = IS_OBJ(curValue) ?
    //                 getQueryStringRec(curValue, curStr)
    //                 :
    //                 encodeURIComponent(curStr) + PARAM_DELIM + encodeURIComponent(curValue);

    //             queryString.push(encodedStr);
    //         }
    //     }
    //     return queryString.join(PARAN_GROUP_DELIM);
    // }
    // return QUERY_DELIM + getQueryStringRec(queryObject);
}


function pathOptions(pathArgs, queryParams, bodyParams) {
    return { pathArgs, queryParams, bodyParams }
}

/**
 * Represents a Single route 
 * used to get full route path and path parameters
 */
class Route {

    constructor(name, protocol = METHOD.GET, query, fatherRoute = null, isDynamic = false, dynamicKey = null, pathParts = []) {
        this.name = name;
        this.dynamicKey = dynamicKey;
        this.query = query;
        this.queryParams = undefined;
        this.pathArgs = undefined;
        this.isDynamic = isDynamic;
        this.fatherRoute = fatherRoute;
        this.protocol = protocol;
        this.dynamicCount = isDynamic ? 1 : 0;
        this.pathParts = pathParts;
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
        const DYNAMIC_SYM = ":";
        const DELIM = "/";
        let fPath = "";
        let pathArgLength = 0;

        let { pathArgs, queryParams, isMock } = options;
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
        if ((pathArgLength != this.dynamicCount) && (!isMock)) {
            //ERROR
            errorLog("WARNING : received wrong amount of path arguments for ", this.name, " [got:", pathArgLength, " expected:", this.dynamicCount, "]");
        }

        if (this.fatherRoute) {
            let fatherArgs = pathArgs;
            if (Array.isArray(pathArgs))
                fatherArgs = pathArgs.slice(0, this.fatherRoute.dynamicCount);
            else if (IS_OBJ(pathArgs) && (this.dynamicKey in pathArgs)) {
                fatherArgs = Object.assign({}, pathArgs);
                delete fatherArgs[this.dynamicKey];
            }
            fPath = this.fatherRoute.path(Object.assign({ isMock }, pathOptions(fatherArgs)));
        }
        let name = this.name;
        if (this.isDynamic) {
            if (isMock) {
                if (IS_STR(this.isDynamic))
                    this.name = this.isDynamic;
                let uniqueName = DYNAMIC_SYM + this.name;
                name = uniqueName;
            }
            else if (Array.isArray(pathArgs)) {
                name = pathArgs[this.dynamicCount - 1];
            }
            else if (IS_OBJ(pathArgs)) {

                if (!this.dynamicKey || !IS_STR(this.dynamicKey)) {
                    errorLog("Did not supply key for the path part : [", name, "]");
                } else {

                    if (IS_UNDEF(pathArgs[this.dynamicKey])) {
                        errorLog(`Need to supply in options value for key [${this.dynamicKey}] for path part ${name}`);
                    } else {
                        name = pathArgs[this.dynamicKey];
                    }
                }
            }
        }

        let qParams = queryParams || this.queryParams;
        // if (qParams && !Array.isArray(qParams)) {
        //     qParams = [qParams];
        // }

        let qParamStr = qParams ? getQueryString(this.query, qParams) : "";
        return fPath + DELIM + name + qParamStr;
    }

    setQueryParams(queryParams) {
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
function initRoutes(data, name = null, prefix = null, prevNames = {}, pathParts = []) {
    let curRouteGetter = null;
    if (name) {
        if (data[NAME]) {
            name = data[NAME];
        } else {
            data[NAME] = name;
        }
        if (data[DYNAMIC]) {
            let curNameCount = 0;
            if (prevNames[name] !== undefined) {
                curNameCount = prevNames[name] + 1;
                name = name + curNameCount;
            }
            prevNames = Object.assign({}, prevNames, { [name]: curNameCount });
            data[NAME] = name;
        }
        let defaultQuery = (...qParam) => {
            if (qParam.length > 0) {
                errorLog("No query params were defined, yet received following params ", JSON.stringify(qParam, null, 2))
            }
            return null;
        }

        let query = data[QUERY] || defaultQuery;
        let innerQuery = query;
        let queryKeys = [];
        if (typeof query !== "function") {
            //   let errorMessage = `Invalid type of QUERY supplied, expected function got :${typeof query}`;
            //  errorLog(errorMessage);
            //  query = () => { errorLog("Ignoring query:\n", errorMessage); }
            if (Array.isArray(query)) {
                queryKeys = query;
                innerQuery = (...params) => {
                    if (params.length > queryKeys.length) {
                        let errorMessage = `Invalid QUERY supplied, expected ${queryKeys.length} Q-params got ${params.length} [${params}]`;
                        errorLog(errorMessage);
                    } else {
                        let retVal = {};
                        params.forEach((qParamVal, i) => {
                            if (qParamVal !== EMPTY)
                                retVal[queryKeys[i]] = qParamVal;
                        })
                        return retVal;
                    }

                }
            } else
                innerQuery = (queryParams) => queryParams;
        } else {
            queryKeys = getParamNames(query);
        }

        query = (keyNames, ...values) => {
            let sortedValues = [];
            if (!keyNames) {
                return innerQuery(...values);
            }
            console.log("VV", values)
            queryKeys.forEach(qKey => {
                let keyIndex = (keyNames.indexOf(qKey));
                console.log("QKEY", qKey, keyIndex)
                sortedValues.push((keyIndex >= 0) ? values[keyIndex] : EMPTY);
            })
            console.log("SORT", sortedValues)
            return innerQuery(sortedValues);
        }

        let protocol = data[PROTOCOL] || METHOD.GET;
        data[PROTOCOL] = protocol;
        let isDynamic = !!data[DYNAMIC];
        //////////////////
        if (IS_STR(data[DYNAMIC]))
            pathParts.push(data[DYNAMIC]);
        else
            pathParts.push(data[NAME]);
        curRouteGetter = () => new Route(name, protocol, query, prefix, isDynamic, data[DYNAMIC], pathParts);
        Object.defineProperty(data, ROUTE, { get: curRouteGetter });
        //data[ROUTE] = curRouteGetter;
    }

    Object.keys(data).forEach(key => {
        if (isObject(data[key])) {
            initRoutes(data[key], key, curRouteGetter && curRouteGetter(), prevNames, [...pathParts]);
        }
    });
}

function getRoute(treePath, options = {}) {
    let { pathArgs, queryParams, bodyParams } = options;
    let route = treePath[ROUTE];
    if (bodyParams)
        route.setBody(bodyParams);
    if (queryParams) {
        // if (!Array.isArray(queryParams))
        //     queryParams = [queryParams]
        route.setQueryParams(queryParams);
    } if (pathArgs)
        route.setPathArgs(pathArgs);
    return route;
}

function getPath(treePath, options = {}) {
    let route = getRoute(treePath, options);
    return route.path();
}

export { METHOD, SYMBOLS, initRoutes, getPath, getRoute, pathOptions };


