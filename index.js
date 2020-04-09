const Joi = require('@hapi/joi');
const { find, get, isEqual, isNumber, isPlainObject, isString, merge, set, uniqWith } = require('lodash');

const parse = (parameters) => {
  if (!parameters) throw new Error('No parameters were passed.');

  const pathJoi = Joi.array();
  const queryJoi = Joi.array();

    // {
    //     name: 'projectId',
    //     in: 'query',
    //     description: 'ID of project with contracts',
    //     required: true,
    //     type: 'string',
    //     format: 'uuid'
    //   }

parameters.forEach(parameter => {
    switch(parameter.type) {
        case 'string':
            
        break;
        default:

    }
});

};

module.exports = exports = parse;
exports.default = parse;