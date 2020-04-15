# swagger-to-joi

Swagger to Joi converter

Generates text for Joi definitions. Definitions could be stored to a file or run using `eval`.

Example usage:

```javascript
const swaggerToJoi = require('swagger-to-joi');

const joiTextObject = swaggerToJoi(swaggerRouteParametersInJson);

// process joiTextObject or store joi definitions to a file
// returning object contain separate definitions for path, query and body
```
