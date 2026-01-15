// Test to find the right Poseidon implementation
// The issue is that circomlibjs uses Poseidon (original) 
// but Noir uses poseidon2::Poseidon2

// Let's try using the noir-lang/barretenberg.js Poseidon2
const { BarretenbergSync } = require('@aztec/bb.js');

async function testBarretenbergPoseidon() {
  try {
    const api = await BarretenbergSync.initSingleton();
    
    const userAddress = BigInt('0xd3bffc0cd419344649dec61f08912a4af283e1a6');
    const balance = BigInt('100000000');
    const blockNumber = BigInt('33467205');
    
    // Try to call Poseidon2
    console.log('Testing Barretenberg Poseidon...');
    console.log('API methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(api)).filter(m => m.includes('poseidon') || m.includes('hash')));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBarretenbergPoseidon();
