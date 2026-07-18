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

export const columns: ColumnDef<ItemData>[] = [
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
]

interface ItemsClientProps {
  data: ItemData[]
}

export function ItemsClient({ data }: ItemsClientProps) {
  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="name" 
      searchPlaceholder="Filter items by name..." 
    />
  )
}
