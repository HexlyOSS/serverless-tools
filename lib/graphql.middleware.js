const { pretty } = require('./util/debug')
const { Sentry, flush } = require('./util/sentry')

const { HEXLY_GRAPHQL_DEBUG } = process.env
const isDebug = HEXLY_GRAPHQL_DEBUG && HEXLY_GRAPHQL_DEBUG != 'false'

const logging = async (resolve, parent, args, context, info) => {
  const { parentType, fieldName } = info
  try {
    if (isDebug && !parent) {
      console.log(`Executing ${parentType}#${fieldName}`, '\n', pretty(args))
    }
    const result = await resolve(parent, args, context, info)
    if (isDebug && !parent) {
      console.log(
        `Completed ${parentType}#${fieldName}`,
        '\n',
        pretty(args),
        '\n',
        pretty(result)
      )
    }
    return result
  } catch (err) {
    console.warn(`Error at ${parentType}#${fieldName}`, pretty(args), '\n', err)
    return err
  }
}

const sentryMiddleware = async (resolve, parent, args, context, info) => {
  const hr = process.hrtime()
  const { parentType, fieldName } = info
  try {
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
    const result = await resolve(parent, args, context, info)
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
    return result
  } catch (err) {
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
    Sentry.captureException(err)
    await flush()
    return err
  }
}

module.exports = {
  logging,
  sentryMiddleware
}
