import { Test } from '@nestjs/testing';

import { LoggerService } from '../../logger/logger.service';
import { LoggerServiceMock } from '../../logger/logger.mock';
import { GraphqlAuthChecker } from './graphql.auth.checker';
import { GraphqlAuthModule } from './graphql.auth.module';

describe('GraphqlAuthChecker', () => {
  let checker: GraphqlAuthChecker;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      imports: [GraphqlAuthModule],
    })
      .overrideProvider(LoggerService)
      .useClass(LoggerServiceMock)
      .compile();
    checker = module.get<GraphqlAuthChecker>(GraphqlAuthChecker);
  });

  it('should be defined', () => {
    expect(checker).toBeDefined();
  });

  it('should be checked without roles', async () => {
    const checked = await checker.check({} as any, []);
    expect(checked).toBeTruthy();
  });

  it('should not be checked bot agent', async () => {
    const checked = await checker.check(
      { context: { req: { useragent: { isBot: true } } } } as any,
      ['AGENT_USER'],
    );
    expect(checked).toBeFalsy();
  });

  it('should be checked non-bot agent', async () => {
    const checked = await checker.check(
      { context: { req: { useragent: { isBot: false } } } } as any,
      ['AGENT_USER'],
    );
    expect(checked).toBeTruthy();
  });

  it('should not be checked without user', async () => {
    const checked = await checker.check({ context: { req: {} } } as any, [
      'USER',
    ]);
    expect(checked).toBeFalsy();
  });

  it('should not be checked user with wrong role', async () => {
    const checked = await checker.check(
      { context: { req: {}, user: { role: 'NOT_USER' } } } as any,
      ['USER'],
    );
    expect(checked).toBeFalsy();
  });

  it('should be checked user with right role', async () => {
    const checked = await checker.check(
      { context: { req: {}, user: { role: 'ADMIN' } } } as any,
      ['ADMIN'],
    );
    expect(checked).toBeTruthy();
  });

  it('should not be checked user with right role and bot agent', async () => {
    const checked = await checker.check(
      {
        context: {
          req: { useragent: { isBot: true } },
          user: { role: 'ADMIN' },
        },
      } as any,
      ['ADMIN', 'AGENT_USER'],
    );
    expect(checked).toBeFalsy();
  });

  it('should not be checked user with wrong role and non-bot agent', async () => {
    const checked = await checker.check(
      {
        context: {
          req: { useragent: { isBot: false } },
          user: { role: 'NOT_ADMIN' },
        },
      } as any,
      ['ADMIN', 'AGENT_USER'],
    );
    expect(checked).toBeFalsy();
  });

  it('should be checked user with right role and non-bot agent', async () => {
    const checked = await checker.check(
      {
        context: {
          req: { useragent: { isBot: false } },
          user: { role: 'ADMIN' },
        },
      } as any,
      ['ADMIN', 'AGENT_USER'],
    );
    expect(checked).toBeTruthy();
  });

  it('should not be checked non-user entity input for user role', async () => {
    const checked = await checker.check(
      {
        context: { req: {}, user: { role: 'USER' } },
        info: { returnType: { name: 'Item' } },
      } as any,
      ['USER'],
    );
    expect(checked).toBeFalsy();
  });

  it('should not be checked user entity input for another user', async () => {
    let checked = await checker.check(
      {
        context: {
          req: {},
          user: { id: '1', email: '2', name: '3', role: 'USER' },
        },
        info: { returnType: { name: 'User' } },
      } as any,
      ['USER'],
    );
    expect(checked).toBeFalsy();
    checked = await checker.check(
      {
        context: {
          req: {},
          user: { id: '1', email: '2', name: '3', role: 'USER' },
        },
        info: { returnType: { name: 'User' } },
        args: { where: { id: '2' } },
      } as any,
      ['USER'],
    );
    expect(checked).toBeFalsy();
    checked = await checker.check(
      {
        context: {
          req: {},
          user: { id: '1', email: '2', name: '3', role: 'USER' },
        },
        info: { returnType: { name: 'User' } },
        args: { where: { email: '1' } },
      } as any,
      ['USER'],
    );
    expect(checked).toBeFalsy();
    checked = await checker.check(
      {
        context: {
          req: {},
          user: { id: '1', email: '2', name: '3', role: 'USER' },
        },
        info: { returnType: { name: 'User' } },
        args: { where: { name: '2' } },
      } as any,
      ['USER'],
    );
    expect(checked).toBeFalsy();
  });

  it('should be checked user entity input for the same user', async () => {
    let checked = await checker.check(
      {
        context: {
          req: {},
          user: { id: '1', email: '2', name: '3', role: 'USER' },
        },
        info: { returnType: { name: 'User' } },
        args: { where: { id: '1' } },
      } as any,
      ['USER'],
    );
    expect(checked).toBeTruthy();
    checked = await checker.check(
      {
        context: {
          req: {},
          user: { id: '1', email: '2', name: '3', role: 'USER' },
        },
        info: { returnType: { name: 'User' } },
        args: { where: { id: '2', email: '2' } },
      } as any,
      ['USER'],
    );
    expect(checked).toBeTruthy();
    checked = await checker.check(
      {
        context: {
          req: {},
          user: { id: '1', email: '2', name: '3', role: 'USER' },
        },
        info: { returnType: { name: 'User' } },
        args: { where: { id: '3', email: '3', name: '3' } },
      } as any,
      ['USER'],
    );
    expect(checked).toBeTruthy();
  });

  it('should not be checked user entity output for another user', async () => {
    let checked = await checker.check(
      {
        context: { req: {}, user: { id: '1', role: 'USER' } },
        root: { id: '1', userId: '2' },
        info: { path: { typename: 'Item' } },
      } as any,
      ['USER'],
    );
    expect(checked).toBeFalsy();
    checked = await checker.check(
      {
        context: { req: {}, user: { id: '2', role: 'USER' } },
        root: { id: '1', userId: '2' },
        info: { path: { typename: 'User' } },
      } as any,
      ['USER'],
    );
    expect(checked).toBeFalsy();
  });

  it('should be checked user entity output for the same user', async () => {
    let checked = await checker.check(
      {
        context: { req: {}, user: { id: '2', role: 'USER' } },
        root: { id: '1', userId: '2' },
        info: { path: { typename: 'Item' } },
      } as any,
      ['USER'],
    );
    expect(checked).toBeTruthy();
    checked = await checker.check(
      {
        context: { req: {}, user: { id: '1', role: 'USER' } },
        root: { id: '1', userId: '2' },
        info: { path: { typename: 'User' } },
      } as any,
      ['USER'],
    );
    expect(checked).toBeTruthy();
  });

  it('should set logging context', async () => {
    expect(checker['logger'].setContext).toBeCalledWith(
      GraphqlAuthChecker.name,
    );
  });

  it('should not be logged without roles', async () => {
    await checker.check({} as any, []);
    expect(checker['logger'].log).not.toHaveBeenCalled();
  });

  it('should be logged check user agent', async () => {
    await checker.check(
      { context: { req: { useragent: { isBot: false } } } } as any,
      ['AGENT_USER'],
    );
    expect(checker['logger'].log).toHaveBeenCalledTimes(1);
  });

  it('should be logged check role and user agent', async () => {
    await checker.check(
      {
        context: {
          req: { useragent: { isBot: false } },
          user: { role: 'ADMIN' },
        },
      } as any,
      ['ADMIN', 'AGENT_USER'],
    );
    expect(checker['logger'].log).toHaveBeenCalledTimes(2);
  });

  it('should be logged check role and entity input', async () => {
    await checker.check(
      {
        context: { req: {}, user: { id: '1', role: 'USER' } },
        info: { returnType: { name: 'User' } },
        args: { where: { id: '1' } },
      } as any,
      ['USER'],
    );
    expect(checker['logger'].log).toHaveBeenCalledTimes(2);
  });

  it('should be logged check role and entity output', async () => {
    await checker.check(
      {
        context: { req: {}, user: { id: '2', role: 'USER' } },
        root: { id: '1', userId: '2' },
        info: { path: { typename: 'Item' } },
      } as any,
      ['USER'],
    );
    expect(checker['logger'].log).toHaveBeenCalledTimes(2);
  });
});
