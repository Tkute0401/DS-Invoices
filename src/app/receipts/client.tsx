"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"

export type ReceiptData = {
  id: string
  receiptNumber: string
  date: Date
  amountReceived: number
  paymentRecords: {
    paymentMethod: string
    referenceNumber: string | null
  }[]
  client: {
    name: string
  }
}

export const columns: ColumnDef<ReceiptData>[] = [
  {
    accessorKey: "receiptNumber",
    header: "Receipt No",
    cell: ({ row }) => <div className="font-medium">{row.getValue("receiptNumber")}</div>,
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
    id: "paymentMethod",
    header: "Mode",
    accessorFn: (row) => row.paymentRecords?.[0]?.paymentMethod || "-",
    cell: ({ getValue }) => <div>{getValue() as string}</div>,
  },
  {
    id: "referenceNumber",
    header: "Reference",
    accessorFn: (row) => row.paymentRecords?.[0]?.referenceNumber || "-",
    cell: ({ getValue }) => <div className="text-gray-500">{getValue() as string}</div>,
  },
  {
    accessorKey: "amountReceived",
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
      const amount = parseFloat(row.getValue("amountReceived"))
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount)
 
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
]

interface ReceiptsClientProps {
  data: ReceiptData[]
}

export function ReceiptsClient({ data }: ReceiptsClientProps) {
  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="client_name" 
      searchPlaceholder="Filter clients..." 
    />
  )
}
