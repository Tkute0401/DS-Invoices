"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"

export type ClientData = {
  id: string
  name: string
  gstin: string | null
  pan?: string | null
  billingAddress: string | null
}

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Edit } from "lucide-react"

interface ClientsClientProps {
  data: ClientData[]
}

export function ClientsClient({ data }: ClientsClientProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    gstin: "",
    pan: "",
    billingAddress: ""
  })

  const handleEdit = (client: ClientData) => {
    setEditId(client.id)
    setFormData({
      name: client.name,
      gstin: client.gstin || "",
      pan: client.pan || "",
      billingAddress: client.billingAddress || ""
    })
    setIsOpen(true)
  }

  const handleAddNew = () => {
    setEditId(null)
    setFormData({ name: "", gstin: "", pan: "", billingAddress: "" })
    setIsOpen(true)
  }

  const columns = useMemo<ColumnDef<ClientData>[]>(() => [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "gstin",
      header: "GSTIN",
      cell: ({ row }) => <div className="text-gray-500">{row.getValue("gstin") || "-"}</div>,
    },
    {
      accessorKey: "billingAddress",
      header: "Address",
      cell: ({ row }) => <div className="text-gray-500 whitespace-pre-wrap">{row.getValue("billingAddress") || "-"}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const client = row.original
        return (
          <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )
      },
    },
  ], [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const url = editId ? `/api/clients/${editId}` : "/api/clients"
      const method = editId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setIsOpen(false)
        setFormData({ name: "", gstin: "", pan: "", billingAddress: "" })
        setEditId(null)
        router.refresh()
      } else {
        alert(`Failed to ${editId ? 'update' : 'create'} client.`)
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button 
          onClick={handleAddNew}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </button>
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        searchKey="name" 
        searchPlaceholder="Filter clients by name..." 
      />

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Client' : 'Add New Client'}</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <input 
                  type="text" 
                  value={formData.gstin}
                  onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
                <input 
                  type="text" 
                  value={formData.pan}
                  onChange={(e) => setFormData({...formData, pan: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                <textarea 
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({...formData, billingAddress: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Optional"
                  rows={3}
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editId ? 'Update Client' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
