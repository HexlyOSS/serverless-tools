const { pretty } = require('./util/debug')

const isDev = ['dev', 'localhost'].indexOf(process.env.NODE_ENV) >= 0
const isDebug = process.env.GRAPHQL_DEBUG

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

const errorFormatter = error => {
  if (isDev || isDebug) {
    // noop
  } else if (error && error.extensions) {
    delete error.extensions.exception
  }
  return error
}

module.exports = {
  logging,
  errorFormatter
}
