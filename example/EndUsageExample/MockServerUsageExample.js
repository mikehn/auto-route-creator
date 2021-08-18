import { RouteCreator, AutoMock } from "auto-route-creator";
import { ROUTES1 } from '../DefinitionExample/RoutesDefinitionExample';
import { MOCK_RESPONSE_DEFINITION } from '../DefinitionExample/MockResponseDefinitionExample';

const MOCK_JOINED_DEF = RouteCreator.joinResponseRoutes(ROUTES1, MOCK_RESPONSE_DEFINITION);
AutoMock.mock(MOCK_JOINED_DEF,{port:3004});


