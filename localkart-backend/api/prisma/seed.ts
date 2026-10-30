import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting LocalKart v3 database seeding...');

  // Paths to frontend mock data (same directory root)
  const frontendDataDir = path.resolve(__dirname, '../../../src/data');

  const shopsRaw = JSON.parse(fs.readFileSync(path.join(frontendDataDir, 'shops.json'), 'utf8'));
  const productsRaw = JSON.parse(fs.readFileSync(path.join(frontendDataDir, 'products.json'), 'utf8'));
  const offersRaw = JSON.parse(fs.readFileSync(path.join(frontendDataDir, 'offers.json'), 'utf8'));
  const suppliersRaw = JSON.parse(fs.readFileSync(path.join(frontendDataDir, 'suppliers.json'), 'utf8'));
  const requestsRaw = JSON.parse(fs.readFileSync(path.join(frontendDataDir, 'requests.json'), 'utf8'));
  const expensesRaw = JSON.parse(fs.readFileSync(path.join(frontendDataDir, 'expenses.json'), 'utf8'));
  const khataRaw = JSON.parse(fs.readFileSync(path.join(frontendDataDir, 'khata.json'), 'utf8'));

  // 1. Create Default Users (Bcrypt hashed password: 'localkart123')
  const passwordHash = await bcrypt.hash('localkart123', 10);

  const customerUser = await prisma.user.upsert({
    where: { phone: '+91 98421 90112' },
    update: {},
    create: {
      id: 'user-customer-1',
      phone: '+91 98421 90112',
      name: 'Murugan K.',
      role: 'customer',
      passwordHash,
    },
  });

  const ownerUser = await prisma.user.upsert({
    where: { phone: '+91 94431 82301' },
    update: {},
    create: {
      id: 'user-owner-1',
      phone: '+91 94431 82301',
      name: 'Sri Krishna Provisions Owner',
      role: 'owner',
      passwordHash,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { phone: '+91 99999 99999' },
    update: {},
    create: {
      id: 'user-admin-1',
      phone: '+91 99999 99999',
      name: 'LocalKart System Admin',
      role: 'admin',
      passwordHash,
    },
  });

  console.log('✓ Created system users (customer, owner, admin)');

  // 2. Seed Shops
  for (const s of shopsRaw) {
    await prisma.shop.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        shortName: s.shortName || s.name.slice(0, 16),
        nameTa: s.nameTa,
        area: s.area,
        address: s.address,
        phone: s.phone,
        lat: s.lat,
        lng: s.lng,
        rating: s.rating,
        reviewCount: s.reviewCount,
        openNow: s.openNow ?? true,
        hours: s.hours || '8:00 AM - 9:30 PM',
        delivery: s.delivery ?? true,
        pickup: s.pickup ?? true,
        categories: JSON.stringify(s.categories || []),
        bannerColor: s.bannerColor || '#0E3B2C',
        type: s.type || 'small',
        verified: s.verified ?? true,
        avgReplyMins: s.avgReplyMins || 15,
      },
    });
  }
  console.log(`✓ Seeded ${shopsRaw.length} Pollachi shops & department stores`);

  // 3. Seed Products
  for (const p of productsRaw) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        nameTa: p.nameTa,
        category: p.category,
        unit: p.unit,
        image: p.image,
        description: p.description,
        descriptionTa: p.descriptionTa,
      },
    });
  }
  console.log(`✓ Seeded ${productsRaw.length} products`);

  // 4. Seed Offers (Convert Rupee floats to integer Paise: ₹52 -> 5200)
  for (const o of offersRaw) {
    await prisma.offer.upsert({
      where: {
        productId_shopId: {
          productId: o.productId,
          shopId: o.shopId,
        },
      },
      update: {},
      create: {
        id: o.id,
        productId: o.productId,
        shopId: o.shopId,
        price: Math.round(o.price * 100), // Integer paise
        mrp: o.mrp ? Math.round(o.mrp * 100) : Math.round(o.price * 100),
        stock: o.stock ?? 15,
        deliveryEstMins: o.deliveryEstMins ?? 25,
        pickupEstMins: o.pickupEstMins ?? 10,
        source: o.source || 'owner',
      },
    });
  }
  console.log(`✓ Seeded ${offersRaw.length} offers`);

  // 5. Seed Suppliers
  for (const sup of suppliersRaw) {
    await prisma.supplier.upsert({
      where: { id: sup.id },
      update: {},
      create: {
        id: sup.id,
        name: sup.name,
        phone: sup.phone,
        itemsJson: JSON.stringify(sup.items || []),
      },
    });
  }
  console.log(`✓ Seeded ${suppliersRaw.length} local suppliers`);

  // 6. Seed Expenses
  for (const exp of expensesRaw) {
    await prisma.expense.create({
      data: {
        id: exp.id,
        shopId: exp.shopId,
        amount: Math.round(exp.amount * 100), // Paise
        category: exp.category,
        mode: exp.mode,
        date: new Date(exp.date),
        note: exp.note,
      },
    });
  }
  console.log(`✓ Seeded ${expensesRaw.length} store expenses`);

  // 7. Seed Khata (Customer Credit Accounts)
  const khataCustomer = await prisma.khataCustomer.create({
    data: {
      id: 'kh-cust-1',
      shopId: 'shop-1',
      name: 'Ramasamy (Farmer, Vadakkipalayam)',
      phone: '+91 98421 55678',
    },
  });

  for (const ke of khataRaw) {
    await prisma.khataEntry.create({
      data: {
        id: ke.id,
        customerId: khataCustomer.id,
        type: ke.type,
        amount: Math.round(ke.amount * 100), // Paise
        date: new Date(ke.date),
        note: ke.note,
      },
    });
  }
  console.log(`✓ Seeded khata ledger`);

  // 8. Seed Customer "Can't Find It?" Requests
  for (const req of requestsRaw) {
    const createdReq = await prisma.itemRequest.create({
      data: {
        id: req.id,
        userId: customerUser.id,
        customerName: req.customerName,
        customerPhone: req.customerPhone,
        text: req.text,
        area: req.area,
        createdAt: new Date(req.createdAt),
      },
    });

    if (req.replies && req.replies.length > 0) {
      for (const rep of req.replies) {
        await prisma.itemRequestReply.create({
          data: {
            requestId: createdReq.id,
            shopId: rep.shopId,
            shopName: rep.shopName,
            price: rep.price ? Math.round(rep.price * 100) : null,
            available: rep.available ?? true,
            replyAt: new Date(rep.replyAt || Date.now()),
          },
        });
      }
    }
  }
  console.log(`✓ Seeded ${requestsRaw.length} item inquiries and shop quotations`);

  // 9. Seed Cameras and Mock Shelf Snapshot
  const cam1 = await prisma.camera.create({
    data: {
      id: 'cam-grains',
      shopId: 'shop-1',
      name: 'Rack 1 - Grains & Staples',
      zoneId: 'grocery',
      status: 'online',
    },
  });

  const snap1 = await prisma.shelfSnapshot.create({
    data: {
      id: 'snap-1',
      cameraId: cam1.id,
      frameHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      boxesJson: JSON.stringify([
        { label: 'Ponni Rice 1kg', qty: 12, confidence: 0.94, bbox: [12, 18, 38, 30] },
        { label: 'Sona Masoori 1kg', qty: 10, confidence: 0.91, bbox: [54, 18, 34, 30] },
      ]),
      gapCount: 1,
    },
  });

  await prisma.shelfGap.create({
    data: {
      snapshotId: snap1.id,
      slot: 'Rack-A2',
      productId: 'prod-1',
      missing: 2,
    },
  });
  console.log(`✓ Seeded edge camera & shelf snapshot`);

  // 10. Seed 6 Months of Historical Sales & Stock Movements (for Demand Forecasting model)
  console.log('⏳ Generating 180 days of realistic daily sales history...');
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 180);

  // Deterministic seed PRNG
  let seed = 42;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const salesRecords = [];
  for (let day = 0; day < 180; day++) {
    const curDate = new Date(baseDate);
    curDate.setDate(baseDate.getDate() + day);

    const isWeekend = curDate.getDay() === 0 || curDate.getDay() === 6;
    const isTuesday = curDate.getDay() === 2; // Pollachi Market Day

    // Baseline sales with weekend & Tuesday lift
    let dailyQty = 5 + Math.floor(pseudoRandom() * 4);
    if (isWeekend) dailyQty += 3;
    if (isTuesday) dailyQty += 4;

    salesRecords.push({
      shopId: 'shop-1',
      productId: 'prod-1',
      productName: 'Ponni Boiled Rice (1kg)',
      type: 'sale',
      qty: -dailyQty,
      at: curDate,
      note: 'POS Terminal Cash/UPI Sale',
    });
  }

  for (const sm of salesRecords) {
    await prisma.stockMovement.create({ data: sm });
  }
  console.log(`✓ Created ${salesRecords.length} historical stock movements`);

  // 11. Initial ModelRun Record (TRL 3 Verification Log)
  await prisma.modelRun.create({
    data: {
      id: 'run-seed-001',
      name: 'baseline-seasonal-naive',
      version: '1.0.0',
      datasetName: 'pollachi-synthetic-history-180d',
      metricsJson: JSON.stringify({
        mae: 2.15,
        rmse: 2.84,
        coverage80: 0.82,
        synthetic: true,
      }),
      synthetic: true,
    },
  });

  console.log('✅ LocalKart v3 database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
