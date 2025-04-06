'use client';

import { FaShieldAlt, FaLock, FaChartLine, FaGlobe } from 'react-icons/fa';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Decentralized Security',
    description: 'Built on the XRPL blockchain for maximum security and transparency',
    icon: <FaShieldAlt className="w-12 h-12 text-primary-500" />,
  },
  {
    title: 'Smart Contracts',
    description: 'Automated loan agreements and repayments through smart contracts',
    icon: <FaLock className="w-12 h-12 text-primary-500" />,
  },
  {
    title: 'Credit Scoring',
    description: 'Transparent and fair credit scoring system powered by blockchain',
    icon: <FaChartLine className="w-12 h-12 text-primary-500" />,
  },
  {
    title: 'Global Access',
    description: 'Access credit services from anywhere in the world',
    icon: <FaGlobe className="w-12 h-12 text-primary-500" />,
  },
];

export default function About() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About CreditNexus
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            CreditNexus is a revolutionary decentralized credit system built on the XRPL blockchain,
            providing transparent and secure lending services to users worldwide.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="card"
          >
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-300">
              To democratize access to credit by leveraging blockchain technology,
              making lending and borrowing more transparent, secure, and accessible
              to everyone, regardless of their location or financial background.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="card"
          >
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-300">
              CreditNexus uses smart contracts on the XRPL blockchain to automate
              the lending process, from credit scoring to loan issuance and repayment.
              Our system ensures transparency and security while reducing the need
              for traditional financial intermediaries.
            </p>
          </motion.div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
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
    </div>
  );
} 