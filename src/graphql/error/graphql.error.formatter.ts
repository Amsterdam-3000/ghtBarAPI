import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { Injectable } from '@nestjs/common';

import { LoggerService } from '../../logger/logger.service';
import { ArgumentValidationError } from 'type-graphql/dist/errors/ArgumentValidationError';

@Injectable()
export class GraphqlErrorFormatter {
  async getFormatter(logger: LoggerService) {
    const errorCode = (await import('@apollo/server/errors'))
      .ApolloServerErrorCode;

    return (
      formattedError: GraphQLFormattedError,
      error: GraphQLError,
    ): GraphQLFormattedError => {
      error.path
        ? logger.log(`GraphQL path "${error.path.join('/')}" is failed`)
        : logger.log(`GraphQL Bad Request`);

      if ((error.originalError as ArgumentValidationError)?.validationErrors) {
        //TODO Does not work async for formatter function
        formattedError.extensions.code = errorCode.BAD_USER_INPUT;
        formattedError.extensions.exception = error.originalError;
      }
      return formattedError;
    };
  }
}
