# swagger-to-joi

Swagger to Joi converter

Generates text for Joi definitions. Definitions could be stored to a file or run using `eval`.

Example usage:

```javascript
const swaggerToJoi = require('swagger-to-joi');

const joiText = swaggerToJoi(swaggerRouteParametersInJson);

// store joiText to a file
```
