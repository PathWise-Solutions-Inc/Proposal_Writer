const dotenv = require('dotenv');
const OpenAI = require('openai');

// Load environment variables
dotenv.config();

async function testOpenRouter() {
  console.log('🚀 Testing OpenRouter Connection...\n');

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ Error: OPENROUTER_API_KEY not found');
    process.exit(1);
  }

  console.log('✅ API Key found');
  console.log(`📦 Using model: ${process.env.OPENROUTER_MODEL}\n`);

  try {
    const client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Proposal Writer',
      },
    });

    console.log('Test 1: Simple completion...');
    const completion = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from Proposal Writer!" and tell me what model you are.',
        },
      ],
      max_tokens: 100,
    });

    const content = completion.choices[0].message.content || 
                    completion.choices[0].message.reasoning || 
                    'No content returned';
    console.log('✅ Response:', content);
    console.log(`📊 Usage: ${completion.usage?.total_tokens} tokens`);
    console.log(`💰 Cost: $${((completion.usage?.prompt_tokens || 0) * 0.00015 + (completion.usage?.completion_tokens || 0) * 0.0006).toFixed(6)}\n`);

    // Test 2: Try with a different prompt
    console.log('Test 2: RFP Analysis test...');
    const rfpTest = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'user',
          content: 'Extract requirements from: "The vendor must provide 24/7 support. Cloud hosting is preferred." Format as JSON.',
        },
      ],
      max_tokens: 200,
    });
    
    console.log('✅ RFP Test Response:', rfpTest.choices[0].message.content || 'No content');

    console.log('✅ All tests passed! OpenRouter is configured correctly.');
    console.log('💡 You can now use AI features in your application.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Details:', error.response.data);
    }
  }
}

testOpenRouter();