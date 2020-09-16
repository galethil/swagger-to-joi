let components;

const getCommonProperties = (parameter) => {
  let commonProperties = '';
  if (parameter.required) {
    commonProperties += '.required()';
  }
  if ('description' in parameter) {
    commonProperties += `.description('${parameter.description.replace("'", "\\'")}')`;
  }

  // check if there is a x-joi-add
  if (parameter['x-joi-add']) {
    commonProperties += parameter['x-joi-add'];
  }

  return commonProperties;
};

const getKeyText = (parameter, definition, addCommonProperties = true) => {
  const commonProperties = addCommonProperties ? getCommonProperties(parameter) : '';
  if (!('name' in parameter)) return `${definition}${commonProperties}`;

  const isSimpleKeyName = parameter.name.match(/^[\w$]+$/);
  const quoteSign = isSimpleKeyName ? '' : '\'';

  return `${quoteSign}${parameter.name}${quoteSign}: ${definition}${commonProperties},
    `;
};

const getFormat = (parameter) => {
  if (parameter.format === 'uuid' || parameter.format === 'guid' || (parameter.schema && parameter.schema.format === 'uuid') || (parameter.schema && parameter.schema.format === 'guid')) {
    return 'uuid';
  }
  if (parameter.format === 'email' || (parameter.schema && parameter.schema.format === 'email')) {
    return 'email';
  }
  if (parameter.format === 'uri' || (parameter.schema && parameter.schema.format === 'uri')) {
    return 'uri';
  }
  if (parameter.format === 'hostname' || (parameter.schema && parameter.schema.format === 'hostname')) {
    return 'hostname';
  }
};

const getKeyStringText = (parameter) => {
  let definition = 'Joi.string()';
  const format = getFormat(parameter);
  if (format === 'uuid') {
    definition += '.guid()';
  } else if (format === 'email') {
    definition += '.email()';
  } else if (format === 'uri') {
    definition += '.uri()';
  } else if (format === 'hostname') {
    definition += '.hostname()';
  }

  if ('pattern' in parameter) {
    definition += `.regex(/${parameter.pattern}/)`;
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

const getKeyBooleanText = (parameter) => {
  const definition = 'Joi.boolean()';

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
    definition += getText({ ...parameter.items, test: true });
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
    Object.keys(parameter.properties).forEach((propertyName) => {
      // eslint-disable-next-line no-use-before-define
      definition += `${getText({ ...parameter.properties[propertyName], name: propertyName })}`;
    });
  } else {
    throw Error('Object definition doesn\'t have properties.');
  }

  definition = `${definition.trim().substr(0, definition.length - 1)}
})`;

  return getKeyText(parameter, definition);
};

const getKeyComponentText = (parameter) => {
  let definition = '';
  if ('properties' in parameter) {
    Object.keys(parameter.properties).forEach((propertyName) => {
      const required = parameter.required && parameter.required.includes(propertyName);
      // eslint-disable-next-line no-use-before-define
      definition += `${getText({ ...parameter.properties[propertyName], required, name: propertyName })}`;
    });
  } else if ('allOf' in parameter) {
    let properties = {};
    parameter.allOf.forEach((propertiesDefinition) => {
      if ('$ref' in propertiesDefinition) {
        // eslint-disable-next-line no-use-before-define
        const component = findComponentByPath(propertiesDefinition.$ref, components);
        properties = { ...properties, ...component.properties };
      } else if ('properties' in propertiesDefinition) {
        properties = { ...properties, ...propertiesDefinition.properties };
      }
    });
  } else {
    throw Error('Object definition doesn\'t have properties.');
  }

  definition = `${definition.trim().substr(0, definition.length - 6)})`;

  return definition;
};

const findComponentByPath = (path) => {
  const componentPath = path.replace('#/components/', '');

  const foundComponent = componentPath.split('/').reduce((o, i) => o[i], components);

  if (!foundComponent) {
    throw Error(`component ${componentPath} not found.`);
  }
  return foundComponent;
};

const getText = (parameter) => {
  let text = '';

  // check if this is a component structure
  if (parameter.schema && parameter.schema.$ref) {
    const component = findComponentByPath(parameter.schema.$ref, components);

    return getKeyComponentText({ ...component, name: parameter.operationId });
  }

  // check if there is a x-joi-replace
  if (parameter['x-joi-replace']) {
    return getKeyText(parameter, parameter['x-joi-replace'], false);
  }

  // in case this is a reference we need to replace it with referenced type
  if ('$ref' in parameter) {
    parameter = findComponentByPath(parameter['$ref']);
  }

  const type = parameter.schema ? parameter.schema.type : parameter.type;

  switch (type) {
    case 'string':
      text = getKeyStringText(parameter);
      break;
    case 'boolean':
      text = getKeyBooleanText(parameter);
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
      throw new Error(`Unexpected parameter type ${type} in parameter named ${parameter.name}.`);
  }

  return text;
};

const getRequestBodyText = (route) => {
  const { requestBody, operationId, description } = route;
  if (requestBody.content && requestBody.content['application/json']) {
    return getText({ ...requestBody.content['application/json'], operationId, description }, components);
  }
};

const parse = (route, componentsParam) => {
  if (!route) throw new Error('No route was passed.');

  components = componentsParam;

  let pathJoi = '';
  let queryJoi = '';
  let bodyJoi = '';

  if (route.parameters) {
    route.parameters.forEach((parameter) => {
      const keyText = getText(parameter);

      if (parameter.in === 'path') pathJoi += keyText;
      else if (parameter.in === 'query') queryJoi += keyText;
    });
  }

  if (route.requestBody) {
    bodyJoi += getRequestBodyText(route);
  }

  const rObject = {};

  if (queryJoi.length > 0) {
    rObject.query = `Joi.object().keys({
    ${queryJoi.substr(0, queryJoi.length - 6)}
  })`;
  }

  if (pathJoi.length > 0) {
    rObject.path = `Joi.object().keys({
    ${pathJoi.substr(0, pathJoi.length - 6)}
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
