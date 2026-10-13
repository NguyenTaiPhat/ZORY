const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres =
  dbUrl.startsWith('postgres://') ||
  dbUrl.startsWith('postgresql://') ||
  process.env.VERCEL === '1';

const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

if (fs.existsSync(schemaPath)) {
  let schema = fs.readFileSync(schemaPath, 'utf8');
  const currentMatch = schema.match(/provider\s*=\s*"(sqlite|postgresql)"/);
  const currentProvider = currentMatch ? currentMatch[1] : null;

  if (currentProvider !== targetProvider) {
    schema = schema.replace(
      /provider\s*=\s*"(sqlite|postgresql)"/,
      `provider = "${targetProvider}"`
    );
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log(
      `[ZORY DB PREPARE] Switched Prisma provider from "${currentProvider}" to "${targetProvider}".`
    );
  } else {
    console.log(`[ZORY DB PREPARE] Prisma provider is already "${targetProvider}".`);
  }
}

// Nếu đang trên Vercel hoặc có chuỗi kết nối PostgreSQL thật, tự động đồng bộ cấu trúc DB
if (isPostgres && dbUrl && !dbUrl.startsWith('file:')) {
  try {
    console.log('[ZORY DB PREPARE] Pushing schema to remote PostgreSQL database...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('[ZORY DB PREPARE] Remote PostgreSQL schema synchronized successfully.');
  } catch (err) {
    console.warn(
      '[ZORY DB PREPARE] Warning: prisma db push error (continuing build):',
      err.message
    );
  }
}
