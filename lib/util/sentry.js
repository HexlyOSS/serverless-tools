// @see http://getsentry.github.io/sentry-javascript/modules/node.html
const Sentry = require('@sentry/node')

const {
  LANE,
  HEXLY_SENTRY_DSN,
  HEXLY_SENTRY_DEBUG = false,
  HEXLY_SENTRY_LOG_LEVEL = 2,
  HEXLY_SENTRY_SAMPLE_RATE = 1.0,
  HEXLY_SENTRY_ENVIRONMENT = process.env.LANE,
  HEXLY_SENTRY_ALLOW_DUPLICATES = false,
  HEXLY_SENTRY_RELEASE
} = process.env

const init = () => {
  if (HEXLY_SENTRY_DSN) {
    Sentry.init({
      dsn: HEXLY_SENTRY_DSN,
      debug: HEXLY_SENTRY_DEBUG,
      release: HEXLY_SENTRY_RELEASE,
      logLevel: HEXLY_SENTRY_LOG_LEVEL,
      sampleRate: HEXLY_SENTRY_SAMPLE_RATE,
      environment: HEXLY_SENTRY_ENVIRONMENT,
      allowDuplicates: HEXLY_SENTRY_ALLOW_DUPLICATES
      // beforeBreadcrumb: (breadcrumb, hint) => {
      //   console.log('Sending breadcrumb', breadcrumb)
      //   return breadcrumb
      // }
    })
  }
}

const flush = async () => {
  await new Promise(resolve => {
    const client = Sentry.getCurrentHub().getClient()
    if (client && HEXLY_SENTRY_DSN) {
      client.close(2000).then(resolve)
    } else {
      resolve(true)
    }
    init()
  })
}

init()

module.exports = {
  init,
  flush,
  dsn: HEXLY_SENTRY_DSN,
  Sentry,
  configured: !!HEXLY_SENTRY_DSN
}
