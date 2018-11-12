// @see http://getsentry.github.io/sentry-javascript/modules/node.html
const Sentry = require('@sentry/node')

const {
  LANE,
  HEXLY_SENTRY_DSN,
  HEXLY_SENTRY_DEBUG = false,
  HEXLY_SENTRY_LOG_LEVEL = 2,
  HEXLY_SENTRY_SAMPLE_RATE = 1.0,
  HEXLY_SENTRY_ENVIRONMENT = process.env.LANE
} = process.env

if (HEXLY_SENTRY_DSN) {
  Sentry.init({
    dsn: HEXLY_SENTRY_DSN,
    debug: HEXLY_SENTRY_DEBUG,
    logLevel: HEXLY_SENTRY_LOG_LEVEL,
    sampleRate: 1,
    environment: HEXLY_SENTRY_ENVIRONMENT
    // beforeBreadcrumb: (breadcrumb, hint) => {
    //   console.log('Sending breadcrumb', breadcrumb)
    //   return breadcrumb
    // }
  })
}

module.exports = {
  dsn: HEXLY_SENTRY_DSN,
  Sentry,
  configured: !!HEXLY_SENTRY_DSN
}
