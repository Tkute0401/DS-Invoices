'use client'

import React from 'react'
import Link from 'next/link'
import { Building2, CreditCard } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/settings/business" className="block group">
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-black transition shadow-sm h-full flex flex-col justify-center items-center text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition">
                <Building2 className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Business Profile</h2>
              <p className="text-gray-500 text-sm">
                Manage your business name, address, GSTIN, PAN, and contact details.
              </p>
            </div>
          </Link>

          <Link href="/settings/payment-accounts" className="block group">
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-black transition shadow-sm h-full flex flex-col justify-center items-center text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition">
                <CreditCard className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Payment Accounts</h2>
              <p className="text-gray-500 text-sm">
                Add bank accounts, UPI IDs, and wallets to allocate receipts.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
