import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function seed() {
  if (process.env.NODE_ENV === 'production') throw new Error('Example seed is disabled in production');
  const category = await prisma.category.upsert({ where: { slug: 'boilies' }, create: { name: 'Boilies', slug: 'boilies' }, update: {} });
  for (const [slug, name] of [['pellets', 'Pellets'], ['additives', 'Additives']]) await prisma.category.upsert({ where: { slug }, create: { name, slug }, update: {} });
  const examples = [
    ['product01', 'WORKHORSE', 'Everyday boilies for a dependable response.'],
    ['product02', 'THE ONE', 'Savoury frankfurter sausage boilies.'],
    ['product03', 'PURPLE KRAKEN', 'Squid and plum with an advanced flavour profile.'],
    ['product4', 'TRIGGER SIGNATURE', 'A balanced bait for confident sessions.'],
    ['product5', 'NIGHT RESPONSE', 'A deep profile designed to keep working.'],
    ['product6', 'SIGNAL BAITS', 'A bright, focused finish for active water.'],
  ];
  // EUR 20.00 is illustrative development data, not a conversion of the old KM price.
  for (const [id, name, description] of examples) await prisma.product.upsert({ where: { id }, update: {}, create: {
    id, name, description, slug: name.toLowerCase().replaceAll(' ', '-'), price: '20.00', stock: 100, imageUrl: `/${id}.png`, categoryId: category.id,
  } });
  console.log('Development categories and products seeded; no accounts created');
}
seed().catch(() => { console.error('Seed failed; check database configuration'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
