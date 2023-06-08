import { GraphQLObjectType } from 'graphql/type/definition';
import { AuthChecker } from 'type-graphql';
import { IAppContext } from '../app/app.model';
import type { Role } from '@prisma/client';

const authUserInputChecker: AuthChecker<IAppContext, Role> = (data) => {
  if ((data.info.returnType as GraphQLObjectType).name !== 'User') {
    return false;
  }
  return (
    data.args?.where?.id === data.context.user.id ||
    data.args?.where?.name === data.context.user.name ||
    data.args?.where?.email === data.context.user.email
  );
};

const authUserOutputChecker: AuthChecker<IAppContext, Role> = (data) => {
  return data.info.path.typename === 'User'
    ? data.root.id === data.context.user.id
    : data.root.userId === data.context.user.id;
};

export const authChecker: AuthChecker<IAppContext, Role> = (data, roles) => {
  if (!data.context.user || !roles.includes(data.context.user.role)) {
    return false;
  }
  //TODO Check other approaches for code below
  if (data.context.user.role !== 'USER') {
    return true;
  }
  if (data.root) {
    return authUserOutputChecker(data, roles);
  } else {
    return authUserInputChecker(data, roles);
  }
};
