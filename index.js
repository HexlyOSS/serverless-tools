const server = require('./lib/graphql')

// libs – exposed to avoid version discrepencies when creating schemas
const fetch = require('node-fetch')
const graphql = require('graphql')
const graphqlTools = require('graphql-tools')
const apolloLinkHttp = require('apollo-link-http')
const apolloLinkContext = require('apollo-link-context')
const apolloServerLambda = require('apollo-server-lambda')

module.exports = {
  GraphQL: {
    server
  },
  lib: {
    fetch,
    graphql,
    graphqlTools,
    apolloLinkHttp,
    apolloLinkContext,
    apolloServerLambda
  }
}
