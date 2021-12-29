let options = {};
let intend = '  ';

const getCommonProperties = (parameter) => {
  let commonProperties = '';
  if (parameter.required && parameter.required === true) {
    commonProperties += '.required()';
  }
  if (parameter.description) {
    commonProperties += `.description('${parameter.description}')`;
  }

  // check if there is a x-joi-add
  if (parameter['x-joi-add']) {
    commonProperties += parameter['x-joi-add'];
  }

  return commonProperties;
};

const getKeyText = (parameter, definition, addCommonProperties = true) => {
  const commonProperties = addCommonProperties ? getCommonProperties(parameter) : '';
  if (!parameter.name) return `${definition}${commonProperties}`;

  const isSimpleKeyName = parameter.name.match(/^\w+$/);
  const correctQuote = options.singleQuote === true ? '\'' : '"';
  const quoteSign = isSimpleKeyName ? '' : correctQuote;

  return `${quoteSign}${parameter.name}${quoteSign}: ${definition}${commonProperties},
${intend.repeat(parameter.level)}`;
};

const getKeyStringText = (parameter) => {
  const correctQuote = options.singleQuote === true ? '\'' : '"';

  let definition = 'Joi.string()';
  if (parameter.format === 'uuid') {
    definition += '.guid()';
  } else if (parameter.format === 'email') {
    definition += '.email()';
  } else if (parameter.format === 'uri') {
    definition += '.uri()';
  } else if (parameter.format === 'hostname') {
    definition += '.hostname()';
  }

  if ('minLength' in parameter) {
    if (parameter.minLength === 0) {
      definition += `.allow(${correctQuote}${correctQuote})`;
    } else {
      definition += `.min(${parameter.minLength})`;
    }
  }

  if ('maxLength' in parameter) {
    definition += `.max(${parameter.minLength})`;
  }

  if ('pattern' in parameter) {
    definition += `.regex(${parameter.pattern})`;
  }

  if ('enum' in parameter) {
    const joinString = `${correctQuote}, ${correctQuote}`;
    definition += `.valid(${correctQuote}${parameter.enum.join(joinString)}${correctQuote})`;
  }

  return getKeyText(parameter, definition);
};

const getCommonNumberText = (parameter) => {
  let definition = '';
  if ('minimum' in parameter) {
    definition += `.min(${parameter.minimum})`;
  }
  if ('maximum' in parameter) {
    definition += `.max(${parameter.maximum})`;
  }

  return definition;
};

const getKeyNumberText = (parameter) => {
  let definition = 'Joi.number()';

  definition += getCommonNumberText(parameter);

  return getKeyText(parameter, definition);
};

const getKeyIntegerText = (parameter) => {
  let definition = 'Joi.number().integer()';

  definition += getCommonNumberText(parameter);

  return getKeyText(parameter, definition);
};

const getKeyArrayText = (parameter) => {
  if (!('level' in parameter)) {
    // eslint-disable-next-line no-param-reassign
    parameter.level = 0;
  }

  let definition = `Joi.array().items(
  ${intend.repeat(parameter.level)}`;
  if ('items' in parameter) {
    // eslint-disable-next-line no-use-before-define
    definition += getText({ ...parameter.items, level: parameter.level + 1 });
  } else if ('items' in parameter.schema) {
    // eslint-disable-next-line no-use-before-define
    definition += getText({ ...parameter.schema.items, level: parameter.level + 1 });
  } else {
    throw Error('Array definition doesn\'t have items.');
  }

  definition += `
${intend.repeat(parameter.level)})`;

  return getKeyText(parameter, definition);
};

const getKeyObjectText = (parameter) => {
  // if this is an object we want to preserve required properties
  if (parameter.required && Array.isArray(parameter.required)) {
    // eslint-disable-next-line no-param-reassign
    parameter.requiredProperties = parameter.required;
  }

  if (!('level' in parameter)) {
    // eslint-disable-next-line no-param-reassign
    parameter.level = 0;
  }

  let definition = 'Joi.object()';
  if ('properties' in parameter) {
    definition += `.keys({
  ${intend.repeat(parameter.level)}`;
    Object.keys(parameter.properties).forEach((propertyName) => {
      // skip additionalProperties if they are present
      if (propertyName === 'additionalProperties') return;

      const property = parameter.properties[propertyName];
      // add name if missing
      if (!property.name) {
        property.name = propertyName;
      }

      property.level = parameter.level + 1;

      // check override
      if ('overrideKeys' in options) {
        if (propertyName in options.overrideKeys) {
          definition += getKeyText(property, options.overrideKeys[propertyName], false);
          return;
        }
      }

      // if this is an object we want to preserve required properties
      if (property.required && Array.isArray(property.required)) {
        property.requiredProperties = property.required;
      }

      // add required if missing
      if (parameter.requiredProperties
        && Array.isArray(parameter.requiredProperties)
        && parameter.requiredProperties.includes(property.name)
      ) {
        property.required = true;
      }
      // eslint-disable-next-line no-use-before-define
      definition += `${getText(property)}`;
    });
    definition = `${definition.trim().substr(0, definition.length - 1)}
${intend.repeat(parameter.level)}})`;
    if ('additionalProperties' in parameter && parameter.additionalProperties === true) {
      definition += '.unknown()';
    }
  }
  // console.log(definition);
  return getKeyText(parameter, definition);
};

const getText = (parameter) => {
  // check if there is a x-joi-replace
  if (parameter['x-joi-replace']) {
    return getKeyText(parameter, parameter['x-joi-replace'], false);
  }

  let text = '';
  switch (parameter.type) {
    case 'string':
      text = getKeyStringText(parameter);
      break;
    case 'integer':
      text = getKeyIntegerText(parameter);
      break;
    case 'number':
      text = getKeyNumberText(parameter);
      break;
    case 'array':
      text = getKeyArrayText(parameter);
      break;
    case 'object':
      text = getKeyObjectText(parameter);
      break;
    default:
      throw new Error(`Unexpected parameter type ${parameter.type} in parameter named ${parameter.name}.`);
  }
  return text;
};

const parse = (route, opt) => {
  options = opt;

  const rObject = {};
  let pathJoi = '';
  let queryJoi = '';
  let bodyJoi = '';

  if (route.parameters) {
    route.parameters.forEach((parameter) => {
      const keyText = getText(parameter);

      if (parameter.in === 'path') pathJoi += keyText;
      else if (parameter.in === 'query') queryJoi += keyText;
      else if (parameter.in === 'body') bodyJoi += keyText;
    });
  }

  if (route.body) {
    const keyText = getKeyObjectText(route.body);
    rObject.body = keyText;
  }

  if (queryJoi.length > 0) {
    rObject.query = `Joi.object().keys({
    ${queryJoi.substr(0, queryJoi.length - 1)}
  })`;
  }

  if (pathJoi.length > 0) {
    rObject.path = `Joi.object().keys({
    ${pathJoi.substr(0, pathJoi.length - 1)}
  })`;
  }

  if (bodyJoi.length > 0) {
    rObject.body = `Joi.object().keys({
    ${bodyJoi.substr(0, bodyJoi.length - 1)}
  })`;
  }

  return rObject;
};

module.exports = parse;
exports.default = parse;
