'use client';

import { useState } from 'react';
import { 
  generateYieldProof, 
  formatProofForContract,
  type ProofInputs,
  type ProofOutput 
} from '@/services/zkProof';

export function useZKProof() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofOutput, setProofOutput] = useState<ProofOutput | null>(null);

  const generateProof = async (inputs: ProofInputs) => {
    setIsGenerating(true);
    setError(null);
    setProofOutput(null);

    try {
      const proof = await generateYieldProof(inputs);
      setProofOutput(proof);
      return proof;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate proof';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const getFormattedProof = () => {
    if (!proofOutput) return null;
    return formatProofForContract(proofOutput);
  };

  const reset = () => {
    setIsGenerating(false);
    setError(null);
    setProofOutput(null);
  };

  return {
    generateProof,
    isGenerating,
    error,
    proofOutput,
    getFormattedProof,
    reset,
  };
}
