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
import { SimpleCard } from '@/components/ui/SimpleCard';

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
    <SimpleCard title="ZK-Kit Merkle Tree Helper" collapsible={true} initialCollapsed={false}>
      <p className="text-xs text-gray-600 mb-4">Use this tool to generate Merkle proofs for testing</p>

      {/* 1. Add User Balances */}
      <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-900">1. Add User Balances</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Address (0x...)"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-md border border-gray-300 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5792FF] focus:border-transparent transition-all duration-200"
          />
          <input
            type="number"
            placeholder="Balance (wei)"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
            className="w-32 px-2 py-1.5 rounded-md border border-gray-300 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5792FF] focus:border-transparent transition-all duration-200"
          />
          <button 
            onClick={addBalance}
            className="px-3 py-1.5 bg-[#5792FF] text-white text-xs font-medium rounded-md hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Add
          </button>
        </div>

        {balances.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700">Current Balances:</h4>
            <div className="space-y-1.5">
              {balances.map((b, i) => (
                <div key={i} className="bg-gray-50 rounded-md p-2 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-900">{b.address}</span>
                    <span className="text-xs font-semibold text-gray-700">{b.balance.toString()} wei</span>
                  </div>
                  <div className="text-2xs text-gray-500 font-mono break-all">
                    Hash: {hashUserBalance(b.address, b.balance).toString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Generate Merkle Tree */}
      <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-900">2. Generate Merkle Tree</h3>
        <button 
          onClick={generateTree} 
          disabled={balances.length === 0}
          className="w-full px-3 py-1.5 bg-[#5792FF] text-white text-xs font-medium rounded-md hover:bg-blue-700 active:scale-95 disabled:bg-gray-300 disabled:active:scale-100 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Generate Tree & Root
        </button>
        {root && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-xs font-semibold text-green-900 mb-1">Merkle Root:</p>
            <code className="text-2xs text-green-800 font-mono break-all">{root.toString()}</code>
          </div>
        )}
      </div>

      {/* 3. Generate Merkle Proof */}
      <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-900">3. Generate Merkle Proof</h3>
        <select 
          value={selectedAddress} 
          onChange={(e) => setSelectedAddress(e.target.value)}
          disabled={balances.length === 0}
          className="w-full px-2 py-1.5 rounded-md border border-gray-300 bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5792FF] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <option value="">Select an address...</option>
          {balances.map((b, i) => (
            <option key={i} value={b.address}>
              {b.address}
            </option>
          ))}
        </select>
        <button 
          onClick={generateProofForUser} 
          disabled={!selectedAddress}
          className="w-full px-3 py-1.5 bg-[#5792FF] text-white text-xs font-medium rounded-md hover:bg-blue-700 active:scale-95 disabled:bg-gray-300 disabled:active:scale-100 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Generate Proof
        </button>

        {proof && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <h4 className="text-xs font-semibold text-blue-900 mb-2">Merkle Proof Generated:</h4>
              <div className="space-y-1.5">
                <div>
                  <p className="text-2xs font-medium text-blue-800">Index:</p>
                  <code className="text-2xs text-blue-700 font-mono">{proof.index}</code>
                </div>
                <div>
                  <p className="text-2xs font-medium text-blue-800">Leaf:</p>
                  <code className="text-2xs text-blue-700 font-mono break-all">{proof.leaf.toString()}</code>
                </div>
                <div>
                  <p className="text-2xs font-medium text-blue-800">Root:</p>
                  <code className="text-2xs text-blue-700 font-mono break-all">{proof.root.toString()}</code>
                </div>
                <div>
                  <p className="text-2xs font-medium text-blue-800">Siblings (for circuit):</p>
                  <code className="text-2xs text-blue-700 font-mono break-all">{proof.siblings.map(s => s.toString()).join(', ')}</code>
                </div>
                <div className="flex items-center gap-2 pt-1.5 border-t border-blue-200">
                  <p className="text-2xs font-medium text-blue-800">Verification:</p>
                  <span className={`px-1.5 py-0.5 text-2xs font-semibold rounded ${
                    verifyMerkleProof(proof) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {verifyMerkleProof(proof) ? '✓ Valid' : '✗ Invalid'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-md p-3">
              <h4 className="text-xs font-semibold text-gray-900 mb-2">Circuit Format:</h4>
              <pre className="text-2xs text-gray-700 font-mono overflow-x-auto">{JSON.stringify(formatProofForCircuit(proof), null, 2)}</pre>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-md p-3 space-y-2">
              <h4 className="text-xs font-semibold text-purple-900">Copy for Claim Form:</h4>
              <div>
                <label className="text-2xs font-medium text-purple-800 block mb-0.5">Merkle Siblings:</label>
                <input 
                  type="text" 
                  readOnly 
                  value={proof.siblings.map(s => s.toString()).join(', ')}
                  onClick={(e) => e.currentTarget.select()}
                  className="w-full px-2 py-1 rounded border border-purple-300 bg-white text-2xs text-purple-900 font-mono cursor-pointer hover:bg-purple-50 transition"
                />
              </div>
              <div>
                <label className="text-2xs font-medium text-purple-800 block mb-0.5">Merkle Index:</label>
                <input 
                  type="text" 
                  readOnly 
                  value={proof.index.toString()}
                  onClick={(e) => e.currentTarget.select()}
                  className="w-full px-2 py-1 rounded border border-purple-300 bg-white text-2xs text-purple-900 font-mono cursor-pointer hover:bg-purple-50 transition"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-gray-50 rounded-md p-3">
        <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
          <span>ℹ️</span> About ZK-Kit
        </h4>
        <p className="text-xs text-gray-700 mb-2">
          This tool uses ZK-Kit&apos;s <strong>LeanIMT</strong> (Lean Incremental Merkle Tree) 
          with <strong>Poseidon</strong> hash function for ZK-friendly Merkle tree operations.
        </p>
        <ul className="space-y-0.5 text-xs text-gray-600 list-disc list-inside">
          <li>LeanIMT is optimized for browser/lightweight environments</li>
          <li>Poseidon hash is SNARK-friendly (efficient in zero-knowledge circuits)</li>
          <li>Proofs are compatible with Noir circuits</li>
        </ul>
      </div>
    </SimpleCard>
  );
}
