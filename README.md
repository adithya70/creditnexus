# CreditNexus - DeFi Credit System

CreditNexus is a decentralized credit system built on the XRPL blockchain, providing transparent and secure lending services to users worldwide.

## Features

- Decentralized credit scoring system
- Smart contract-based loan agreements
- Transparent and secure transactions
- Global access to credit services
- Real-time loan tracking and management
- Automated repayment system

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- XRPL (XRP Ledger)
- Framer Motion

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/creditnexus.git
cd creditnexus
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your environment variables:
```env
NEXT_PUBLIC_XRPL_TESTNET_URL=wss://s.altnet.rippletest.net:51233
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
creditnexus/
├── app/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   │   
│   │   └── page.tsx
│   ├── about/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── .env.local
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- XRPL Foundation
- Next.js Team
- Tailwind CSS Team 