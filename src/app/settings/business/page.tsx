'use client'

import React, { useState, useEffect } from 'react'

export default function BusinessSettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetch('/api/business-profile')
      .then(res => res.json())
      .then(data => {
        setProfile(data || {})
        setIsLoading(false)
      })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch('/api/business-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      if (res.ok) {
        alert('Business profile saved successfully!')
      } else {
        alert('Failed to save business profile.')
      }
    } catch (error) {
      alert('Error saving business profile.')
    }
    setIsSaving(false)
  }

  if (isLoading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Business Settings</h1>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input 
                required 
                className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                value={profile.name || ''} 
                onChange={e => setProfile({...profile, name: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
              <input 
                className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                value={profile.gstin || ''} 
                onChange={e => setProfile({...profile, gstin: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
              <input 
                className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                value={profile.pan || ''} 
                onChange={e => setProfile({...profile, pan: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email"
                className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                value={profile.email || ''} 
                onChange={e => setProfile({...profile, email: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input 
                className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                value={profile.phone || ''} 
                onChange={e => setProfile({...profile, phone: e.target.value})} 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea 
              className="w-full border border-gray-300 rounded p-2 text-gray-800 h-24" 
              value={profile.address || ''} 
              onChange={e => setProfile({...profile, address: e.target.value})} 
            />
          </div>
          
          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-800 border-b pb-2">Default Bank Details (Optional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
              <input 
                className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                value={profile.bankAccountName || ''} 
                onChange={e => setProfile({...profile, bankAccountName: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input 
                className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                value={profile.bankAccountNumber || ''} 
                onChange={e => setProfile({...profile, bankAccountNumber: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
              <input 
                className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                value={profile.bankIfsc || ''} 
                onChange={e => setProfile({...profile, bankIfsc: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input 
                className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                value={profile.bankName || ''} 
                onChange={e => setProfile({...profile, bankName: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Type (e.g. Current)</label>
              <input 
                className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                value={profile.bankType || ''} 
                onChange={e => setProfile({...profile, bankType: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
              <input 
                className="w-full border border-gray-300 rounded p-2 text-gray-800" 
                value={profile.upiId || ''} 
                onChange={e => setProfile({...profile, upiId: e.target.value})} 
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-black text-white px-6 py-2 rounded font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
