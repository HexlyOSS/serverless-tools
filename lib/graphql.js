const util = require('util')
// const { ApolloServer } = require('apollo-server-lambda')
// const { mergeSchemas, makeExecutableSchema } = require('graphql-tools')
// const { GraphQLSchema } = require('graphql')
// const { applyMiddleware } = require('graphql-middleware')
const { logging, sentryMiddleware } = require('./graphql.middleware')

const { HEXLY_GRAPHQL_DEBUG } = process.env
const isDebug = HEXLY_GRAPHQL_DEBUG && HEXLY_GRAPHQL_DEBUG != 'false'

let resolvedServer
const refreshSchemas = ({
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
    const frags = []
    const schemas = []

    for (let idx in targets) {
      const schemata = await targets[idx]
      if (schemata.schema) {
        const schema = await schemata.schema
        schemas.push(schema)
      }
      if (typeof schemata.onLink === 'function') {
        frags.push(schemata.onLink)
      }
    }

    let combined = mergeSchemas({
      schemas
    })

    let schema = combined
    for (let idx in frags) {
      schema = await frags[idx](schema)
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
