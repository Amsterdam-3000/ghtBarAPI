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
            if (args['select'] && args['select']['items']) {
              const items = await query(args);
              if (!items['length']) return items;
              (items as Item[]).forEach((item) => {
                if (item['image']) return;
                item['image'] = new ImageProxy(
                  config,
                  logger,
                  `item/${item.id}`,
                ).getImageUrls();
              });
              return items;
            }
            return query(args);
          },
        },
      },
    });
  });
