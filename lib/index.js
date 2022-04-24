"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AutoMock = exports.RouteCreator = void 0;

var _RouteCreator = require("./RouteCreator");

var AutoMock = {};
exports.AutoMock = AutoMock;

if (typeof window === 'undefined') {
  var _require = require("./AutoMockServer"),
      autoMock = _require.autoMock,
      getMockData = _require.getMockData,
      setMockData = _require.setMockData;

  exports.AutoMock = AutoMock = {
    mock: autoMock,
    getMockData: getMockData,
    setMockData: setMockData
  };
}

var RouteCreator = {
  METHOD: _RouteCreator.METHOD,
  SYMBOLS: _RouteCreator.SYMBOLS,
  initRoutes: _RouteCreator.initRoutes,
  getPath: _RouteCreator.getPath,
  getRoute: _RouteCreator.getRoute,
  pathOptions: _RouteCreator.pathOptions,
  joinResponseRoutes: _RouteCreator.joinResponseRoutes,
  BIND: _RouteCreator.BIND
};
exports.RouteCreator = RouteCreator;