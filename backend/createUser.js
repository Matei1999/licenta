const { sequelize, User } = require('./models');

const createUser = async () => {
  try {
    console.log('🔧 Creating new user...');

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: 'test@test.com' } });
    if (existingUser) {
      console.log('⚠️  User with this email already exists');
      process.exit(0);
    }

    // Create user with password hashing handled by User model hook
    const newUser = await User.create({
      name: 'Matei',
      email: 'test@test.com',
      password: 'romania12',
      role: 'doctor'
    });

    console.log('✅ User created successfully:');
    console.log(`   Name: ${newUser.name}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   ID: ${newUser.id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  }
};

createUser();
