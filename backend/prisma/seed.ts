/**
 * @module prisma/seed
 * @description Database seeding script for 2026GPTees
 * @since 2025-11-21
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRODUCTS = [
  {
    name: 'Basic Tee',
    slug: 'basic-tee',
    description: 'Classic cotton t-shirt, perfect for your custom designs',
    basePrice: 24.99,
    printfulId: '71',
    category: 'T_SHIRT',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Navy', hex: '#000080' },
      { name: 'Gray', hex: '#808080' },
    ],
    imageUrl: 'https://via.placeholder.com/400x400?text=Basic+Tee',
    isActive: true,
  },
  {
    name: 'Premium Tee',
    slug: 'premium-tee',
    description: 'Premium quality cotton t-shirt with enhanced comfort',
    basePrice: 29.99,
    printfulId: '19',
    category: 'T_SHIRT',
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Navy', hex: '#000080' },
      { name: 'Red', hex: '#FF0000' },
      { name: 'Royal Blue', hex: '#4169E1' },
    ],
    imageUrl: 'https://via.placeholder.com/400x400?text=Premium+Tee',
    isActive: true,
  },
  {
    name: 'Hoodie',
    slug: 'hoodie',
    description: 'Comfortable pullover hoodie for cooler days',
    basePrice: 44.99,
    printfulId: '146',
    category: 'HOODIE',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'Gray', hex: '#808080' },
      { name: 'Navy', hex: '#000080' },
    ],
    imageUrl: 'https://via.placeholder.com/400x400?text=Hoodie',
    isActive: true,
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed Products
  console.log('📦 Seeding products...');
  for (const product of PRODUCTS) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
    console.log(`  ✓ Created/Updated product: ${product.name}`);
  }

  // Seed Settings
  console.log('⚙️  Seeding settings...');
  const settings = [
    { key: 'site_name', value: '2026GPTees', type: 'string' },
    { key: 'site_email', value: 'support@gptees.app', type: 'string' },
    { key: 'basic_tier_price', value: '24.99', type: 'number' },
    { key: 'premium_tier_price', value: '34.99', type: 'number' },
    { key: 'basic_tier_max_designs', value: '1', type: 'number' },
    { key: 'premium_tier_max_designs', value: '9999', type: 'number' },
  ];

  for (const setting of settings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
    console.log(`  ✓ Created/Updated setting: ${setting.key}`);
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
