import { METHOD, SYMBOLS, BIND } from './RouteCreator';
import { TYPES } from './AutoMockServer';
import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPI } from 'openapi-types';
import { writeFile } from 'fs';

type PropertyType = 'object' | 'string' | 'integer' | 'array' | 'boolean';
const MOCK_KEY = 'x-mock';
const MOCK_REF = 'x-mock-ref';
const META = Symbol('META');

function log(
  level: 'error' | 'warning' | 'info' | 'debug',
  ...message: string[]
) {
  if (level == 'error') {
    console.error(...message);
  } else if (level == 'warning') {
    console.warn(...message);
  } else {
    console.log(...message);
  }
}

function stringifyObject(data, level = 1) {
  const MARGIN = ' '.repeat(level);
  let json = '';

  if (typeof data === 'string' || data instanceof String) {
    json += `"${data}"`;
  } else if (Array.isArray(data)) {
    let res = data.map((e) => stringifyObject(e, level + 2));
    json += `\n${MARGIN} [${res.join(',')}]`;
  } else if (typeof data === 'object') {
    const entries = Object.entries(data);
    let symbolEntries = Object.getOwnPropertySymbols(data).map((s) => [
      s,
      data[s],
    ]);
    const metaIndex = symbolEntries.findIndex(([s]) => s === META);
    let meta = null;
    let filter = null;
    let bind = null;
    if (metaIndex >= 0) {
      meta = symbolEntries[metaIndex][1];
      if (meta.bind) bind = meta.bind;
      if (Array.isArray(meta.filter)) {
        filter = `getQueryParamFilter([${meta.filter
          .map((s) => `"${s}"`)
          .join(',')}])`;
      } else {
        filter = meta.filter;
      }
      symbolEntries.splice(metaIndex, 1);
    }

    let objStr = [...symbolEntries, ...entries].map(([k, v]) => {
      const isSymbol = typeof k == 'symbol';
      let key = isSymbol ? `[${k.description}]` : `"${k}"`;
      if (isSymbol && k.description == 'PROTOCOL' && Array.isArray(v))
        return `${key}:[${v.join(',')}]`;
      if (k == 'filter' && filter) return `filter:${filter}`;
      if (k == 'dynamicKeys' && bind) return `dynamicKeys:[${bind.join(',')}]`;

      return `${key}:${stringifyObject(v, level + 1)}`;
    });
    json += `{\n${MARGIN}${objStr.join(`,\n${MARGIN}`)}\n${MARGIN}}`;
  } else {
    json += `${String(data)}`;
  }
  return json;
}

function getMockFile(data): string {
  return `
const { mock, PATH_SYMBOLS, METHOD } = require('auto-route-creator');
const { BIND, PROTOCOL, DYNAMIC, ROUTE, NAME, RESPONSE } = PATH_SYMBOLS;
const {${Object.values(METHOD).join(',')}} = METHOD;

// used by filter (mainly query parameters) to find match
${String(searchNested)}

${String(getQueryParamFilter)}

// Route definitions
const ROUTES = ${stringifyObject(data)};


mock(ROUTES, {port: 3002, defaultListSize: 4});
`;
}

