"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"

export type ClientData = {
  id: string
  name: string
  gstin: string | null
  billingAddress: string | null
}

export const columns: ColumnDef<ClientData>[] = [
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
]

interface ClientsClientProps {
  data: ClientData[]
}

export function ClientsClient({ data }: ClientsClientProps) {
  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="name" 
      searchPlaceholder="Filter clients by name..." 
    />
  )
}
