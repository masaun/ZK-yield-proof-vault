import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';
import type { CompiledCircuit } from '@noir-lang/types';
import { poseidon3, poseidon4 } from 'poseidon-lite';
import circuitData from '../../../circuits/zk-yield-proof-vault-0.0.2/zk-yield-proof-vault.json';

const circuit = circuitData as unknown as CompiledCircuit;

export interface ProofInputs {
  // User data
  user_address: string;
  latest_user_balance: string;
  latest_user_yield: string;
  
  // Merkle tree data
  expected_latest_user_balance_root: string;
  last_user_balance_root: string;
  
  // Epoch data
  epoch_start: string;
  epoch_end: string;
  latest_block_number: string;
  
  // Yield data
  yield_rate: string;
  latest_total_yield: string;
  
  // KYC
  kyc_eligibility_flags: boolean;
  
  // Privacy - nullifier
  expected_nullifier: string;
}

export interface ProofOutput {
  proof: Uint8Array;
  publicInputs: string[];
}

/**
 * Generate a nullifier to prevent double-claiming
 * Matches the circuit's nullifier calculation:
 * poseidon2::Poseidon2::hash([user_address, latest_block_number, latest_user_balance_leaf, latest_user_balance_root])
 */
export function generateNullifier(
  userAddress: string,
  latestBlockNumber: bigint,
  latestUserBalanceLeaf: bigint,
  latestUserBalanceRoot: bigint
): bigint {
  // Calculate nullifier using Poseidon hash with 4 inputs
  return poseidon4([
    BigInt(userAddress),
    latestBlockNumber,
    latestUserBalanceLeaf,
    latestUserBalanceRoot
  ]);
}

/**
 * Generate user balance leaf hash
 * Matches the circuit's leaf calculation:
 * poseidon2::Poseidon2::hash([user_address, latest_user_balance, latest_block_number])
 */
export function generateUserBalanceLeaf(
  userAddress: string,
  latestUserBalance: bigint,
  latestBlockNumber: bigint
): bigint {
  // Using poseidon3 since we have 3 inputs
  return poseidon3([
    BigInt(userAddress),
    latestUserBalance,
    latestBlockNumber
  ]);
}

/**
 * Calculate Merkle root for a single-leaf tree
 * This replicates what the circuit's update_merkle_tree does:
 * Creates a new MerkleTree and adds one entry at index 0 with empty paths
 * 
 * For a single leaf at index 0 with no siblings (empty paths),
 * the root IS the leaf itself in a minimal Merkle tree
 */
export function calculateSingleLeafMerkleRoot(leaf: bigint): bigint {
  // When adding a single leaf to an empty tree at index 0 with no paths,
  // the MerkleTree library returns the leaf as the root
  return leaf;
}

/**
 * Generate a ZK proof for yield claiming
 */
export async function generateYieldProof(inputs: ProofInputs): Promise<ProofOutput> {
  try {
    // Initialize the Noir circuit
    const noir = new Noir(circuit);
    
    // Initialize the backend with the circuit
    const backend = new UltraHonkBackend(circuit.bytecode);
    
    // Format inputs for the circuit - must match the circuit's main function signature
    const formattedInputs = {
      user_address: inputs.user_address,
      latest_user_balance: inputs.latest_user_balance,
      expected_latest_user_balance_root: inputs.expected_latest_user_balance_root,
      last_user_balance_root: inputs.last_user_balance_root,
      latest_block_number: inputs.latest_block_number,
      kyc_eligibility_flags: inputs.kyc_eligibility_flags,
      latest_user_yield: inputs.latest_user_yield,
      yield_rate: inputs.yield_rate,
      epoch_start: inputs.epoch_start,
      epoch_end: inputs.epoch_end,
      latest_total_yield: inputs.latest_total_yield,
      expected_nullifier: inputs.expected_nullifier,
    };

    console.log('Circuit inputs:', formattedInputs);

    // Generate the witness
    console.log('Generating witness...');
    const { witness } = await noir.execute(formattedInputs);
    
    // Generate the proof
    console.log('Generating proof...');
    const proof = await backend.generateProof(witness);
    
    console.log('Proof generated successfully!');
    
    return {
      proof: proof.proof,
      publicInputs: proof.publicInputs.map((input: unknown) => String(input)),
    };
  } catch (error) {
    console.error('Error generating proof:', error);
    throw new Error(`Failed to generate proof: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Verify a ZK proof (client-side verification)
 */
export async function verifyYieldProof(proof: Uint8Array, publicInputs: string[]): Promise<boolean> {
  try {
    const backend = new UltraHonkBackend(circuit.bytecode);
    
    // Verify the proof
    const isValid = await backend.verifyProof({
      proof,
      publicInputs,
    });
    
    return isValid;
  } catch (error) {
    console.error('Error verifying proof:', error);
    return false;
  }
}

/**
 * Format proof for contract submission
 */
export function formatProofForContract(proofOutput: ProofOutput): {
  proof: `0x${string}`;
  publicInputs: `0x${string}`[];
} {
  // Convert proof to hex string
  const proofHex = `0x${Array.from(proofOutput.proof)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`;
  
  // Convert public inputs to hex strings (as bytes32)
  const publicInputsHex = proofOutput.publicInputs.map(input => {
    const bigIntValue = BigInt(input);
    const hex = bigIntValue.toString(16).padStart(64, '0');
    return `0x${hex}` as `0x${string}`;
  });
  
  return {
    proof: proofHex,
    publicInputs: publicInputsHex,
  };
}
