import { config } from 'dotenv'

// Load test environment variables
config({ path: '.env.test' })

// Ensure we're in test mode
process.env.NODE_ENV = 'test'

console.log('🧪 Test environment initialized')
