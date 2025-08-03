// Test authentication flow with Playwright MCP
const testAuthFlow = async () => {
  console.log('Starting authentication flow test...');
  
  // Test data
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    company: 'Test Company'
  };
  
  console.log('Test user email:', testUser.email);
  console.log('\nPlease use Playwright MCP to:');
  console.log('1. Navigate to http://localhost:3000');
  console.log('2. Click on "Sign up" link');
  console.log('3. Fill in the registration form with the test user data');
  console.log('4. Submit the form');
  console.log('5. Verify successful registration and redirect to dashboard');
  console.log('6. Log out');
  console.log('7. Log back in with the same credentials');
  console.log('8. Verify successful login and access to dashboard');
};

testAuthFlow();