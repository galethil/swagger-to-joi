const swagger = require('./swagger');
const openapi = require('./openapi');

const parse = (route, components, version = '3.0.0') => {
  if (!route) throw new Error('No route was passed.');

  if (version === '2.0') {
    return swagger(route);
  }

  if (version === '3.0.0') {
    return openapi(route, components);
  }
};

module.exports = parse;
exports.default = parse;
