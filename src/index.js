import { METHOD, SYMBOLS, initRoutes, getPath, getRoute, pathOptions, joinResponseRoutes, BIND } from "./RouteCreator";
import { autoMock, getMockData, setMockData } from "./AutoMockServer";

let RouteCreator = { METHOD, SYMBOLS, initRoutes, getPath, getRoute, pathOptions, joinResponseRoutes, BIND };
let AutoMock = { mock:autoMock, getMockData, setMockData };

export { RouteCreator, AutoMock };