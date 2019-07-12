const util = require('util')
const { logging, sentryMiddleware } = require('./graphql.middleware')

const { HEXLY_GRAPHQL_DEBUG } = process.env
const isDebug = HEXLY_GRAPHQL_DEBUG && HEXLY_GRAPHQL_DEBUG != 'false'

const maybeLog = () => {
  if (isDebug) {
    // 1. Convert args to a normal array
    const args = Array.prototype.slice.call(arguments)
    console.log(...args)
  }
}

let resolvedServer
const refreshSchemas = ({
  schema,
  targets,
  context,
  engine,
  middlewares = [logging, sentryMiddleware],
  formatError,
  libs: { graphql, graphqlTools, graphqlMiddleware, apolloServerLambda }
}) => {
  maybeLog('[serverless-tools:graphql] starting')
  const { ApolloServer } = apolloServerLambda
  const { mergeSchemas, makeExecutableSchema } = graphqlTools
  const { GraphQLSchema } = graphql
  const { applyMiddlewareToDeclaredResolvers } = graphqlMiddleware

  maybeLog('[serverless-tools:graphql] starting')
  resolvedServer = new Promise((resolve, reject) => {
    if (targets && targets.length > 0) {
      return reject(
        new Error(
          'Parameter `targets` is deprecated; merge that schema yourself!'
        )
      )
    }
    middlewares.forEach(mw =>
      applyMiddlewareToDeclaredResolvers(schema, {
        Query: mw,
        Mutation: mw
      })
    )

    const config = {
      schema,
      tracing: true,
      context,
      formatError
    }

    if (engine) {
      config.engine = engine
    }
    const server = new ApolloServer(config)
    const handler = server.createHandler()
    handler.__refreshed = new Date()
    resolve(handler)
  })
  maybeLog('[serverless-tools:graphql] finished init', resolvedServer)
}

const middleware = {
  before: (handler, next) => {
    maybeLog('[serverless-tools:graphql:middleware] starting')
    Promise.resolve(resolvedServer)
      .then(graphqlHandler => {
        maybeLog(
          '[serverless-tools:graphql:middleware] configured',
          graphqlHandler
        )
        handler.context.graphqlHandler = graphqlHandler
        next()
      })
      .catch(err => {
        console.warn('Failed resolving GraphQL Handler', err)
        throw err
      })
  }
}

const handler = (event, context, callback) =>
  context.graphqlHandler(event, context, callback)

module.exports = {
  refreshSchemas,
  middleware,
  handler
}
