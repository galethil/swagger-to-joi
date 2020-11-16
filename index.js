const swagger = require('./swagger');
const openapi = require('./openapi');

const validateOptions = (options) => {
  const opt = options;
  console.log('gsjdg');
  if (typeof opt !== 'object') {
    return {};
  }

  if (!('singleQuote' in opt)) {
    opt.singleQuote = true;
  }

  return opt;
};

/**
 *
 * @param {*} route
 * @param {*} components
 * @param {*} version
 * @param {*} options
 */
const parse = (route, components, version = '3.0.0', options) => {
  if (!route) throw new Error('No route was passed.');
  const opt = validateOptions(options);

  if (version === '2.0') {
    return swagger(route, opt);
  }

  if (version === '3.0.0') {
    return openapi(route, components, opt);
  }
};

module.exports = parse;
exports.default = parse;
