"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AutoMock = exports.RouteCreator = void 0;

var _RouteCreator = require("./RouteCreator");

var _AutoMockServer = require("./AutoMockServer");

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
var AutoMock = {
  mock: _AutoMockServer.autoMock,
  getMockData: _AutoMockServer.getMockData,
  setMockData: _AutoMockServer.setMockData
};
exports.AutoMock = AutoMock;