const Sentry = require('@sentry/node')
const dsn = process.env.SENTRY_DSN
if (dsn) {
  Sentry.init({ dsn })
}

module.exports = {
  dsn,
  Sentry,
  configured: !!dsn
}
