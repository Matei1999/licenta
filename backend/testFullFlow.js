const axios = require('axios');
const { connectDB } = require('./config/database');
const { User } = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const testFullFlow = async () => {
  try {
    await connectDB();
    console.log('Database connected');
    
    // Create test user
    let user = await User.findOne({ where: { email: 'testapi@test.com' } });
    if (!user) {
      const hashedPassword = await bcrypt.hash('test123', 10);
      user = await User.create({
        name: 'Test API User',
        email: 'testapi@test.com',
        password: hashedPassword,
        role: 'doctor'
      });
      console.log('Created test user');
    }

    // Create a JWT token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    console.log('Created JWT token');

    // Start the server and test the API
    const express = require('express');
    const cors = require('cors');
    const dotenv = require('dotenv');
    dotenv.config();

    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Add auth middleware
    const auth = require('./middleware/auth');
    
    // Use routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/patients', require('./routes/patients'));

    const server = app.listen(5000, async () => {
      console.log('API server started on port 5000');

      try {
        // Test the patient creation API
        const testPatientData = {
          firstName: 'API Test',
          lastName: 'Patient',
          dateOfBirth: '1990-01-15',
          gender: 'Male',
          email: 'apitestpatient' + Date.now() + '@test.com',
          phone: '0987654321'
        };

        console.log('\nSending POST request to /api/patients with data:', testPatientData);
        
        const response = await axios.post('http://localhost:5000/api/patients', testPatientData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Patient created successfully!');
        console.log('Response:', response.data);
        
        server.close();
        process.exit(0);
      } catch (error) {
        console.error('❌ API request failed:');
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', error.response.data);
        } else {
          console.error('Error:', error.message);
        }
        server.close();
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
};

testFullFlow();
