const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ datasourceUrl: '' });

async function migrateCountry() {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all');
    const data = await response.json();

    for (const country of data) {
      await prisma.country
        .update({
          where: { id: country.cca2 },
          data: { emoji: country.flag },
        })
        .catch((error) => {
          console.log(error);
        });
    }

    await prisma.country
      .update({
        where: { id: 'GB-ENG' },
        data: { emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      })
      .catch((error) => {
        console.log(error);
      });

    await prisma.country
      .update({
        where: { id: 'GB-SCT' },
        data: { emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
      })
      .catch((error) => {
        console.log(error);
      });

    await prisma.country
      .update({
        where: { id: 'GB-WLS' },
        data: { emoji: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
      })
      .catch((error) => {
        console.log(error);
      });

    await prisma.country
      .update({
        where: { id: 'GB-NIR' },
        data: { emoji: '🇬🇧' },
      })
      .catch((error) => {
        console.log(error);
      });

    await prisma.country
      .update({
        where: { id: 'UN' },
        data: { emoji: '🇺🇳' },
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    console.error(error);
  }
}

migrateCountry().catch();
