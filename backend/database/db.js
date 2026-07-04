import { PrismaClient } from '@prisma/client';

import pkg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pkg;
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Prevent multiple instances of Prisma Client in development (singleton pattern)
const prisma = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export default prisma;
