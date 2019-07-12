const { pretty } = require('./util/debug')
const { Sentry, flush } = require('./util/sentry')

const { HEXLY_GRAPHQL_DEBUG } = process.env
const isDebug = HEXLY_GRAPHQL_DEBUG && HEXLY_GRAPHQL_DEBUG != 'false'
const maybeLog = () => {
  if (isDebug) {
    // 1. Convert args to a normal array
    const args = Array.prototype.slice.call(arguments)
    cosnole.log.apply(console, args)
  }
}

const logging = async (resolve, parent, args, context, info) => {
  const { parentType, fieldName } = info
  try {
    if (isDebug && !parent) {
      maybeLog(
        `[serverless-tools:mw:logging] Executing ${parentType}#${fieldName}`,
        '\n',
        pretty(args)
      )
    }
    const result = await resolve(parent, args, context, info)
    if (isDebug && !parent) {
      maybeLog(
        `[serverless-tools:mw:logging] Completed ${parentType}#${fieldName}`,
        '\n',
        pretty(args),
        '\n',
        pretty(result)
      )
    }
    return result
  } catch (err) {
    console.warn(
      `[serverless-tools:mw:logging] Error at ${parentType}#${fieldName}`,
      pretty(args),
      '\n',
      err
    )
    return err
  }
}

const sentryMiddleware = (resolve, parent, args, context, info) => {
  if (isDebug) {
    maybeLog('[serverless-tools:mw:sentry] starting')
  }
  const hr = process.hrtime()
  const { parentType, fieldName } = info

  const params = pretty(args)
  Sentry.addBreadcrumb({
    category: 'graphql',
    message: 'execution.started',
    data: {
      parentType,
      fieldName,
      params
    }
  })
  maybeLog('[serverless-tools:mw:sentry] added breadcrumbs')
  let failError
  return resolve(parent, args, context, info)
    .then(result => {
      maybeLog('[serverless-tools:mw:sentry] resolved')
      if (result instanceof Error) {
        throw result
      }
      const time = `${process.hrtime(hr)[1] / 1000000}ms`
      Sentry.addBreadcrumb({
        category: 'graphql',
        message: 'execution.completed',
        data: {
          parentType,
          fieldName,
          time
        }
      })
      maybeLog('[serverless-tools:mw:sentry] success')
      return result
    })
    .catch(err => {
      maybeLog('[serverless-tools:mw:sentry] failure encountered', err)
      failError = err
      const time = `${process.hrtime(hr)[1] / 1000000}ms`
      Sentry.addBreadcrumb({
        category: 'graphql',
        message: 'execution.errored',
        data: {
          parentType,
          fieldName,
          time
        }
      })
      maybeLog('[serverless-tools:mw:sentry] capturing')
      Sentry.captureException(err)
      maybeLog('[serverless-tools:mw:sentry] captured')
      return flush()
    })
    .then(flushed => {
      maybeLog('[serverless-tools:mw:sentry] flushed', flushed)
      throw failError
    })
    .catch(err2 => {
      maybeLog('[serverless-tools:mw:sentry] flush failed', err2)
      throw failError
    })
}

module.exports = {
  logging,
  sentryMiddleware
}
