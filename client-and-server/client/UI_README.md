# ZK Yield Vault - Modern UI

This is a modern, Morpho-inspired UI for the ZK Yield Vault application with privacy-preserving yield distribution on Mantle.

## Features

### 🎨 Modern Design
- Clean, professional interface inspired by Morpho Vault
- Responsive layout that works on desktop and mobile
- Modern color scheme with gradient accents
- Smooth transitions and animations

### 📱 Separate Pages by Function
The application is organized into dedicated pages for each feature:

1. **Dashboard** (`/`) - Overview of vault statistics, user flow diagram, and epoch list
2. **Deposit** (`/deposit`) - Deposit MNT to the yield vault
3. **Withdraw** (`/withdraw`) - Withdraw funds from the vault (coming soon)
4. **Claim** (`/claim`) - Claim yield using zero-knowledge proofs
5. **ZK-KYC** (`/zk-kyc`) - Rarimo ZK Passport verification

### 🔝 Top Navigation Bar
The navigation bar displays:
- **Logo and Title**: ZK Yield Vault branding
- **Navigation Links**: Quick access to all pages
- **Network Badge**: Shows current connected network (Mantle/Mantle Sepolia/Rarimo)
- **Wallet Address**: Displays shortened wallet address with connection status
- **Connect Button**: Gradient button for wallet connection

### 🎯 Key UI Components

#### Navigation Bar
- Sticky top positioning
- Active page highlighting
- Responsive mobile menu
- Network indicator with color-coded status dot
- Animated wallet connection status

#### Dashboard
- Comprehensive vault statistics
- Visual user flow diagram with step-by-step process
- Recent epochs list
- Informational cards about the project

#### Deposit Page
- Vault statistics overview
- Deposit form with clear instructions
- Helpful tips and information
- Quick links to related pages

#### Claim Page
- Epoch selection and listing
- ZK proof generation interface
- Merkle tree helper
- Privacy-focused explanations
- Step-by-step claiming process

#### ZK-KYC Page
- Verification status display
- On-chain verification interface
- Detailed instructions for passport scanning
- Documentation links

## Technology Stack

- **Next.js 15**: React framework with App Router
- **Tailwind CSS**: Utility-first CSS framework
- **Wagmi**: React hooks for Ethereum
- **Reown AppKit**: Wallet connection
- **TypeScript**: Type-safe development

## Design Principles

1. **User-Centric**: Clear, intuitive navigation and information hierarchy
2. **Modern**: Clean aesthetics with contemporary UI patterns
3. **Responsive**: Works seamlessly across devices
4. **Informative**: Helpful tooltips, explanations, and visual guides
5. **Privacy-First**: Emphasizes zero-knowledge features and privacy preservation

## Color Scheme

- **Primary**: Blue gradient (#3b82f6 to #6366f1)
- **Secondary**: Purple accent (#8b5cf6)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Background**: Light gray (#f9fafb)
- **Text**: Dark gray (#111827)

## Navigation Flow

```
Dashboard (/)
├── Deposit (/deposit)
├── Withdraw (/withdraw)
├── Claim (/claim)
└── ZK-KYC (/zk-kyc)
```

## Key Improvements

1. **Separated Concerns**: Each feature has its dedicated page
2. **Modern Top Bar**: Professional navigation with wallet/network display
3. **Better Information Architecture**: Logical grouping of related functions
4. **Enhanced UX**: Clear CTAs, helpful tooltips, and visual feedback
5. **Consistent Design**: Unified styling across all pages
6. **Mobile-Friendly**: Responsive design for all screen sizes

## Getting Started

1. Connect your wallet using the button in the top right
2. Ensure you're on a supported network (Mantle/Mantle Sepolia)
3. Navigate to the desired page using the top menu
4. Follow the on-page instructions for each feature

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Future Enhancements

- Dark mode support
- Transaction history
- Enhanced analytics dashboard
- Advanced filtering and sorting
- User preferences/settings page
