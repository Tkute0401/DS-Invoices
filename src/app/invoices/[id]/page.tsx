import InvoiceEditor from '@/components/InvoiceEditor';

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <InvoiceEditor invoiceId={resolvedParams.id} />
    </div>
  );
}
