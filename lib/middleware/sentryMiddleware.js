const { path, pathOr } = require()
const { Sentry } = require('../util/sentry')

const middleware = {
  before: (handler, next) => {
    Sentry.configureScope(scope => {
      const route = pathOr('<unknown>', ['event', 'path'], handler)
      handler.context.sentry = scope
      scope.setExtra('route', route)
      // scope.setTag('user_mode', 'admin');
      // scope.setUser({ id: '4711' })
      next()
    })
  },
  after: handler => {
    const scope = path(['context', 'sentry'], handler)
    if (scope) {
      scope.clear()
    } else {
      console.warn('[middy:sentry] Scope not found in after!')
    }
    next()
  },
  onError: (handler, next) => {
    const scope = path(['context', 'sentry'], handler)
    if (scope) {
      console.log('error', Object.keys(handler))
      scope.clear()
    } else {
      console.warn('[middy:sentry] Scope not found in onError!')
    }
    next()
  }
}

module.exports = {
  sentry: middleware
}
