# Aptos Document Management System

## Overview
This project is a decentralized document management system built on the Aptos blockchain. It allows users to securely upload, sign, and manage documents using blockchain technology and IPFS (InterPlanetary File System) for storage.

## Features
- Document Upload: Users can upload documents to IPFS and register them on the Aptos blockchain.
- Document Signing: Authorized users can digitally sign documents.
- Document Management: Users can view, sign, and delete their documents.
- Blockchain Integration: Utilizes Aptos blockchain for secure and transparent document tracking.
- IPFS Storage: Documents are stored on IPFS for decentralized and persistent storage.

## Technology Stack
- Frontend: React.js with Next.js framework
- Styling: Tailwind CSS
- Blockchain: Aptos
- File Storage: IPFS (via Pinata)
- Wallet Integration: Aptos Wallet Adapter

## Smart Contract
The smart contract is deployed on the Aptos testnet and handles the following operations:
- Creating new documents
- Signing documents
- Deleting documents
- Retrieving document information

## Key Components
1. Document Upload Page (`/app/create/page.tsx`)
   - Allows users to select and upload documents
   - Integrates with Pinata for IPFS upload
   - Creates document entries on the blockchain

2. Documents List Page (`/app/documents/page.tsx`)
   - Displays all documents associated with the user
   - Provides options to sign or delete documents

3. Utility Functions (`/app/lib/utils.tsx`)
   - Includes helper functions for interacting with smart contracts

4. Toast Notifications (`/app/lib/use-toast.ts`)
   - Manages toast notifications for user feedback

## Setup and Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   - `NEXT_PUBLIC_MODULE_ADDRESS`: Aptos module address
   - `NEXT_PUBLIC_MODULE_NAME`: Aptos module name
   - `NEXT_PUBLIC_PINATA_JWT_KEY`: Pinata JWT for IPFS integration
   - `NEXT_PUBLIC_PINATA_GATEWAY`: Pinata gateway URL
4. Run the development server: `npm run dev`

## Usage
1. Connect your Aptos wallet
2. Navigate to the document upload page to create new documents
3. Use the documents page to view, sign, or delete your documents

## Security Considerations
- Document access is controlled by the smart contract
- Only authorized users can sign documents
- Document deletion is restricted to the document owner

## Future Enhancements
- Multi-signature support
- Document version control
- Integration with more blockchain networks

## Contributing
Contributions to improve the project are welcome. Please follow the standard fork-and-pull request workflow.

## License
[Specify your license here]
