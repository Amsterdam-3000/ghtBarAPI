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
            if (args['select'] && args['select']['country']) {
              const country = await query(args);
              if (country['country'] || country['image']) return country;
              const flagImage = new ImageFlag(
                config,
                logger,
                (country as Country).id,
              );
              country['image'] = flagImage.getImageUrls();
              return country;
            }
            return query(args);
          },
        },
      },
    });
  });
