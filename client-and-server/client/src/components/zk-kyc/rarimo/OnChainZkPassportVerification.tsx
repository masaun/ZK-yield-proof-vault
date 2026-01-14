/**
 * On-Chain ZK Passport Verification Component
 * 
 * This component implements the on-chain verification flow for ZK Passport
 * following the pattern from https://docs.rarimo.com/zk-passport/guide-on-chain-verification/
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { type Chain } from 'viem'
import ZkPassportQrCode, { ProofRequestStatuses } from '@rarimo/zk-passport-react'
import type { ZkProof } from '@rarimo/zk-passport'
import { getRarimoConfig } from '@/config/rarimo'
import { mantle, mantleSepolia, rarimo } from '@/config'
import { useOnChainVerification } from '@/hooks/zk-kyc/rarimo/useOnChainVerification'
import { Spinner } from '../../commons/Spinner'
import { CopyButton } from '../../commons/CopyButton'
import { DocsLink } from '../../commons/DocsLink'

type ErrorType = 'estimate' | 'verification'

export function OnChainZkPassportVerification() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentChain, setCurrentChain] = useState<Chain | null>(null)
  const [status, setStatus] = useState<ProofRequestStatuses>(ProofRequestStatuses.RequestInitiated)
  const [proof, setProof] = useState<ZkProof | null>(null)
  const [errorType, setErrorType] = useState<ErrorType | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Determine current network
  useEffect(() => {
    if (chainId === 5000) {
      setCurrentChain(mantle)
    } else if (chainId === 5003) {
      setCurrentChain(mantleSepolia)
    } else if (chainId === 7368) {
      setCurrentChain(rarimo)
    } else {
      setCurrentChain(null)
    }
  }, [chainId])

  // Determine which network configuration to use
  const network = chainId === 5000 ? 'mainnet' : chainId === 7368 ? 'rarimo' : 'testnet'

  // Get Rarimo configuration
  const rarimoConfig = getRarimoConfig(network)

  // Use the on-chain verification hook
  const {
    isVerified,
    isEstimating,
    isVerifying,
    isVerifySuccess,
    txHash,
    estimateVerification,
    executeVerification,
    refetchVerification,
  } = useOnChainVerification({
    contractAddress: rarimoConfig?.zkKycAddress || '0x0',
    enabled: !!rarimoConfig && isConnected,
  })

  // Handle proof success - attempt to verify on-chain
  useEffect(() => {
    if (!proof || !address) return

    const attemptVerification = async () => {
      try {
        setErrorType(null)
        setErrorMessage('')

        // First estimate the transaction
        const canVerify = await estimateVerification()
        if (!canVerify) {
          setErrorType('estimate')
          setErrorMessage('Failed to estimate verification transaction. Please check your wallet and try again.')
          return
        }

        // Execute the verification
        await executeVerification(proof)
        
        // Refresh verification status after successful transaction
        if (isVerifySuccess) {
          await refetchVerification()
        }
      } catch (error) {
        console.error('Verification error:', error)
        setErrorType('verification')
        setErrorMessage(error instanceof Error ? error.message : 'Verification failed')
      }
    }

    attemptVerification()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proof, address])

  // Handle status changes from QR code component
  const handleStatusChange = (newStatus: ProofRequestStatuses) => {
    console.log('ZK Passport status:', newStatus)
    setStatus(newStatus)
  }

  // Handle successful proof generation
  const handleProofSuccess = (generatedProof: ZkProof) => {
    console.log('ZK Passport proof generated:', generatedProof)
    setProof(generatedProof)
  }

  // Handle errors from QR code component
  const handleProofError = (error: Error) => {
    console.error('ZK Passport error:', error)
    setErrorType('verification')
    setErrorMessage(error.message || 'Failed to generate proof')
  }

  // Show success message if already verified
  if (isVerified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Verified with ZK Passport
          </h3>
          <p className="text-sm text-green-700 mb-2">
            Your address is verified on-chain:
          </p>
          <p className="font-mono text-sm text-green-600 break-all">
            {address}
          </p>
          {txHash && (
            <div className="mt-4">
              <p className="text-xs text-green-600">Transaction hash:</p>
              <p className="font-mono text-xs text-green-600 break-all">
                {txHash}
              </p>
              <CopyButton label="TX Hash" content={txHash} />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render button to open modal
  return (
    <>
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            🛡️ ZK Passport On-Chain Verification
          </h2>
          <p className="text-sm text-gray-600">
            Verify your identity on-chain using ZK Passport without revealing personal data
          </p>
        </div>

        {/* Show warnings if not ready */}
        {!rarimoConfig && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm font-semibold mb-2">
              ⚠️ Rarimo contracts not deployed
            </p>
            <p className="text-red-700 text-xs mb-2">
              The ZK KYC contracts need to be deployed to {chainId === 5000 ? 'Mantle Mainnet' : chainId === 5003 ? 'Mantle Sepolia' : 'Rarimo'} before verification can work.
            </p>
            <p className="text-red-700 text-xs">
              Please deploy the contracts and configure the following environment variables:
            </p>
            <ul className="text-red-700 text-xs mt-2 ml-4 list-disc">
              <li>NEXT_PUBLIC_{network.toUpperCase()}_ZK_KYC_RARIMO_ADDRESS</li>
              <li>NEXT_PUBLIC_{network.toUpperCase()}_REGISTRATION_SMT_REPLICATOR_ADDRESS</li>
            </ul>
          </div>
        )}

        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ Please connect your wallet to verify with ZK Passport
            </p>
          </div>
        )}

        {isConnected && !currentChain && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ Please switch to Mantle Mainnet, Mantle Sepolia Testnet, or Rarimo Mainnet
            </p>
          </div>
        )}

        {/* Main button */}
        <button
          onClick={() => {
            console.log('Button clicked, opening modal...')
            console.log('Config:', !!rarimoConfig, 'Connected:', isConnected, 'Chain:', !!currentChain)
            setIsModalOpen(true)
          }}
          disabled={!rarimoConfig || !isConnected || !currentChain || isVerifying}
          className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold 
                     hover:bg-indigo-700 transition-colors disabled:bg-gray-400 
                     disabled:cursor-not-allowed"
        >
          {isVerifying ? 'Verifying...' : 'Register your identity via Rarimo ZK Passport'}
        </button>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-gray-500">
            Debug: Config={String(!!rarimoConfig)} | Connected={String(isConnected)} | Chain={String(!!currentChain)} | Modal={String(isModalOpen)}
          </div>
        )}

        {/* Status messages */}
        {isEstimating && (
          <p className="text-sm text-gray-500 mt-4 text-center">Checking requirements…</p>
        )}

        {errorType && (
          <div className="border border-red-300 bg-red-50 text-red-700 p-3 rounded text-sm mt-4">
            <p className="font-semibold mb-1">
              {errorType === 'estimate' ? '❌ Estimation Failed' : '❌ Verification Failed'}
            </p>
            <p className="text-xs">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal content
            if (e.target === e.currentTarget) {
              setIsModalOpen(false)
            }
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    ZK Passport Verification
                  </h2>
                  <p className="text-sm text-gray-600">
                    Scan the QR code with RariMe app to verify your identity
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Show error messages if missing requirements */}
              {(!rarimoConfig || !address || !currentChain) && (
                <div className="mb-6">
                  {!rarimoConfig && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-800 text-sm font-semibold mb-2">
                        ⚠️ Contracts Not Deployed
                      </p>
                      <p className="text-red-700 text-xs mb-2">
                        The ZK KYC contracts must be deployed before you can verify your identity.
                      </p>
                      <p className="text-red-700 text-xs">
                        Deploy the contracts from the <code className="bg-red-100 px-1 rounded">contracts/</code> directory and configure the environment variables.
                      </p>
                    </div>
                  )}
                  {!address && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ Please connect your wallet to verify with ZK Passport
                      </p>
                    </div>
                  )}
                  {address && !currentChain && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ Please switch to Mantle Mainnet, Mantle Sepolia Testnet, or Rarimo Mainnet
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Only show QR code if all requirements are met */}
              {rarimoConfig && address && currentChain ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left column: Information */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold mb-1">Wallet Address:</p>
                      <p className="text-xs font-mono text-gray-600 break-all">
                        {address}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-1">Network:</p>
                      <p className="text-xs text-gray-600">{currentChain.name}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-1">Status:</p>
                      <p className="text-xs text-gray-700">{status}</p>
                    </div>

                    {isEstimating && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-700">Checking requirements…</p>
                      </div>
                    )}

                    {isVerifying && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-700 animate-pulse">Verifying on-chain…</p>
                      </div>
                    )}

                    {proof && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Proof Generated:</p>
                        <pre className="text-xs bg-gray-100 p-2 rounded border border-gray-300 overflow-auto max-h-32">
                          {JSON.stringify(proof, null, 2)}
                        </pre>
                        <CopyButton label="Proof" content={JSON.stringify(proof, null, 2)} />
                      </div>
                    )}

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-sm mb-2">How it works:</h3>
                      <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                        <li>Download RariMe app on your phone</li>
                        <li>Scan the QR code with the app</li>
                        <li>Follow app instructions to scan passport</li>
                        <li>App generates ZK proof (stays private)</li>
                        <li>Proof is verified on-chain</li>
                        <li>Your address gets verified!</li>
                      </ol>
                    </div>

                    <DocsLink />
                  </div>

                  {/* Right column: QR Code */}
                  <div className="flex flex-col items-center justify-center">
                    {isEstimating || isVerifying ? (
                      <div className="flex items-center justify-center w-64 h-64">
                        <Spinner />
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <p className="text-xs text-center text-gray-600 mb-4">
                          Scan with RariMe app
                        </p>
                        <ZkPassportQrCode
                          apiUrl={rarimoConfig.verificatorUrl}
                          requestId={`onchain-${address}-${Date.now()}`}
                          verificationOptions={{
                            contractAddress: rarimoConfig.zkKycAddress,
                            receiverAddress: address,
                            chain: currentChain,
                          }}
                          qrProps={{ size: 256 }}
                          onStatusChange={handleStatusChange}
                          onSuccess={handleProofSuccess}
                          onError={handleProofError}
                        />
                      </div>
                    )}
                  </div>
                </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Please resolve the issues above to continue with verification.
                </p>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
