"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Trash, Copy, Edit } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

interface ReceiptsClientProps {
  data: ReceiptData[]
}

export function ReceiptsClient({ data }: ReceiptsClientProps) {
  const router = useRouter()

  const handleClone = async (id: string) => {
    try {
      const res = await fetch(`/api/receipts/${id}/clone`, { method: 'POST' });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to clone receipt');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this receipt?')) return;
    try {
      const res = await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete receipt');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
  };

  const columns = useMemo<ColumnDef<ReceiptData>[]>(() => [
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
    {
      id: "actions",
      cell: ({ row }) => {
        const receipt = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/receipts/${receipt.id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                View / Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleClone(receipt.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Clone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(receipt.id)} variant="destructive">
                <Trash className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [router])

  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="client_name" 
      searchPlaceholder="Filter clients..." 
    />
  )
}
