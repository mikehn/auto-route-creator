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
import { OpenAPI } from 'openapi-types';
import { openApiToMockDefinition, openApiToMockFile } from './OpenApiConverter';

const PATH_SYMBOLS = { ...SYMBOLS, BIND };
let AutoMock: {
  getMockData?: (path: string, protocol: string) => any;
  setMockData?: (
    path: string,
    protocol: string,
    data: any,
    filter: (reqData: any, req: Request) => any
  ) => void;
  mock?: any;
} = {};
if (typeof window === 'undefined') {
  let { autoMock, getMockData, setMockData } = require('./AutoMockServer');
  AutoMock = { mock: autoMock, getMockData, setMockData };
}
const getMockData = AutoMock.getMockData;
const setMockData = AutoMock.setMockData;

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

function mockOpenApi(
  document: string | OpenAPI.Document,
  mockRef: object = {},
  options?: MockOptions
) {
  openApiToMockDefinition(document, mockRef).then((routes) =>
    mock(routes, options)
  );
}

function mock(routes: Object, options?: MockOptions): void {
  initRoutes(routes);
  autoMock(routes, options || {});
}

export {
  RouteCreator,
  AutoMock,
  PATH_SYMBOLS,
  METHOD,
  mock,
  mockOpenApi,
  openApiToMockFile,
  getMockData,
  setMockData,
};
