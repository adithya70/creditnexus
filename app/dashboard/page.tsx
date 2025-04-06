'use client';

import { useState, useEffect } from 'react';
import { Client, Wallet, TrustSet, Payment, TransactionMetadata, AccountTxResponse, AccountLinesResponse, IssuedCurrencyAmount, Amount } from 'xrpl';
import { FaWallet, FaUserPlus, FaMoneyBillWave, FaHistory, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';

const RLUSD_ISSUER = "rDdaDwNFMfPjHyoKaWxxjwSUiMRScorG6J";
const RLUSD_ISSUER_SECRET = "sEdVkfFkpuN64NSspufXRMfBbDdAxDu";
const RLUSD_HEX = Array.from("RLUSD")
  .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
  .join('')
  .padEnd(40, '0')
  .toUpperCase();

export default function Dashboard() {
  const [client, setClient] = useState<Client | null>(null);
  const [bankWallet, setBankWallet] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bank');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCoBorrower, setSelectedCoBorrower] = useState('');
  const [loanAmount, setLoanAmount] = useState('10');
  const [loanTerm, setLoanTerm] = useState('5');
  const [repaymentUser, setRepaymentUser] = useState('');
  const [repaymentLoan, setRepaymentLoan] = useState('');
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const initClient = async () => {
      const xrplClient = new Client('wss://s.altnet.rippletest.net:51233');
      await xrplClient.connect();
      setClient(xrplClient);
    };

    initClient();
    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, []);

  const initializeBank = async () => {
    if (!client) return;
    setLoading(true);
    setOutput('Connecting to XRPL testnet...');
    
    try {
      const bankResponse = await client.fundWallet();
      setBankWallet(bankResponse.wallet);
      
      // Set up RLUSD trustline
      const trustSet: TrustSet = {
        TransactionType: "TrustSet",
        Account: bankResponse.wallet.classicAddress,
        LimitAmount: {
          currency: RLUSD_HEX,
          issuer: RLUSD_ISSUER,
          value: "10000000"
        }
      };
      
      const preparedTrust = await client.autofill(trustSet);
      const signedTrust = bankResponse.wallet.sign(preparedTrust);
      await client.submitAndWait(signedTrust.tx_blob);
      
      // Mint initial RLUSD
      const issuerWallet = Wallet.fromSeed(RLUSD_ISSUER_SECRET);
      const mintPayment: Payment = {
        TransactionType: "Payment",
        Account: issuerWallet.classicAddress,
        Destination: bankResponse.wallet.classicAddress,
        Amount: {
          currency: RLUSD_HEX,
          issuer: RLUSD_ISSUER,
          value: "1000000"
        }
      };
      
      const preparedMint = await client.autofill(mintPayment);
      const signedMint = issuerWallet.sign(preparedMint);
      await client.submitAndWait(signedMint.tx_blob);
      
      setOutput(`✅ Bank account initialized successfully!\n` +
        `Address: ${bankResponse.wallet.classicAddress}\n` +
        `Secret: ${bankResponse.wallet.seed}\n` +
        `RLUSD Trustline set up\n` +
        `1,000,000 RLUSD minted to bank account\n\n` +
        `Note: This is a testnet account. Do not use this secret on mainnet.`);
    } catch (error) {
      setOutput(`❌ Error initializing bank: ${error.message}\n` +
        `Please check your internet connection and try again.`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!client) {
      setOutput("❌ Please initialize the bank first");
      return;
    }
    
    setLoading(true);
    setOutput('');
    
    try {
      const userResponse = await client.fundWallet();
      const userWallet = userResponse.wallet;
      
      // Set up RLUSD trustline for user
      const trustSet: TrustSet = {
        TransactionType: "TrustSet",
        Account: userWallet.classicAddress,
        LimitAmount: {
          currency: RLUSD_HEX,
          issuer: RLUSD_ISSUER,
          value: "100000"
        }
      };
      
      const preparedTrust = await client.autofill(trustSet);
      const signedTrust = userWallet.sign(preparedTrust);
      await client.submitAndWait(signedTrust.tx_blob);
      
      // Mint RLUSD to user account
      const issuerWallet = Wallet.fromSeed(RLUSD_ISSUER_SECRET);
      const mintPayment: Payment = {
        TransactionType: "Payment",
        Account: issuerWallet.classicAddress,
        Destination: userWallet.classicAddress,
        Amount: {
          currency: RLUSD_HEX,
          issuer: RLUSD_ISSUER,
          value: "10000"
        }
      };
      
      const preparedMint = await client.autofill(mintPayment);
      const signedMint = issuerWallet.sign(preparedMint);
      await client.submitAndWait(signedMint.tx_blob);
      
      // Create user object
      const newUser = {
        id: users.length + 1,
        wallet: userWallet,
        creditScore: 500,
        loans: [],
        lastRepaymentTime: null,
        totalBorrowed: 0,
        totalRepaid: 0
      };
      
      setUsers([...users, newUser]);
      setOutput(`✅ Created new user #${newUser.id}\n` +
        `Address: ${userWallet.classicAddress}\n` +
        `Secret: ${userWallet.seed}\n` +
        `RLUSD Trustline set up\n` +
        `10,000 RLUSD minted to user account\n` +
        `Initial Credit Score: ${newUser.creditScore}\n\n` +
        `Note: This is a testnet account. Do not use this secret on mainnet.`);
    } catch (error) {
      setOutput(`❌ Error creating user: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const issueLoan = async () => {
    if (!client || !bankWallet) {
      setOutput("❌ Please initialize the bank first");
      return;
    }

    const userId = parseInt(selectedUser);
    const coBorrowerId = selectedCoBorrower ? parseInt(selectedCoBorrower) : null;
    const amount = parseFloat(loanAmount);
    const termMinutes = parseInt(loanTerm);

    if (!userId || !amount || !termMinutes) {
      setOutput("❌ Please select a user and enter valid loan details");
      return;
    }

    setLoading(true);
    setOutput('');

    try {
      const user = users.find(u => u.id === userId);
      const coBorrower = coBorrowerId ? users.find(u => u.id === coBorrowerId) : null;

      if (!user) {
        throw new Error("User not found");
      }

      if (coBorrowerId && !coBorrower) {
        throw new Error("Co-borrower not found");
      }

      // Check credit scores
      if (user.creditScore < 300) {
        throw new Error("User credit score too low for a loan");
      }

      if (coBorrower && coBorrower.creditScore < 300) {
        throw new Error("Co-borrower credit score too low for a loan");
      }

      // Create loan record
      const newLoan = {
        id: loans.length + 1,
        userId: user.id,
        coBorrowerId: coBorrowerId,
        amount: amount,
        issuedAt: new Date(),
        dueAt: new Date(Date.now() + termMinutes * 60000),
        repaid: false,
        repaidAt: null,
        repaidAmount: 0,
        status: "active"
      };

      // Create payment transaction
      const issuerWallet = Wallet.fromSeed(RLUSD_ISSUER_SECRET);
      const payment: Payment = {
        TransactionType: "Payment",
        Account: issuerWallet.classicAddress,
        Destination: user.wallet.classicAddress,
        Amount: {
          currency: RLUSD_HEX,
          issuer: RLUSD_ISSUER,
          value: amount.toString()
        }
      };

      const prepared = await client.autofill(payment);
      const signed = issuerWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (typeof result.result.meta === 'object' && result.result.meta !== null && 'TransactionResult' in result.result.meta) {
        const meta = result.result.meta as TransactionMetadata;
        if (meta.TransactionResult === "tesSUCCESS") {
          setLoans([...loans, newLoan]);
          const updatedUsers = users.map(u => {
            if (u.id === user.id) {
              return { ...u, loans: [...u.loans, newLoan.id], totalBorrowed: u.totalBorrowed + amount };
            }
            if (coBorrower && u.id === coBorrower.id) {
              return { ...u, loans: [...u.loans, newLoan.id], totalBorrowed: u.totalBorrowed + amount };
            }
            return u;
          });
          setUsers(updatedUsers);

          setOutput(`✅ Successfully issued loan of ${amount} RLUSD to User #${user.id}\n` +
            `Due date: ${newLoan.dueAt.toLocaleString()}\n` +
            `Transaction hash: ${result.result.hash}`);
        } else {
          throw new Error(`Transaction failed: ${meta.TransactionResult}`);
        }
      } else {
        throw new Error("Invalid transaction metadata");
      }
    } catch (error) {
      setOutput(`❌ Error issuing loan: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkRepayments = async () => {
    if (!loans.length) {
      setOutput("No active loans to check");
      return;
    }
    
    setLoading(true);
    setOutput("Checking for repayments...\n");
    
    try {
      let repaymentsFound = 0;
      
      // Check each active loan
      for (const loan of loans.filter(l => !l.repaid)) {
        const user = users.find(u => u.id === loan.userId);
        if (!user) continue;
        
        // Get user's payment history
        const payments = await client.request({
          command: "account_tx",
          account: user.wallet.classicAddress,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 10
        }) as AccountTxResponse;
        
        // Check for payments to bank
        for (const tx of payments.result.transactions) {
          if (tx.tx.TransactionType === "Payment" && 
              tx.tx.Destination === bankWallet.classicAddress &&
              new Date(tx.tx.date * 1000) > loan.issuedAt) {
            
            const paymentAmount = parseFloat(tx.tx.Amount);
            
            // Update loan repayment
            loan.repaidAmount += paymentAmount;
            
            // Check if full amount is repaid
            if (loan.repaidAmount >= loan.amount) {
              loan.repaid = true;
              loan.repaidAt = new Date(tx.tx.date * 1000);
              loan.status = "repaid";
              user.lastRepaymentTime = loan.repaidAt;
              user.totalRepaid += loan.amount;
              repaymentsFound++;
              
              // Calculate repayment speed (0-1 where 1 is early, 0 is late)
              const totalTime = loan.dueAt - loan.issuedAt;
              const actualTime = loan.repaidAt - loan.issuedAt;
              const repaymentSpeed = Math.max(0, Math.min(1, 1 - (actualTime / totalTime)));
              
              // Update credit score (300-850 range)
              const scoreChange = Math.round(50 * repaymentSpeed);
              user.creditScore = Math.min(850, Math.max(300, user.creditScore + scoreChange));
              
              setOutput(prev => prev + `\nUser #${user.id} repaid loan #${loan.id} `);
              if (repaymentSpeed > 0.8) {
                setOutput(prev => prev + `early! (+${scoreChange} credit score)`);
              } else if (repaymentSpeed > 0.5) {
                setOutput(prev => prev + `on time. (+${scoreChange} credit score)`);
              } else {
                setOutput(prev => prev + `late. (+${scoreChange} credit score)`);
              }
            } else {
              // Partial repayment
              setOutput(prev => prev + `\nUser #${user.id} made partial repayment of ${paymentAmount} RLUSD on loan #${loan.id}`);
            }
          }
        }
        
        // Check for overdue loans
        if (!loan.repaid && new Date() > loan.dueAt) {
          loan.status = "overdue";
          // Penalize credit score for overdue loans
          user.creditScore = Math.max(300, user.creditScore - 20);
          setOutput(prev => prev + `\nLoan #${loan.id} is overdue! User #${user.id} credit score decreased.`);
        }
      }
      
      if (repaymentsFound === 0) {
        setOutput(prev => prev + "\nNo full repayments found for active loans");
      }
      
      setLoans([...loans]);
      setUsers([...users]);
    } catch (error) {
      setOutput(prev => prev + `\n❌ Error checking repayments: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const submitRepayment = async () => {
    const userId = parseInt(repaymentUser);
    const loanId = parseInt(repaymentLoan);
    const amount = parseFloat(repaymentAmount);
    
    if (!userId || !loanId || !amount || amount <= 0) {
      setOutput("❌ Please select a user, loan, and enter valid amount");
      return;
    }
    
    setLoading(true);
    setOutput(`Processing repayment of ${amount} RLUSD...`);
    
    try {
      const user = users.find(u => u.id === userId);
      const loan = loans.find(l => l.id === loanId);
      
      if (!user || !loan) {
        throw new Error("User or loan not found");
      }
      
      if (loan.repaid) {
        throw new Error("This loan is already fully repaid");
      }

      // Verify user's current RLUSD balance
      const userBalanceResponse = await client.request({
        command: "account_lines",
        account: user.wallet.classicAddress,
        ledger_index: "validated",
        peer: RLUSD_ISSUER
      }) as AccountLinesResponse;

      let userBalance = 0;
      if (userBalanceResponse.result.lines) {
        const rlusdLine = userBalanceResponse.result.lines.find(line => 
          line.currency === RLUSD_HEX && 
          line.account === RLUSD_ISSUER
        );
        if (rlusdLine) {
          userBalance = parseFloat(rlusdLine.balance);
        }
      }

      if (userBalance < amount) {
        throw new Error(`User only has ${userBalance} RLUSD, but needs ${amount} RLUSD for repayment`);
      }

      // Step 1: User sends RLUSD back to issuer
      const userToIssuerPayment = {
        TransactionType: "Payment",
        Account: user.wallet.classicAddress,
        Destination: RLUSD_ISSUER,
        Amount: {
          currency: RLUSD_HEX,
          issuer: RLUSD_ISSUER,
          value: amount.toString()
        }
      } as Payment;
      
      const preparedUserToIssuer = await client.autofill(userToIssuerPayment);
      const signedUserToIssuer = user.wallet.sign(preparedUserToIssuer);
      const resultUserToIssuer = await client.submitAndWait(signedUserToIssuer.tx_blob);

      if (typeof resultUserToIssuer.result.meta === 'object' && resultUserToIssuer.result.meta !== null && 'TransactionResult' in resultUserToIssuer.result.meta) {
        const meta = resultUserToIssuer.result.meta as TransactionMetadata;
        if (meta.TransactionResult !== "tesSUCCESS") {
          throw new Error(`Failed to send RLUSD to issuer: ${meta.TransactionResult}`);
        }
      } else {
        throw new Error("Invalid transaction metadata");
      }

      // Step 2: Issuer sends RLUSD to bank
      const issuerWallet = Wallet.fromSeed(RLUSD_ISSUER_SECRET);
      const issuerToBankPayment: Payment = {
        TransactionType: "Payment",
        Account: issuerWallet.classicAddress,
        Destination: bankWallet.classicAddress,
        Amount: {
          currency: RLUSD_HEX,
          issuer: RLUSD_ISSUER,
          value: amount.toString()
        } as Amount
      };
      
      const preparedIssuerToBank = await client.autofill(issuerToBankPayment);
      const signedIssuerToBank = issuerWallet.sign(preparedIssuerToBank);
      const resultIssuerToBank = await client.submitAndWait(signedIssuerToBank.tx_blob);
      
      if (typeof resultIssuerToBank.result.meta === 'object' && resultIssuerToBank.result.meta !== null && 'TransactionResult' in resultIssuerToBank.result.meta) {
        const meta = resultIssuerToBank.result.meta as TransactionMetadata;
        if (meta.TransactionResult === "tesSUCCESS") {
          // Update loan repayment
          loan.repaidAmount += amount;
          user.totalRepaid += amount;
          
          // Check if full amount is repaid
          if (loan.repaidAmount >= loan.amount) {
            loan.repaid = true;
            loan.repaidAt = new Date();
            loan.status = "repaid";
            user.lastRepaymentTime = loan.repaidAt;
            
            // Calculate repayment speed (0-1 where 1 is early, 0 is late)
            const totalTime = loan.dueAt - loan.issuedAt;
            const actualTime = loan.repaidAt - loan.issuedAt;
            const repaymentSpeed = Math.max(0, Math.min(1, 1 - (actualTime / totalTime)));
            
            // Update credit score (300-850 range)
            const scoreChange = Math.round(50 * repaymentSpeed);
            user.creditScore = Math.min(850, Math.max(300, user.creditScore + scoreChange));
            
            setOutput(`✅ User #${user.id} fully repaid loan #${loan.id}\n` +
              `Transaction hash: ${resultIssuerToBank.result.hash}\n` +
              `Credit score change: +${scoreChange}`);
          } else {
            setOutput(`✅ User #${user.id} made partial repayment of ${amount} RLUSD on loan #${loan.id}\n` +
              `Transaction hash: ${resultIssuerToBank.result.hash}\n` +
              `Amount remaining: ${(loan.amount - loan.repaidAmount).toFixed(6)} RLUSD`);
          }
          
          setLoans([...loans]);
          setUsers([...users]);
        } else {
          throw new Error(`Failed to send RLUSD to bank: ${meta.TransactionResult}`);
        }
      } else {
        throw new Error("Invalid transaction metadata");
      }
    } catch (error) {
      setOutput(`❌ Error processing repayment: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">CreditNexus Dashboard</h1>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'bank' ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <FaWallet className="inline-block mr-2" />
            Bank
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'users' ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <FaUserPlus className="inline-block mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'loans' ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <FaMoneyBillWave className="inline-block mr-2" />
            Loans
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'history' ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <FaHistory className="inline-block mr-2" />
            History
          </button>
        </div>
        
        {/* Bank Tab */}
        {activeTab === 'bank' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 p-6 rounded-lg"
          >
            <h2 className="text-2xl font-bold mb-4">Bank Controls</h2>
            {!bankWallet ? (
              <button
                onClick={initializeBank}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="inline-block animate-spin mr-2" />
                    Initializing...
                  </>
                ) : (
                  'Initialize Bank Account'
                )}
              </button>
            ) : (
              <div>
                <p className="mb-2"><strong>Bank Address:</strong> {bankWallet.classicAddress}</p>
                <p className="mb-2"><strong>Bank Secret:</strong> {bankWallet.seed}</p>
                <p className="mb-4"><strong>Bank Balance:</strong> 1,000,000 RLUSD</p>
                <button className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                  Refresh Balance
                </button>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 p-6 rounded-lg"
          >
            <h2 className="text-2xl font-bold mb-4">User Management</h2>
            <button
              onClick={createUser}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="inline-block animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create New User'
              )}
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => (
                <div key={user.id} className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-xl font-bold mb-2">User #{user.id}</h3>
                  <p className="mb-1"><strong>Address:</strong> {user.wallet.classicAddress}</p>
                  <p className="mb-1"><strong>Credit Score:</strong> {user.creditScore}</p>
                  <p className="mb-1"><strong>Total Borrowed:</strong> {user.totalBorrowed} RLUSD</p>
                  <p className="mb-1"><strong>Total Repaid:</strong> {user.totalRepaid} RLUSD</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 p-6 rounded-lg"
          >
            <h2 className="text-2xl font-bold mb-4">Loan Management</h2>
            {!bankWallet ? (
              <p className="text-gray-300">Please initialize the bank account first</p>
            ) : (
              <div className="space-y-8">
                {/* Issue Loan Section */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Issue New Loan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2">Select User</label>
                      <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded p-2"
                      >
                        <option value="">Select User</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            User #{user.id} (Score: {user.creditScore})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2">Co-borrower (Optional)</label>
                      <select
                        value={selectedCoBorrower}
                        onChange={(e) => setSelectedCoBorrower(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded p-2"
                      >
                        <option value="">None</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            User #{user.id} (Score: {user.creditScore})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2">Loan Amount (RLUSD)</label>
                      <input
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded p-2"
                        min="1"
                        max="1000"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Loan Term (minutes)</label>
                      <input
                        type="number"
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded p-2"
                        min="1"
                        max="1440"
                      />
                    </div>
                  </div>
                  <button
                    onClick={issueLoan}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="inline-block animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Issue Loan'
                    )}
                  </button>
                </div>

                {/* Repayment Section */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Loan Repayment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2">Select User</label>
                      <select
                        value={repaymentUser}
                        onChange={(e) => setRepaymentUser(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded p-2"
                      >
                        <option value="">Select User</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            User #{user.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2">Select Loan</label>
                      <select
                        value={repaymentLoan}
                        onChange={(e) => setRepaymentLoan(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded p-2"
                      >
                        <option value="">Select Loan</option>
                        {loans
                          .filter(l => l.userId === parseInt(repaymentUser) && !l.repaid)
                          .map(loan => (
                            <option key={loan.id} value={loan.id}>
                              Loan #{loan.id} ({(loan.amount - loan.repaidAmount).toFixed(6)} RLUSD remaining)
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2">Repayment Amount (RLUSD)</label>
                      <input
                        type="number"
                        value={repaymentAmount}
                        onChange={(e) => setRepaymentAmount(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded p-2"
                        min="0.000001"
                        step="0.000001"
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-x-4">
                    <button
                      onClick={submitRepayment}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="inline-block animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        'Submit Repayment'
                      )}
                    </button>
                    <button
                      onClick={checkRepayments}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="inline-block animate-spin mr-2" />
                          Checking...
                        </>
                      ) : (
                        'Check Repayments'
                      )}
                    </button>
                  </div>
                </div>

                {/* Active Loans Section */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Active Loans</h3>
                  <div className="space-y-4">
                    {loans.filter(l => !l.repaid).map(loan => {
                      const user = users.find(u => u.id === loan.userId);
                      const progress = (loan.repaidAmount / loan.amount) * 100;
                      return (
                        <div key={loan.id} className="bg-gray-700 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-lg font-bold">Loan #{loan.id}</h4>
                            <span className={`px-2 py-1 rounded ${
                              loan.status === 'overdue' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}>
                              {loan.status}
                            </span>
                          </div>
                          <p>User: #{loan.userId} {user ? `(Score: ${user.creditScore})` : ''}</p>
                          <p>Amount: {loan.amount} RLUSD</p>
                          <p>Repaid: {loan.repaidAmount} RLUSD</p>
                          <p>Due: {new Date(loan.dueAt).toLocaleString()}</p>
                          <div className="mt-2 bg-gray-600 rounded-full h-2">
                            <div
                              className={`h-full rounded-full ${
                                loan.status === 'overdue' ? 'bg-red-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-sm text-gray-300 mt-1">{progress.toFixed(1)}% repaid</p>
                        </div>
                      );
                    })}
                    {loans.filter(l => !l.repaid).length === 0 && (
                      <p className="text-gray-300">No active loans</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 p-6 rounded-lg"
          >
            <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Type</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">User</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map(loan => (
                    <tr key={loan.id} className="border-t border-gray-700">
                      <td className="p-2">Loan</td>
                      <td className="p-2">{loan.amount} RLUSD</td>
                      <td className="p-2">User #{loan.userId}</td>
                      <td className="p-2">{new Date(loan.issuedAt).toLocaleString()}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded ${
                          loan.status === 'repaid' ? 'bg-green-500' :
                          loan.status === 'overdue' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Output Area */}
        {output && (
          <div className="mt-8 bg-gray-800 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap font-mono">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
} 