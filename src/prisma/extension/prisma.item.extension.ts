import { Item, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import { ImageProxy } from '../../image/image.proxy';
import { LoggerService } from '../../logger/logger.service';

export const ItemImageComputation = (
  config: ConfigService,
  logger: LoggerService,
) =>
  Prisma.defineExtension((client) => {
    return client.$extends({
      result: {
        item: {
          image: {
            needs: { id: true },
            compute: (item) =>
              new ImageProxy(config, logger, `item/${item.id}`).getImageUrls(),
          },
        },
      },
      query: {
        //TODO Remove this computations (Prisma extension has a bug with computed fields)
        $allModels: {
          $allOperations: async ({ args, query }) => {
            const data = await query(args);
            if (args['select']?.items && data['length']) {
              (data as Item[]).forEach((item) => {
                if (item['image']) return;
                item['image'] = new ImageProxy(
                  config,
                  logger,
                  `item/${item.id}`,
                ).getImageUrls();
              });
            }
            return data;
          },
        },
      },
    });
  });
