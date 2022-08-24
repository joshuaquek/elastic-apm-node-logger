# Elastic APM NodeJS Logger
As of 25th Aug 2022, the official `elastic-apm-node` NPM library does not send the STDOUT logs of the nodejs application that it is installed on to back to your designated Elastic Stack, hence this NPM library aims to bridge this gap. 

## Further Details
This is so that under your `Observability > APM > Services > Your NodeJS App`, the `Logs` section will no longer be blank. Apart from that, it also enables your NodeJS app's APM spans and traces to be correlated with the logs that get sent back by this NPM library. Correlation occurs via the "service.name"/"Service Name" Elastic Common Schema field - https://www.elastic.co/guide/en/ecs/current/ecs-service.html#field-service-name.

I have faith that our Elastic engineering team might build this feature into the official `elastic-apm-node` npm library soon enough. Until that day comes, this library easily bridges that gap.

## Setup
Ensure that you have `elastic-apm-node` installed, so that your NodeJS's app's metrics get sent back to the Elastic Stack. If you haven't then follow this guide first - https://www.elastic.co/guide/en/apm/agent/nodejs/current/express.html

Once this has been done, you can install this library:
```bash
npm install elastic-apm-node-logger
```

## Full Usage Example

For a simple NodeJS ExpressJS App:

```javascript
// Constants
const ELASTIC_CLOUD_ID = '*** Your Elastic Cloud ID Here ***' // This can be found in your https://cloud.elastic.co dashboard
const APM_SERVICE_NAME = 'joshua-api-server-v1' // This is the name of your service.... something meaningful, and has to be a single string
const ELASTICSEARCH_API_KEY = '*** Your API Key ***' // This is created under Your Deployment > Stack Management > API keys
const APM_SERVER_SECRET_TOKEN = '*** Your APM Secret Token ***' // This can be found here - https://www.elastic.co/guide/en/apm/guide/current/secret-token.html
const APM_SERVER_URL = ' *** Your APM Server HTTPS URL ***' // This can be found in your https://cloud.elastic.co dashboard

// Start Elastic APM Metrics Collection
const apm = require('elastic-apm-node').start({
  serviceName: APM_SERVICE_NAME,
  secretToken: APM_SERVER_SECRET_TOKEN,
  serverUrl: APM_SERVER_URL,
  logLevel: 'info'
})

// Start Elastic APM Logging Collection
const elasticApmLogger = require('elastic-apm-node-logger')
elasticApmLogger.startLogging(ELASTIC_CLOUD_ID, ELASTICSEARCH_API_KEY, APM_SERVICE_NAME, apm)

// ---- NPM Imports ----
require('dotenv').config()
const bodyParser = require('body-parser')
const express = require('express')
const expressjsLogger = require('morgan')

// ---- Express Server Setup ----
const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressjsLogger('combined'))

// ---- Express Server Endpoints ----
app.get('/', (req, res) => {
  res.json({ status: 'ExpressJS nodejs server is running!' })
})

app.get('/test_message', (req, res) => {
  res.json({ message: 'Hello World to the Everyone!' })
})

console.log('Server running at http://127.0.0.1:80/')
app.listen(process.env.PORT || 80) // Create a .env to set env variables

```

That's about it!

You should see your logs coming in now under the `Services > Your Service > Logs` tab.

## Caveats
This library inadvertably creates an Elasticsearch "Dependency" icon on your "Service Maps" view, as it sends your logs back directly to your Elasticsearch Database instance.

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.