const { mockOpenApi, openApiToMockFile } = require('../dist/index');

const ROUTES = {
  // path description id
  logoutUser: {
    template: {
      logoutUser: 'user with id {{datatype.uuid}} logged out',
    },
  },
  // property param
  photoUrls: [{ url: "{{internet.url}}", size: "{{datatype.number}}" }]
};

mockOpenApi(__dirname + '/SampleOA.yaml', ROUTES, { port: 3002, defaultListSize: 4 });

openApiToMockFile(__dirname + '/SampleOA.yaml', './test.js');
