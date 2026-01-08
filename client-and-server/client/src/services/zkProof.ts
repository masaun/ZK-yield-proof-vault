import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';
import type { CompiledCircuit } from '@noir-lang/types';
import { poseidon1 } from 'poseidon-lite';
import circuitData from '../../circuits/zk-yield-proof-vault-0.0.1/zk-yield-proof-vault.json';

const circuit = circuitData as unknown as CompiledCircuit;

export interface ProofInputs {
  // User data
  user_balance: string;
  user_balance_merkle_path: string[];
  user_balance_merkle_index: string;
  
  // Epoch data
  epoch_start: string;
  epoch_end: string;
  
  // Global state
  latest_block_number: string;
  yield_rate: string;
  expected_latest_user_balance_root: string;
  latest_total_yield: string;
  
  // Privacy
  nullifier_secret: string;
}

export interface ProofOutput {
  proof: Uint8Array;
  publicInputs: string[];
}

/**
 * Generate a nullifier from a secret using Poseidon hash
 * This ensures the nullifier is ZK-friendly and deterministic
 */
export function generateNullifier(secret: string): bigint {
  // Convert secret string to bigint
  const secretBigInt = BigInt('0x' + Buffer.from(secret).toString('hex'));
  // Hash with Poseidon to get nullifier
  return poseidon1([secretBigInt]);
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
    
    // Format inputs for the circuit
    const formattedInputs = {
      user_balance: inputs.user_balance,
      user_balance_merkle_path: inputs.user_balance_merkle_path,
      user_balance_merkle_index: inputs.user_balance_merkle_index,
      epoch_start: inputs.epoch_start,
      epoch_end: inputs.epoch_end,
      latest_block_number: inputs.latest_block_number,
      yield_rate: inputs.yield_rate,
      expected_latest_user_balance_root: inputs.expected_latest_user_balance_root,
      latest_total_yield: inputs.latest_total_yield,
      nullifier_secret: inputs.nullifier_secret,
    };

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
