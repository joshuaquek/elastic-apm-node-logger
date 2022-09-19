const _ = require('lodash')
const util = require('util')
const { Client } = require('@elastic/elasticsearch')

// Elastic APM Logger
module.exports = {
  startLogging: async function startLogging ({ cloudId, apiKey, serviceName, apmObject }) {
    const client = new Client({
      cloud: { id: cloudId },
      auth: { apiKey }
    })

    // Create a datastream to send logs back for unique app, skip if datastream already exists
    const loggingDataStreamName = `logs-${serviceName}`
    try {
      await client.indices.createDataStream({ name: loggingDataStreamName })
      console.log('Elastic datastream already exists, skipping datastream creation..., continuing to logging.')
    } catch (error) {
    }

    // Intercept stdout and send to Elastic APM
    interceptStdout((stdout) => {
      const isJsonAndEcsFormatted = isJsonString(stdout) && isECSFormat(JSON.parse(stdout))
      // If its a regular log, then also include that as a message and send it back with the "trace.id" and "transaction.id"
      const documentToSendBack =
        isJsonAndEcsFormatted
          ? JSON.parse(stdout)
          : ({
              '@timestamp': new Date(),
              service: { name: serviceName },
              event: { dataset: `${serviceName}.log` },
              message: `${stdout}`,
              trace: { id: apmObject.currentTraceIds['trace.id'] },
              transaction: { id: apmObject.currentTraceIds['transaction.id'] }
            })
      // Send the log line data
      client.index({
        index: loggingDataStreamName,
        document: documentToSendBack
      })
    })
  }
}

// Source - https://gist.github.com/benbuckman/2758563
// intercept stdout, passes thru callback
// also pass console.error thru stdout so it goes to callback too
// (stdout.write and stderr.write are both refs to the same stream.write function)
// returns an unhook() function, call when done intercepting
function interceptStdout (callback) {
  const oldStdoutWrite = process.stdout.write
  const oldConsoleError = console.error
  process.stdout.write = (function (write) {
    return function (string, encoding, fd) {
      const args = _.toArray(arguments)
      write.apply(process.stdout, args)
      // only intercept the string
      callback.call(callback, string)
    }
  }(process.stdout.write))
  console.error = (function (log) {
    return function () {
      const args = _.toArray(arguments)
      args.unshift('[ERROR]')
      console.log.apply(console.log, args)
      // string here encapsulates all the args
      callback.call(callback, util.format(args))
    }
  }(console.error))
  // puts back to original
  return function unhook () {
    process.stdout.write = oldStdoutWrite
    console.error = oldConsoleError
  }
}

function isJsonString (theString) {
  try {
    JSON.parse(theString)
  } catch (e) {
    return false
  }
  return true
}

function isECSFormat (jsonObject) {
  return _.has(jsonObject, 'ecs.version')
}
