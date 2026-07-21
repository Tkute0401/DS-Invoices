"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"

export type ItemData = {
  id: string
  skuId: string | null
  name: string
  type: string
  price: number
}

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Edit } from "lucide-react"

interface ItemsClientProps {
  data: ItemData[]
}

export function ItemsClient({ data }: ItemsClientProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    skuId: "",
    type: "PRODUCT",
    price: ""
  })

  const handleEdit = (item: ItemData) => {
    setEditId(item.id)
    setFormData({
      name: item.name,
      skuId: item.skuId || "",
      type: item.type || "PRODUCT",
      price: item.price.toString()
    })
    setIsOpen(true)
  }

  const handleAddNew = () => {
    setEditId(null)
    setFormData({ name: "", skuId: "", type: "PRODUCT", price: "" })
    setIsOpen(true)
  }

  const columns = useMemo<ColumnDef<ItemData>[]>(() => [
    {
      accessorKey: "skuId",
      header: "SKU ID",
      cell: ({ row }) => <div className="font-medium text-gray-500">{row.getValue("skuId") || "-"}</div>,
    },
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
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            type === 'PRODUCT' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
          }`}>
            {type}
          </span>
        )
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Price
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("price"))
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount)
   
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original
        return (
          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
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
      const url = editId ? `/api/items/${editId}` : "/api/items"
      const method = editId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setIsOpen(false)
        setFormData({ name: "", skuId: "", type: "PRODUCT", price: "" })
        setEditId(null)
        router.refresh()
      } else {
        alert(`Failed to ${editId ? 'update' : 'create'} item.`)
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
        <h1 className="text-2xl font-bold text-gray-900">Items / Inventory</h1>
        <button 
          onClick={handleAddNew}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </button>
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        searchKey="name" 
        searchPlaceholder="Filter items by name..." 
      />

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="e.g. Web Development"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black bg-white"
                  >
                    <option value="PRODUCT">Product</option>
                    <option value="SERVICE">Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU ID</label>
                <input 
                  type="text" 
                  value={formData.skuId}
                  onChange={(e) => setFormData({...formData, skuId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Optional"
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
                  {isSubmitting ? 'Saving...' : editId ? 'Update Item' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
