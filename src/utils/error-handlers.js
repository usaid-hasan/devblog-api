import { GraphQLError } from 'graphql';

/************************************************************/

export function handleValidationError(err) {
  const msg = Object.values(err.errors).reduce((prev, curr) => `${prev} ${curr.message}.`, 'Error!');
  throw new GraphQLError(msg, { extensions: { code: 'BAD_REQUEST' } });
}

/************************************************************/

export function handleCastError(err) {
  const msg = `Invalid ${err.path}: ${err.value}`;
  throw new GraphQLError(msg, { extensions: { code: 'BAD_REQUEST' } });
}

/************************************************************/

export function handleMongoServerError(err) {
  const MONGO_DUPLICATE_KEY_CODE = 11000;
  if (err.code === MONGO_DUPLICATE_KEY_CODE) {
    const msg = `Please use different ${Object.keys(err.keyValue)[0]}`;
    throw new GraphQLError(msg, { extensions: { code: 'BAD_REQUEST' } });
  }
}

/************************************************************/

export function handleNotFoundError(msg) {
  throw new GraphQLError(msg, { extensions: { code: 'NOT_FOUND' } });
}

/************************************************************/

export function handleUnauthenticatedError(msg) {
  throw new GraphQLError(msg, { extensions: { code: 'UNAUTHENTICATED' } });
}

/************************************************************/

export function handleAuthFailedError(msg) {
  throw new GraphQLError(msg, { extensions: { code: 'AUTHENTICATON_FAILED' } });
}

/************************************************************/

export function handleForbiddenError(msg) {
  throw new GraphQLError(msg, { extensions: { code: 'FORBIDDEN' } });
}

/************************************************************/

export function handleBadRequestError(msg) {
  throw new GraphQLError(msg, { extensions: { code: 'BAD_REQUEST' } });
}
