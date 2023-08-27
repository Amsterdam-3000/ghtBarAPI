import { Country, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import { ImageFlag } from '../../image/image.flag';
import { LoggerService } from '../../logger/logger.service';

export const CountryImageComputation = (
  config: ConfigService,
  logger: LoggerService,
) =>
  Prisma.defineExtension((client) => {
    return client.$extends({
      result: {
        country: {
          image: {
            needs: { id: true },
            compute: (country) =>
              new ImageFlag(config, logger, country.id).getImageUrls(),
          },
        },
      },
      query: {
        //TODO Remove this computation (Prisma extension has a bug with computed fields)
        $allModels: {
          $allOperations: async ({ args, query }) => {
            const data = await query(args);
            if (args['select']?.country && !data['country'] && !data['image']) {
              const flagImage = new ImageFlag(
                config,
                logger,
                (data as Country).id,
              );
              data['image'] = flagImage.getImageUrls();
            }
            return data;
          },
        },
      },
    });
  });
