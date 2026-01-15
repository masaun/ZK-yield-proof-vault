// Test with actual user values from the error log
const { buildPoseidon } = require('circomlibjs');

async function testActualValues() {
  const poseidon = await buildPoseidon();
  
  // Actual values from the error log
  const userAddress = BigInt('0xfdbffc0cd419344649dec61f08912a4af283e1a6'); // @dev - Here is an example address - So, please replace with actual EVM address used in the frontend
  const scaledBalance = BigInt('100000000'); // in Gwei
  const latestBlockNumber = BigInt('33467205');
  
  // Calculate leaf
  const leaf = poseidon.F.toObject(poseidon([userAddress, scaledBalance, latestBlockNumber]));
  console.log('Calculated leaf:', leaf.toString());
  console.log('Calculated leaf hex:', '0x' + leaf.toString(16));
  
  // Expected from logs
  console.log('Expected leaf:', '4908957865095162607671371698865646900017838161946492755345315887226236351189'); // @dev - This expected value should be replaced based on the actual EVM address of "user_address" above
  console.log('Expected leaf hex:', '0xada5f2711176d084216de8492df94ba49d6188062c89556f6b8f74f588ab2d5');
  
  console.log('Match:', leaf.toString() === '4908957865095162607671371698865646900017838161946492755345315887226236351189'); // @dev - This expected value should be replaced based on the actual EVM address of "user_address" above
  
  // For single leaf tree, root = leaf
  const expectedRoot = leaf;
  console.log('\nExpected root:', expectedRoot.toString());
  console.log('Expected root hex:', '0x' + expectedRoot.toString(16));
  
  // Calculate nullifier
  const nullifier = poseidon.F.toObject(poseidon([userAddress, latestBlockNumber, leaf, expectedRoot]));
  console.log('\nCalculated nullifier:', nullifier.toString());
  console.log('Calculated nullifier hex:', '0x' + nullifier.toString(16));
  
  // Yield calculation check
  const epochDuration = BigInt('624');
  const yieldRate = BigInt('1');
  const expectedYield = scaledBalance * yieldRate * epochDuration;
  console.log('\nYield calculation:');
  console.log('  scaledBalance:', scaledBalance.toString());
  console.log('  yieldRate:', yieldRate.toString());
  console.log('  duration:', epochDuration.toString());
  console.log('  Expected yield:', expectedYield.toString());
  console.log('  From logs:', '62400000000');
  console.log('  Match:', expectedYield.toString() === '62400000000');
}

testActualValues().catch(console.error);
