const getCommonProperties = (parameter) => {
  let commonProperties = '';
  if (parameter.required) {
    commonProperties += '.required()';
  }
  if ('description' in parameter) {
    commonProperties += `.description('${parameter.description}')`;
  }

  return commonProperties;
};

const getKeyText = (parameter, definition) => {
  const commonProperties = getCommonProperties(parameter);
  const isSimpleKeyName = parameter.name.match(/^\w+$/);
  const quoteSign = isSimpleKeyName ? '' : '\'';

  return `${quoteSign}${parameter.name}${quoteSign}: ${definition}${commonProperties},
    `;
};

const getKeyStringText = (parameter) => {
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

  if ('pattern' in parameter) {
    definition += `.regex(${parameter.pattern})`;
  }

  if ('enum' in parameter) {
    definition += `.valid('${parameter.enum.join('\', \'')}')`;
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
  let definition = `Joi.array().items(
    `;
  if ('items' in parameter) {
    // eslint-disable-next-line no-use-before-define
    definition += getText(parameter.items);
  } else {
    throw Error('Array definition doesn\'t have items.');
  }

  definition += `
)`;

  return getKeyText(parameter, definition);
};

const getKeyObjectText = (parameter) => {
  let definition = `Joi.object().keys({
    `;
  if ('properties' in parameter) {
    Object.keys(parameter.properties).forEach((property) => {
      // eslint-disable-next-line no-use-before-define
      definition += `${getText(parameter.properties[property])},
      `;
    });
  } else {
    throw Error('Object definition doesn\'t have properties.');
  }

  definition = `${definition.trim().substr(0, definition.length - 1)}
})`;

  return getKeyText(parameter, definition);
};

const getText = (parameter) => {
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

const parse = (parameters) => {
  if (!parameters) throw new Error('No parameters were passed.');

  let pathJoi = '';
  let queryJoi = '';
  let bodyJoi = '';

  parameters.forEach((parameter) => {
    const keyText = getText(parameter);

    if (parameter.in === 'path') pathJoi += keyText;
    else if (parameter.in === 'query') queryJoi += keyText;
    else if (parameter.in === 'body') bodyJoi += keyText;
  });

  const rObject = {};

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
