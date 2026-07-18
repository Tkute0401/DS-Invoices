'use client'

import React, { useState, useEffect } from 'react'

type PaymentAccount = {
  id: string
  accountName: string
  accountType: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  upiId?: string
  isActive: boolean
}

export default function PaymentAccountsPage() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [newAccount, setNewAccount] = useState({
    accountName: '',
    accountType: 'BANK_ACCOUNT',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  })

  const fetchAccounts = () => {
    setIsLoading(true)
    fetch('/api/payment-accounts')
      .then(res => res.json())
      .then(data => {
        setAccounts(data || [])
        setIsLoading(false)
      })
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch('/api/payment-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      })
      if (res.ok) {
        setIsAdding(false)
        setNewAccount({
          accountName: '',
          accountType: 'BANK_ACCOUNT',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          upiId: ''
        })
        fetchAccounts()
      } else {
        alert('Failed to add payment account.')
      }
    } catch (error) {
      alert('Error adding payment account.')
    }
    setIsSaving(false)
  }

  if (isLoading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Payment Accounts</h1>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-black text-white px-4 py-2 rounded font-medium hover:bg-gray-800"
          >
            {isAdding ? 'Cancel' : 'Add New Account'}
          </button>
        </div>

        {isAdding && (
          <div className="bg-white p-6 rounded shadow mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Add Payment Account</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Display Name</label>
                  <input 
                    required 
                    placeholder="e.g. HDFC Current Account"
                    className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                    value={newAccount.accountName} 
                    onChange={e => setNewAccount({...newAccount, accountName: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select 
                    className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                    value={newAccount.accountType} 
                    onChange={e => setNewAccount({...newAccount, accountType: e.target.value})}
                  >
                    <option value="BANK_ACCOUNT">Bank Account</option>
                    <option value="UPI">UPI</option>
                    <option value="WALLET">Wallet</option>
                  </select>
                </div>
              </div>
              
              {newAccount.accountType === 'BANK_ACCOUNT' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input 
                      required 
                      className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                      value={newAccount.bankName} 
                      onChange={e => setNewAccount({...newAccount, bankName: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input 
                      required 
                      className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                      value={newAccount.accountNumber} 
                      onChange={e => setNewAccount({...newAccount, accountNumber: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input 
                      required 
                      className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                      value={newAccount.ifscCode} 
                      onChange={e => setNewAccount({...newAccount, ifscCode: e.target.value})} 
                    />
                  </div>
                </div>
              )}

              {newAccount.accountType === 'UPI' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                  <input 
                    required 
                    className="w-full max-w-md border border-gray-300 rounded p-2 text-gray-800" 
                    value={newAccount.upiId} 
                    onChange={e => setNewAccount({...newAccount, upiId: e.target.value})} 
                  />
                </div>
              )}
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 text-sm">
                <th className="py-3 px-4 font-semibold">Account Name</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Details</th>
                <th className="py-3 px-4 font-semibold w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No payment accounts added yet.
                  </td>
                </tr>
              ) : (
                accounts.map((acc: any) => (
                  <tr key={acc.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{acc.accountName}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{acc.accountType}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {acc.accountType === 'BANK_ACCOUNT' ? (
                        <>
                          <div className="font-medium">{acc.bankName}</div>
                          <div>A/c: {acc.accountNumber}</div>
                          <div>IFSC: {acc.ifscCode}</div>
                        </>
                      ) : acc.accountType === 'UPI' ? (
                        <div>UPI: {acc.upiId}</div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${acc.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {acc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
