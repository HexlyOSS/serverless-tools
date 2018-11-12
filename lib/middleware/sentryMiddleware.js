const { path, pathOr } = require('ramda')
const { Sentry, configured } = require('../util/sentry')

const middleware = {
  before: (handler, next) => {
    if (!configured) {
      console.warn('senty not configured')
      return next()
    }

    Sentry.configureScope(async scope => {
      handler.context.__sentryTime = process.hrtime()

      const route = pathOr('<unknown>', ['event', 'path'], handler)
      Sentry.addBreadcrumb({
        category: 'router',
        message: 'execution.started',
        data: {
          route
        }
      })
      // scope.setUser({ id: '4711' })
      await next()
    })
  },
  onError: (handler, next) => {
    const route = pathOr('<unknown>', ['event', 'path'], handler)
    const hrStart = path(['context', '__sentryTime'], handler)
    let time
    if (hrStart) {
      time = `${process.hrtime(hrStart)[1] / 1000000}ms`
    }

    Sentry.addBreadcrumb({
      category: 'router',
      message: 'execution.errored',
      data: {
        route,
        time
      }
    })
    if (handler.error) {
      Sentry.captureException(handler.error)
    } else {
      Sentry.captureEvent({ message: `error.missing` })
    }
    next()
  }
}

module.exports = {
  sentry: middleware
}
