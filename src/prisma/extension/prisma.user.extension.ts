import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';

import { LoggerService } from '../../logger/logger.service';

//TODO Move to keycloak service
export const UserAuthentication = (logger: LoggerService) =>
  Prisma.defineExtension((client) => {
    return client.$extends({
      model: {
        user: {
          signIn: async (username: string, password: string): Promise<User> => {
            logger.log(`Checking username "${username}" and password`);

            const user = await client.user.findUniqueOrThrow({
              where: { name: username },
            });
            const isPasswordValid = await bcrypt.compare(
              password,
              user.password,
            );
            if (!isPasswordValid) {
              throw new Error('Invalid password');
            }
            return user;
          },
        },
      },
      query: {
        user: {
          create: async ({ args, query }) => {
            if (args.data.password) {
              const password = args.data.password;
              args.data.password = await bcrypt.hash(password, 10);

              logger.log(
                `Creating user ${LoggerService.userUniqToStr(
                  args.data as User,
                )}: password was hashed`,
              );
            }
            return query(args);
          },
          update: async ({ args, query }) => {
            if (args.data.password) {
              const password = args.data.password as string;
              args.data.password = await bcrypt.hash(password, 10);

              logger.log(
                `Updating user ${LoggerService.userUniqToStr(
                  args.where as User,
                )}: password was hashed`,
              );
            }
            return query(args);
          },
        },
      },
    });
  });
