'use client';

import { useState } from 'react';
import { 
  buildMerkleTree, 
  generateMerkleProof, 
  verifyMerkleProof,
  formatProofForCircuit,
  hashUserBalance,
  type UserBalance,
  type MerkleProof
} from '@/zk-circuits/merkleTree';

export function MerkleTreeHelper() {
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [proof, setProof] = useState<MerkleProof | null>(null);
  const [root, setRoot] = useState<bigint | null>(null);

  const addBalance = () => {
    if (!newAddress || !newBalance) {
      alert('Please enter both address and balance');
      return;
    }

    const newEntry: UserBalance = {
      address: newAddress,
      balance: BigInt(newBalance),
    };

    setBalances([...balances, newEntry]);
    setNewAddress('');
    setNewBalance('');
  };

  const generateTree = () => {
    if (balances.length === 0) {
      alert('Please add at least one balance');
      return;
    }

    const { root: treeRoot } = buildMerkleTree(balances);
    setRoot(treeRoot);
    alert(`Merkle root generated: ${treeRoot.toString()}`);
  };

  const generateProofForUser = () => {
    if (!selectedAddress) {
      alert('Please select an address');
      return;
    }

    const generatedProof = generateMerkleProof(balances, selectedAddress);
    
    if (!generatedProof) {
      alert('Address not found in tree');
      return;
    }

    setProof(generatedProof);

    // Verify the proof
    const isValid = verifyMerkleProof(generatedProof);
    console.log('Proof verification:', isValid);
  };

  return (
    <div className="merkle-tree-helper">
      <h2>ZK-Kit Merkle Tree Helper</h2>
      <p className="subtitle">Use this tool to generate Merkle proofs for testing</p>

      <div className="helper-section">
        <h3>1. Add User Balances</h3>
        <div className="form-row">
          <input
            type="text"
            placeholder="Address (0x...)"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
          />
          <input
            type="number"
            placeholder="Balance (wei)"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
          />
          <button onClick={addBalance}>Add</button>
        </div>

        {balances.length > 0 && (
          <div className="balances-list">
            <h4>Current Balances:</h4>
            {balances.map((b, i) => (
              <div key={i} className="balance-item">
                <span className="address">{b.address}</span>
                <span className="balance">{b.balance.toString()} wei</span>
                <span className="hash">Hash: {hashUserBalance(b.address, b.balance).toString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="helper-section">
        <h3>2. Generate Merkle Tree</h3>
        <button onClick={generateTree} disabled={balances.length === 0}>
          Generate Tree & Root
        </button>
        {root && (
          <div className="root-display">
            <strong>Merkle Root:</strong>
            <code>{root.toString()}</code>
          </div>
        )}
      </div>

      <div className="helper-section">
        <h3>3. Generate Merkle Proof</h3>
        <select 
          value={selectedAddress} 
          onChange={(e) => setSelectedAddress(e.target.value)}
          disabled={balances.length === 0}
        >
          <option value="">Select an address...</option>
          {balances.map((b, i) => (
            <option key={i} value={b.address}>
              {b.address}
            </option>
          ))}
        </select>
        <button onClick={generateProofForUser} disabled={!selectedAddress}>
          Generate Proof
        </button>

        {proof && (
          <div className="proof-display">
            <h4>Merkle Proof Generated:</h4>
            <div className="proof-data">
              <div className="proof-item">
                <strong>Index:</strong>
                <code>{proof.index}</code>
              </div>
              <div className="proof-item">
                <strong>Leaf:</strong>
                <code>{proof.leaf.toString()}</code>
              </div>
              <div className="proof-item">
                <strong>Root:</strong>
                <code>{proof.root.toString()}</code>
              </div>
              <div className="proof-item">
                <strong>Siblings (for circuit):</strong>
                <code>{proof.siblings.map(s => s.toString()).join(', ')}</code>
              </div>
              <div className="proof-item">
                <strong>Verification:</strong>
                <span className={verifyMerkleProof(proof) ? 'valid' : 'invalid'}>
                  {verifyMerkleProof(proof) ? '✓ Valid' : '✗ Invalid'}
                </span>
              </div>
            </div>

            <div className="circuit-format">
              <h4>Circuit Format:</h4>
              <pre>{JSON.stringify(formatProofForCircuit(proof), null, 2)}</pre>
            </div>

            <div className="copy-section">
              <h4>Copy for Claim Form:</h4>
              <div className="copy-item">
                <strong>Merkle Siblings:</strong>
                <input 
                  type="text" 
                  readOnly 
                  value={proof.siblings.map(s => s.toString()).join(', ')}
                  onClick={(e) => e.currentTarget.select()}
                />
              </div>
              <div className="copy-item">
                <strong>Merkle Index:</strong>
                <input 
                  type="text" 
                  readOnly 
                  value={proof.index.toString()}
                  onClick={(e) => e.currentTarget.select()}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="helper-info">
        <h4>ℹ️ About ZK-Kit</h4>
        <p>
          This tool uses ZK-Kit&apos;s <strong>LeanIMT</strong> (Lean Incremental Merkle Tree) 
          with <strong>Poseidon</strong> hash function for ZK-friendly Merkle tree operations.
        </p>
        <ul>
          <li>LeanIMT is optimized for browser/lightweight environments</li>
          <li>Poseidon hash is SNARK-friendly (efficient in zero-knowledge circuits)</li>
          <li>Proofs are compatible with Noir circuits</li>
        </ul>
      </div>
    </div>
  );
}
