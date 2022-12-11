import {
  METHOD,
  SYMBOLS,
  initRoutes,
  getPath,
  getRoute,
  pathOptions,
  joinResponseRoutes,
  BIND,
} from './RouteCreator';
import { autoMock, MockOptions } from './AutoMockServer';
const PATH_SYMBOLS = SYMBOLS;
let AutoMock = {};
if (typeof window === 'undefined') {
  let { autoMock, getMockData, setMockData } = require('./AutoMockServer');
  AutoMock = { mock: autoMock, getMockData, setMockData };
}
let RouteCreator = {
  METHOD,
  SYMBOLS,
  initRoutes,
  getPath,
  getRoute,
  pathOptions,
  joinResponseRoutes,
  BIND,
};

function mock(routes: Object, options?: MockOptions): void {
  initRoutes(routes);
  autoMock(routes, options || {});
}

export { RouteCreator, AutoMock, PATH_SYMBOLS, mock };
