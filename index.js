const {
 find, get, isEqual, isNumber, isPlainObject, isString, merge, set, uniqWith } = require('lodash');

const getCommonProperties = (parameter) => {
  let commonProperties = '';
  if (parameter.required) {
    commonProperties += '.required()';
  }

  return commonProperties;
};

const getKeyText = (parameter, definition) => {
  const commonProperties = getCommonProperties(parameter);
  const isSimpleKeyName = parameter.name.match(/^\w+$/);
  const quoteSign = isSimpleKeyName ? '' : '\'';

  return `${quoteSign}${parameter.name}${quoteSign}: ${definition}${commonProperties},`;
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

  return getKeyText(parameter, definition);
};

const getKeyIntegerText = (parameter) => {
  let definition = 'Joi.number()';
  return getKeyText(parameter, definition);
};

const parse = (parameters) => {
  if (!parameters) throw new Error('No parameters were passed.');

  let pathJoi = '';
  let queryJoi = '';

  // {
  //     name: 'projectId',
  //     in: 'query',
  //     description: 'ID of project with contracts',
  //     required: true,
  //     type: 'string',
  //     format: 'uuid'
  //   }

  parameters.forEach((parameter) => {
    let keyText = '';
    switch (parameter.type) {
      case 'string':
        keyText = getKeyStringText(parameter);
        break;
      case 'integer':
        keyText = getKeyIntegerText(parameter);
        break;
      default:
        throw new Error('Unexpected parameter type.');
    }

    if (parameter.in === 'path') pathJoi += keyText;
    else if (parameter.in === 'query') queryJoi += keyText;
  });

  let finalText = `{
  `;
  if (queryJoi.length > 0) {
    finalText += `query: Joi.object().keys({
    ${queryJoi.substr(0, queryJoi.length - 1)}
  }),`;
  }

  if (pathJoi.length > 0) {
    finalText += `params: Joi.object().keys({
    ${pathJoi.substr(0, pathJoi.length - 1)}
  }),`;
  }

  if (finalText.length < 10) return null;

  return `${finalText.substr(0, finalText.length - 1)}
}`;
};

module.exports = parse;
exports.default = parse;
