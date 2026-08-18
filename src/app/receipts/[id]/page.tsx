import ReceiptEditor from '@/components/ReceiptEditor';

export default async function EditReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <ReceiptEditor receiptId={resolvedParams.id} />
    </div>
  );
}
