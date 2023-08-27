import { GraphQLError } from 'graphql/error';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';
import * as depthLimit from 'graphql-depth-limit';
//TODO Remove dependency apollo-server-plugin-base
// import {
// ApolloServerPlugin,
// GraphQLRequestContext,
// GraphQLRequestListener,
// } from 'apollo-server-plugin-base';
import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestListener,
} from '@apollo/server';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { Plugin } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';

@Plugin()
export class GraphqlLimiterPlugin implements ApolloServerPlugin {
  constructor(
    private gqlSchemaHost: GraphQLSchemaHost,
    private config: ConfigService,
  ) {}

  async requestDidStart(
    requestContext: GraphQLRequestContext<object>,
  ): Promise<GraphQLRequestListener<object>> {
    const { schema } = this.gqlSchemaHost;

    const maxDepth = this.config.get<number>('GRAPHQL_DEPTH_LIMIT');
    const maxComplexity = this.config.get<number>('GRAPHQL_COMPLEXITY_LIMIT');

    return {
      async didResolveOperation({ request, document }) {
        let error: Error;

        //Depth limit
        let depth = 0;
        depthLimit(maxDepth, {}, (queryDepths) => {
          depth = queryDepths[request.operationName];
        })({
          getDocument: () => document,
          reportError: (err) => {
            error = err;
          },
        });

        //Complexity limit
        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [fieldExtensionsEstimator(), simpleEstimator()],
        });
        if (complexity > maxComplexity) {
          error = new GraphQLError(
            `Query is too complex: ${complexity}. Maximum allowed complexity: ${maxComplexity}`,
          );
        }

        requestContext.logger.info(
          `GraphQL Depth:${depth} and Complexity:${complexity}`,
        );

        if (error) {
          throw error;
        }
      },
    };
  }
}
