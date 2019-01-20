const util = require('util')
const { logging, sentryMiddleware } = require('./graphql.middleware')

const { HEXLY_GRAPHQL_DEBUG } = process.env
const isDebug = HEXLY_GRAPHQL_DEBUG && HEXLY_GRAPHQL_DEBUG != 'false'

let resolvedServer
const refreshSchemas = ({
  schema,
  targets,
  context,
  middlewares = [logging, sentryMiddleware],
  formatError,
  libs: { graphql, graphqlTools, graphqlMiddleware, apolloServerLambda }
}) => {
  const { ApolloServer } = apolloServerLambda
  const { mergeSchemas, makeExecutableSchema } = graphqlTools
  const { GraphQLSchema } = graphql
  const { applyMiddlewareToDeclaredResolvers } = graphqlMiddleware

  resolvedServer = new Promise(async resolve => {
    if (targets && targets.length > 0) {
      throw new Error(
        'Parameter `targets` is deprecated; merge that schema yourself!'
      )
    }
    middlewares.forEach(mw =>
      applyMiddlewareToDeclaredResolvers(schema, {
        Query: mw,
        Mutation: mw
      })
    )
    const server = new ApolloServer({
      schema,
      tracing: true,
      context,
      formatError
    })
    const handler = server.createHandler()
    handler.__refreshed = new Date()
    resolve(handler)
  })
}

const middleware = {
  before: (handler, next) => {
    Promise.resolve(resolvedServer)
      .then(graphqlHandler => {
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
