'use client';

import Link from 'next/link';
import { FaWallet, FaChartLine, FaShieldAlt, FaExchangeAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Decentralized Credit',
    description: 'Access credit without traditional banks using blockchain technology',
    icon: <FaWallet className="w-12 h-12 text-primary-500" />,
  },
  {
    title: 'Smart Credit Scoring',
    description: 'Transparent and fair credit scoring system powered by blockchain',
    icon: <FaChartLine className="w-12 h-12 text-primary-500" />,
  },
  {
    title: 'Secure Transactions',
    description: 'Bank-grade security with blockchain technology',
    icon: <FaShieldAlt className="w-12 h-12 text-primary-500" />,
  },
  {
    title: 'Instant Loans',
    description: 'Get approved for loans in minutes, not days',
    icon: <FaExchangeAlt className="w-12 h-12 text-primary-500" />,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600">
              CreditNexus
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The future of decentralized credit and lending is here. Experience seamless borrowing and lending on the blockchain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard" className="btn-primary">
                Get Started
              </Link>
              <Link href="/about" className="btn-secondary">
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose CreditNexus?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Join the Future of Credit?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Start your journey with CreditNexus today and experience the power of decentralized finance.
            </p>
            <Link href="/dashboard" className="btn-primary">
              Launch App
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 