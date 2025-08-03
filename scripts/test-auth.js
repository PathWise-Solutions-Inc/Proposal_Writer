const fetch = require('node-fetch');

const API_URL = 'http://localhost:8001/api/auth';

async function testAuth() {
  console.log('🔐 Testing Authentication Service...\n');

  // Test data
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'Test User'
  };

  try {
    // 1. Test Registration
    console.log('1️⃣ Testing Registration...');
    const registerRes = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!registerRes.ok) {
      const error = await registerRes.json();
      throw new Error(`Registration failed: ${JSON.stringify(error)}`);
    }

    const registerData = await registerRes.json();
    console.log('✅ Registration successful');
    console.log(`   User ID: ${registerData.user.id}`);
    console.log(`   Access Token: ${registerData.accessToken.substring(0, 20)}...`);

    // 2. Test Login
    console.log('\n2️⃣ Testing Login...');
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    if (!loginRes.ok) {
      const error = await loginRes.json();
      throw new Error(`Login failed: ${JSON.stringify(error)}`);
    }

    const loginData = await loginRes.json();
    console.log('✅ Login successful');
    console.log(`   Access Token: ${loginData.accessToken.substring(0, 20)}...`);

    // 3. Test Profile (Protected Route)
    console.log('\n3️⃣ Testing Protected Route (Profile)...');
    const profileRes = await fetch(`${API_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${loginData.accessToken}`
      }
    });

    if (!profileRes.ok) {
      const error = await profileRes.json();
      throw new Error(`Profile fetch failed: ${JSON.stringify(error)}`);
    }

    const profileData = await profileRes.json();
    console.log('✅ Profile fetched successfully');
    console.log(`   Email: ${profileData.email}`);
    console.log(`   Name: ${profileData.name}`);
    console.log(`   Role: ${profileData.role}`);

    // 4. Test Invalid Token
    console.log('\n4️⃣ Testing Invalid Token...');
    const invalidRes = await fetch(`${API_URL}/profile`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    if (invalidRes.ok) {
      throw new Error('Invalid token should have been rejected');
    }

    console.log('✅ Invalid token correctly rejected');

    console.log('\n✨ All authentication tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check if auth service is running
async function checkService() {
  try {
    const res = await fetch('http://localhost:8001/health');
    if (!res.ok) throw new Error('Service not responding');
    const data = await res.json();
    console.log(`✅ Auth service is running: ${data.service}\n`);
    return true;
  } catch (error) {
    console.error('❌ Auth service is not running. Please start it first with:');
    console.error('   cd services/auth-service && npm run dev\n');
    return false;
  }
}

// Run tests
(async () => {
  if (await checkService()) {
    await testAuth();
  }
})();