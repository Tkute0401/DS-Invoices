"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"

// Define the shape of our data
export type InvoiceData = {
  id: string
  invoiceNumber: string
  date: Date
  dueDate: Date
  status: string
  amountDue: number
  client: {
    name: string
  }
}

const getStatusColor = (status: string) => {
  switch(status) {
    case 'PAID': return 'bg-green-100 text-green-800'
    case 'PART_PAID': return 'bg-blue-100 text-blue-800'
    case 'OVERDUE': return 'bg-red-100 text-red-800'
    case 'DRAFT': return 'bg-gray-100 text-gray-800'
    default: return 'bg-yellow-100 text-yellow-800'
  }
}

export const columns: ColumnDef<InvoiceData>[] = [
  {
    accessorKey: "invoiceNumber",
    header: "Invoice No",
    cell: ({ row }) => <div className="font-medium">{row.getValue("invoiceNumber")}</div>,
  },
  {
    id: "client_name",
    accessorFn: (row) => row.client?.name,
    header: "Client",
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("date") as Date
      return <div>{new Date(date).toLocaleDateString()}</div>
    },
  },
  {
    accessorKey: "dueDate",
    header: "Due",
    cell: ({ row }) => {
      const date = row.getValue("dueDate") as Date
      return <div className="text-right">{new Date(date).toLocaleDateString()}</div>
    },
  },
  {
    accessorKey: "amountDue",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amountDue"))
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount)
 
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className="flex justify-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
      )
    },
  },
]

interface InvoicesClientProps {
  data: InvoiceData[]
}

export function InvoicesClient({ data }: InvoicesClientProps) {
  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="client_name" 
      searchPlaceholder="Filter clients..." 
    />
  )
}
