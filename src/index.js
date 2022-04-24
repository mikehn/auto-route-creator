import { METHOD, SYMBOLS, initRoutes, getPath, getRoute, pathOptions, joinResponseRoutes, BIND } from "./RouteCreator";
let AutoMock = {};
if (typeof window === 'undefined') {
    let { autoMock, getMockData, setMockData } = require("./AutoMockServer");
    AutoMock = { mock: autoMock, getMockData, setMockData };
}
let RouteCreator = { METHOD, SYMBOLS, initRoutes, getPath, getRoute, pathOptions, joinResponseRoutes, BIND };
export { RouteCreator, AutoMock };