function searchNested(obj, key) {
  for (let k in obj) {
    if (k === key) {
      return obj[k];
    }
    if (typeof obj[k] === 'object') {
      const result = searchNested(obj[k], key);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

function getQueryParamFilter(queryParams: string[]) {
  let filterList = queryParams.map((name) => {
    return (responseData, req) => {
      const searchValue = req?.query?.[name];
      if (searchValue) {
        if (Array.isArray(responseData))
          return responseData.filter(
            (obj) => searchNested(obj, name) == searchValue
          );
      }
      return responseData;
    };
  });
  return (reqData, req) =>
    filterList.reduce((prev, cur) => cur(prev, req), reqData);
}

function parseParameters(methodParameters: any[]) {
  let value: any = (responseData) => responseData;

  if (!methodParameters) return { filter: value, queryParams: [] };

  let queryParams = methodParameters
    .filter((parameter) => parameter.in == 'query')
    .map(({ name }) => name);

  return { filter: getQueryParamFilter(queryParams), queryParams };
}

function parseResponse(data: any, mockRefs: object) {
  let type: PropertyType = data?.type;
  let mockRefId = data?.[MOCK_REF];

  if (mockRefs[mockRefId]) return mockRefs[mockRefId];

  if (data[MOCK_KEY]) return data[MOCK_KEY];

  if (type == 'object') {
    return parseObject(data, mockRefs);
  }

  if (type == 'array') {
    return parseArray(data, mockRefs);
  }

  if (type == 'string') {
    return parseString(data);
  }

  if (type == 'integer') {
    return parseNumber(data);
  }

  if (type == 'boolean') {
    return parseBoolean();
  }
}

function parseObject(data: any, mockRefs: object) {
  let value = {};
  if (!data.properties) return value;
  Object.keys(data.properties).forEach((k) => {
    value[k] = parseResponse(data.properties[k], mockRefs);
  });
  return value;
}

function parseArray(data: any, mockRefs: object) {
  let value = [];
  let items = data.items;
  if (!items) return value;

  return [parseResponse(items, mockRefs)];
}

function parseBoolean() {
  return '{{datatype.boolean}}:' + TYPES.BOOL;
}

function parseString(property: any) {
  const format = property.format;
  let value: string | (() => string) = '';

  if (format) {
    if (format == 'date') {
      const DATE_RANGE = 1680000000000;
      value = () =>
        new Date(Math.random() * DATE_RANGE).toISOString().split('T')[0];
    }
    if (format == 'date-time') {
      value = '{{date.past}}';
    }
    if (format == 'password') {
      value = '{{internet.password}}';
    }
    if (format == 'byte') {
      value = '{{random.alphaNumeric(50)}}';
    }
    if (format == 'binary') {
      value = '[100|101|110|1|10|111|0|11]';
    }
    if (format == 'email') {
      value = '{{internet.email}}';
    }
    if (format == 'uuid') {
      value = '{{datatype.uuid}}';
    }
    if (format == 'uri' || format == 'url') {
      value = '{{internet.url';
    }
    if (format == 'hostname') {
      value = '{{name.lastName}}';
    }
    if (format == 'ipv4') {
      value = '{{internet.ip}}';
    }
    if (format == 'ipv6') {
      value = '{{internet.ipv6}}';
    }
  } else if (Array.isArray(property.enum)) {
    value = `[${property.enum.join('|')}]`;
  } else if (property.example) {
    value = `[${property.example}]`;
  } else {
    //random word in case no info.
    value = '{{animal.dog}}';
  }
  return value + ':' + TYPES.STRING;
}

function parseNumber(property: any) {
  const format = property.format;
  let value = '';
  if (format) {
    if (format == 'float') {
      value = '{{datatype.float}}';
    }
    if (format == 'double') {
      value = '{{datatype.float(0.000000001)}}';
    }
    if (format == 'int32') {
      value = '{{datatype.number(1000000)}}';
    }
    if (format == 'int64') {
      value = '{{datatype.number(9223372036854775807)}}';
    }
  } else if (property.example) {
    const RANGE_MUL = 2;
    const DEFAULT_INT = 10;
    if (property.example.includes('.'))
      value = `{{datatype.number(${
        (Number(property.example) || DEFAULT_INT) * RANGE_MUL
      })}}`;
    else value = '{{datatype.float}}';
  } else {
    //random number.
    value = '`{{datatype.number}}';
  }
  return value + ':' + TYPES.NUMBER;
}

async function openApiToMockDefinition(
  document: string | OpenAPI.Document,
  mockRefs: object = {}
): Promise<object> {
  const openApiDocument = await SwaggerParser.validate(document);
  let { paths } = openApiDocument;
  let routes: any = {};
  if (!paths) {
    log('error', 'Cannot convert open API spec, no paths found');
    return null;
  }
  const pathsList = Object.keys(paths);

  pathsList.forEach((path) => {
    const pathParts = path.split('/');
    let dynamicName = null;
    let curRoutes = routes;

    pathParts.forEach((part) => {
      if (part[0] == '{' && part[part.length - 1] == '}') {
        dynamicName = true;
        part = part.slice(1, part.length - 1);
      }
      console.log('PART:', part);
      if (part) {
        if (!curRoutes[part]) curRoutes[part] = {};
        curRoutes = curRoutes[part];
      }
    });

    //Add protocols (aka method)
    const methodList: string[] = Object.keys(paths[path]);
    let supportedMethods: string[] = [];
    methodList.forEach((method) => {
      const methodUpper = method.toUpperCase();
      //Move Get to be first definition (for clarity, as main use case)
      if (Object.keys(METHOD).includes(methodUpper)) {
        if (methodUpper == 'GET')
          supportedMethods.unshift(method.toUpperCase());
        else supportedMethods.push(method.toUpperCase());
      } else
        log(
          'warning',
          `Warning, unsupported method ${method} (for path ${path})`
        );
    });

    //Add mock definition per method
    if (dynamicName)
      curRoutes[SYMBOLS.DYNAMIC] = paths[path]['x-mock-dynamic'] || true;

    curRoutes[SYMBOLS.PROTOCOL] = supportedMethods;
    curRoutes[SYMBOLS.RESPONSE] = [];
    supportedMethods.map((method) => {
      const methodData = paths[path][method.toLowerCase()];
      const dynamicBindListStr = methodData['x-mock-bind'];
      const operationId = methodData['operationId'];
      const methodParameters = methodData?.['parameters'];
      const methodResponse = methodData?.['responses'];
      const responseSchema =
        methodResponse?.[200]?.['content']?.['application/json']?.['schema'];
      const responseSchemaDefault =
        methodResponse?.['default']?.['content']?.['application/json']?.[
          'schema'
        ];

      if (methodData['operationId'] && mockRefs[operationId]) {
        curRoutes[SYMBOLS.RESPONSE].push(mockRefs[operationId]);
      } else if (responseSchema || responseSchemaDefault) {
        let schema = responseSchema || responseSchemaDefault;
        const res = parseResponse(schema, mockRefs);
        const { filter, queryParams } = parseParameters(methodParameters);
        let resDef = { template: res };
        if (filter) resDef['filter'] = filter;
        if (!resDef[META]) resDef[META] = {};
        resDef[META].filter =
          queryParams?.length > 0 ? queryParams : (data) => data;
        if (dynamicBindListStr) {
          resDef[META].bind = [];
          resDef['dynamicKeys'] = dynamicBindListStr.split(',').map((dBind) => {
            const [dKey, dId] = dBind.split(':');

            resDef[META].bind.push(`BIND("${dKey}","${dId}")`);
            return BIND(dKey, dId);
          });
        }
        curRoutes[SYMBOLS.RESPONSE].push(resDef);
      } else {
        log('warning', `Warning, no response for ${method}:${path}`);
        curRoutes[SYMBOLS.RESPONSE].push({});
      }
    });
  });

  return routes;
}

function openApiToMockFile(
  document: string | OpenAPI.Document,
  path: string
): Promise<void> {
  return new Promise<void>((res, rej) => {
    openApiToMockDefinition(document).then((routes) => {
      writeFile(path, getMockFile(routes), function (err) {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    });
  });
}

export { openApiToMockDefinition, openApiToMockFile };
