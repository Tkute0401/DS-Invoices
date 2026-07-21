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

interface InvoicesClientProps {
  data: InvoiceData[]
}

export function InvoicesClient({ data }: InvoicesClientProps) {
  const router = useRouter()

  const handleClone = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}/clone`, { method: 'POST' });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to clone invoice');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete invoice');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
  };

  const columns = useMemo<ColumnDef<InvoiceData>[]>(() => [
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
    {
      id: "actions",
      cell: ({ row }) => {
        const invoice = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                View / Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleClone(invoice.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Clone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(invoice.id)} variant="destructive">
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
