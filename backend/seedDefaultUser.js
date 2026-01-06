const { User } = require('./models');

async function seedDefaultUser() {
  try {
    // Verifică și crează default doctor user
    const existingDefaultUser = await User.findOne({
      where: { email: 'doctor@example.com' }
    });

    if (!existingDefaultUser) {
      // NU mai hash-uim manual - modelul o face automat în beforeCreate hook
      await User.create({
        email: 'doctor@example.com',
        password: 'password123', // Plain text - va fi hash-uit de model
        name: 'Dr. Default',
        role: 'doctor'
      });
      console.log('✅ Default user created');
      console.log('   Email: doctor@example.com');
      console.log('   Password: password123');
    } else {
      console.log('✅ Default user already exists');
    }

    // Verifică și crează Matei user
    const existingMateiUser = await User.findOne({
      where: { email: 'test@test.com' }
    });

    if (!existingMateiUser) {
      // NU mai hash-uim manual - modelul o face automat
      await User.create({
        email: 'test@test.com',
        password: 'romania12', // Plain text - va fi hash-uit de model
        name: 'Matei',
        role: 'doctor'
      });
      console.log('✅ Matei user created');
      console.log('   Email: test@test.com');
      console.log('   Password: romania12');
    } else {
      console.log('✅ Matei user already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
  }
}

module.exports = seedDefaultUser;
