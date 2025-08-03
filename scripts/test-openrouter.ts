#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

async function testOpenRouter() {
  console.log('🚀 Testing OpenRouter Connection...\n');

  // Check if API key exists
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ Error: OPENROUTER_API_KEY not found in environment variables');
    process.exit(1);
  }

  console.log('✅ API Key found');
  console.log(`📦 Using model: ${process.env.OPENROUTER_MODEL || 'google/gemini-2.5-pro'}\n`);

  try {
    // Initialize OpenRouter client
    const client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_APP_URL || 'http://localhost:3000',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'Proposal Writer',
      },
    });

    // Test 1: Simple completion
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

    console.log('✅ Response:', completion.choices[0].message.content);
    console.log(`📊 Usage: ${completion.usage?.total_tokens} tokens\n`);

    // Test 2: RFP Analysis (simulated)
    console.log('Test 2: RFP Analysis capability...');
    const rfpTest = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'system',
          content: 'You are an RFP analyst. Extract requirements from the following text and return as JSON.',
        },
        {
          role: 'user',
          content: `Extract requirements from this sample RFP text:
          "The vendor shall provide a cloud-based solution. 
          The system must support 1000 concurrent users. 
          24/7 support is preferred but not required."
          
          Return as JSON with format: {"requirements": [{"text": "...", "type": "mandatory|optional"}]}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    console.log('✅ RFP Analysis Response:', rfpTest.choices[0].message.content);

    // Test 3: Available models
    console.log('\nTest 3: Fetching available models...');
    const modelsResponse = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    if (modelsResponse.ok) {
      const models = await modelsResponse.json() as { data: any[] };
      const relevantModels = models.data
        .filter((m: any) => 
          m.id.includes('claude') || 
          m.id.includes('gpt-4') || 
          m.id.includes('gemini')
        )
        .slice(0, 5);
      
      console.log('✅ Some available models:');
      relevantModels.forEach((model: any) => {
        console.log(`   - ${model.id}: $${model.pricing.prompt} per 1K tokens`);
      });
    }

    console.log('\n✅ All tests passed! OpenRouter is configured correctly.');
    console.log('💡 You can now use AI features in your application.');

  } catch (error: any) {
    console.error('\n❌ Error testing OpenRouter:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testOpenRouter();