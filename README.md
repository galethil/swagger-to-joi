# swagger-to-joi

Swagger to Joi converter

Generates text for Joi definitions. Definitions could be stored to a file or run using `eval`.

Example usage:

```javascript
const swaggerToJoi = require('swagger-to-joi');

const joiTextObject = swaggerToJoi(swaggerRouteParametersInJson, components, version, options);

// process joiTextObject or store joi definitions to a file
// returning object contain separate definitions for path, query and body
```

Example:

```javascript
const swaggerToJoi = require('swagger-to-joi');
const swagger = {
    swagger: '2.0',
    schema: {
      body: {
        type: "object",
        required: ["apiVersion", "data"],
        properties: {
          apiVersion: { type: "string", enum: ["1.0"], example: "1.0" },
          data: {
            type: "object",
            required: ["projectId", "organization", "value", "currencyCode"],
            properties: {
              projectId: { type: "string", example: "1234567" },
              organization: { type: "string", example: "My Org" },
              currencyCode: { type: "string", example: "EUR" },
              value: { type: "number", example: 50000 },
            },
          },
        },
      }
    }
const joiTextObject = swaggerToJoi(swaggerRouteParametersInJson);

console.log(joiTextObject);

/*
Outputs:

Joi.object({
  apiVersion: Joi.valid("1.0").required(),
  data: Joi.object({
    projectId: Joi.string().required(),
    organization: Joi.string().required(),
    currencyCode: Joi.string().required(),
    value: Joi.number().required(),
  }),
})
*/

```

## Parameters

### Components

Used for openAPI 3.0.0. Components used in schema.

### Version

`2.0` or `3.0.0`. default `3.0.0`.

### Options

- `singleQuote` - boolean - determines if you want to user ' or " quotes. Default: true.
- `overrideKeys` - key-value object. E.g. `{ projectId: 'Project.id' }`. Will override all keys in any swagger definition where key in swagger will match keyname from the overide object.
