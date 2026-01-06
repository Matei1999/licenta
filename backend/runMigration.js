const { sequelize } = require('./config/database');

const runMigration = async () => {
  try {
    console.log('🔧 Running migration: Add compliance and AHI residual columns...');

    // Add cpapComplianceLessThan4hPct column
    await sequelize.query(`
      ALTER TABLE "Visits" 
      ADD COLUMN IF NOT EXISTS "cpapComplianceLessThan4hPct" INTEGER;
    `);
    console.log('✅ Added cpapComplianceLessThan4hPct column');

    // Add cpapComplianceLessThan4h column
    await sequelize.query(`
      ALTER TABLE "Visits" 
      ADD COLUMN IF NOT EXISTS "cpapComplianceLessThan4h" BOOLEAN DEFAULT false;
    `);
    console.log('✅ Added cpapComplianceLessThan4h column');

    // Add ahiResidual column
    await sequelize.query(`
      ALTER TABLE "Visits" 
      ADD COLUMN IF NOT EXISTS "ahiResidual" DECIMAL(5, 2);
    `);
    console.log('✅ Added ahiResidual column');

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

runMigration();
