'use client';

import React, { useState, useRef, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';

type Client = {
  id: string;
  name: string;
  billingAddress?: string;
  gstin?: string;
  pan?: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  date: string;
  clientId: string;
};

type Allocation = {
  invoiceId: string;
  invoiceNumber: string;
  amountDue: number;
  amountAllocated: number;
};

export default function ReceiptEditor() {
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [receipt, setReceipt] = useState({
    no: 'A00130',
    date: new Date().toISOString().split('T')[0],
    method: 'BANK_TRANSFER',
    paymentAccountId: '',
    amountReceived: 0,
    tdsAmount: 0,
    transactionCharges: 0,
    status: 'Settled'
  });

  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);

  const [issuedBy, setIssuedBy] = useState({
    name: '',
    address: '',
    gstin: '',
    pan: '',
    email: '',
    phone: ''
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<{ value: string, label: string, isNew: boolean } | null>(null);

  const [issuedTo, setIssuedTo] = useState({
    id: '',
    name: '',
    address: '',
    gstin: '',
    pan: ''
  });

  const [openInvoices, setOpenInvoices] = useState<Invoice[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [bpRes, paRes, clRes, invRes] = await Promise.all([
        fetch('/api/business-profile').then(res => res.json()),
        fetch('/api/payment-accounts').then(res => res.json()),
        fetch('/api/clients').then(res => res.json()),
        fetch('/api/invoices').then(res => res.json())
      ]);

      setBusinessProfile(bpRes);
      if (bpRes && !bpRes.error) {
        setIssuedBy({
          name: bpRes.name || '',
          address: bpRes.address || '',
          gstin: bpRes.gstin || '',
          pan: bpRes.pan || '',
          email: bpRes.email || '',
          phone: bpRes.phone || ''
        });
      }

      setPaymentAccounts(paRes);
      if (paRes && paRes.length > 0) {
        setReceipt(prev => ({ ...prev, paymentAccountId: paRes[0].id }));
      }

      setClients(clRes);

      const urlParams = new URLSearchParams(window.location.search);
      const invId = urlParams.get('invoiceId');
      
      if (invId) {
        const invoice = invRes.find((inv: any) => inv.id === invId);
        if (invoice) {
          const client = clRes.find((c: any) => c.id === invoice.clientId);
          if (client) {
            setSelectedClient({ value: client.id, label: client.name, isNew: false });
            setIssuedTo({
              id: client.id,
              name: client.name,
              address: client.billingAddress || '',
              gstin: client.gstin || '',
              pan: client.pan || ''
            });

            const clientOpenInvoices = invRes.filter((inv: any) => inv.clientId === client.id && inv.amountDue > 0);
            setOpenInvoices(clientOpenInvoices);
            
            const newAllocations = clientOpenInvoices.map((inv: any) => ({
              invoiceId: inv.id,
              invoiceNumber: inv.invoiceNumber,
              amountDue: inv.amountDue,
              amountAllocated: inv.id === invId ? inv.amountDue : 0
            }));
            setAllocations(newAllocations);
            setReceipt(prev => ({ ...prev, amountReceived: invoice.amountDue }));
          }
        }
      }
    };
    
    fetchData();
  }, []);

  const clientOptions = clients.map((c: any) => ({ value: c.id, label: c.name, isNew: false }));

  const handleClientChange = (newValue: any) => {
    setSelectedClient(newValue);
    if (!newValue) {
      setIssuedTo({ id: '', name: '', address: '', gstin: '', pan: '' });
      setOpenInvoices([]);
      setAllocations([]);
      return;
    }

    if (newValue.__isNew__) {
      setIssuedTo({
        id: '',
        name: newValue.value,
        address: '',
        gstin: '',
        pan: ''
      });
      setOpenInvoices([]);
      setAllocations([]);
    } else {
      const client = clients.find((c: any) => c.id === newValue.value);
      if (client) {
        setIssuedTo({
          id: client.id,
          name: client.name,
          address: client.billingAddress || '',
          gstin: client.gstin || '',
          pan: client.pan || ''
        });

        // Fetch open invoices for this client
        fetch('/api/invoices')
          .then(res => res.json())
          .then((data: Invoice[]) => {
             const clientOpenInvoices = data.filter((inv: any) => inv.clientId === client.id && inv.amountDue > 0);
             setOpenInvoices(clientOpenInvoices);
             
             // Create empty allocations for these invoices
             const newAllocations = clientOpenInvoices.map((inv: any) => ({
                invoiceId: inv.id,
                invoiceNumber: inv.invoiceNumber,
                amountDue: inv.amountDue,
                amountAllocated: 0
             }));
             setAllocations(newAllocations);
          });
      }
    }
  };

  const updateAllocation = (index: number, amount: number) => {
    const newAllocations = [...allocations];
    newAllocations[index].amountAllocated = amount;
    setAllocations(newAllocations);
  };

  const totalAllocated = allocations.reduce((sum, alloc) => sum + (alloc.amountAllocated || 0), 0);
  const tds = receipt.tdsAmount || 0;
  const charges = receipt.transactionCharges || 0;
  const totalSettlementValue = (receipt.amountReceived || 0) + tds + charges;
  const totalReceived = receipt.amountReceived || 0;

  const handlePrint = async () => {
    setIsGeneratingPdf(true);
    
    // Give React a moment to re-render inputs as plain text
    setTimeout(async () => {
      if (!printAreaRef.current) return;
      
      const elements = printAreaRef.current.querySelectorAll('input, textarea');
      elements.forEach((el) => {
        if (el instanceof HTMLInputElement) {
          el.setAttribute('value', el.value);
          if (el.type === 'checkbox' || el.type === 'radio') {
            if (el.checked) el.setAttribute('checked', 'checked');
            else el.removeAttribute('checked');
          }
        } else if (el instanceof HTMLTextAreaElement) {
          el.innerHTML = el.value;
        }
      });
      
      const html = printAreaRef.current.innerHTML;
      const htmlClasses = document.documentElement.className.replace(/\bdark\b/g, '').trim();
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map(el => el.outerHTML)
        .join('\n');
      
      try {
        const res = await fetch('/api/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html, styles, htmlClasses })
        });
        
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Receipt_${receipt.no}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else {
          alert('Failed to generate PDF');
        }
      } catch (err) {
        alert('Error generating PDF');
      }
      
      setIsGeneratingPdf(false);
    }, 100);
  };

  const handleSave = async () => {
    if (!issuedTo.name) {
      alert("Please select or enter a client.");
      return;
    }
    if (totalAllocated > totalSettlementValue) {
      alert("You cannot allocate more than the total settlement value (Received + TDS + Charges).");
      return;
    }

    setIsSaving(true);
    try {
      let clientId = issuedTo.id;

      // 1. Create client if new
      if (!clientId) {
        const clientRes = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: issuedTo.name,
            billingAddress: issuedTo.address,
            gstin: issuedTo.gstin,
            pan: issuedTo.pan
          })
        });
        const client = await clientRes.json();
        clientId = client.id;
      }

      const validAllocations = allocations.filter((a: any) => a.amountAllocated > 0);

      // 2. Save receipt
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId,
          receiptNumber: receipt.no,
          date: receipt.date,
          amountReceived: receipt.amountReceived,
          tdsAmount: receipt.tdsAmount,
          transactionCharges: receipt.transactionCharges,
          paymentRecords: validAllocations.map((alloc: any) => ({
            invoiceId: alloc.invoiceId,
            amountAllocated: alloc.amountAllocated,
            paymentMethod: receipt.method,
            paymentAccountId: receipt.paymentAccountId || null
          }))
        })
      });
      
      const data = await res.json();
      if (res.ok && !data.error) {
        alert('Receipt saved successfully!');
      } else {
        alert('Failed to save receipt: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error saving receipt');
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      
      {/* Editor Controls */}
      <div className="w-full max-w-[210mm] mb-4 bg-white p-4 rounded shadow print:hidden flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <span className="text-sm font-medium text-gray-700">Receipt Management</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleSave} disabled={isSaving} className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition shadow-sm font-medium">
            {isSaving ? 'Saving...' : 'Save to Database'}
          </button>
          <button onClick={handlePrint} disabled={isGeneratingPdf} className="bg-white border border-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-50 transition disabled:opacity-50 shadow-sm font-medium">
            {isGeneratingPdf ? 'Generating PDF...' : 'Print / Download PDF'}
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-8">
        <div id="print-area" ref={printAreaRef} className="relative w-full min-w-[800px] max-w-[210mm] min-h-[290mm] bg-white shadow-lg print:shadow-none print:w-full p-8 sm:p-12 text-sm text-gray-800 font-sans mx-auto flex flex-col z-0">
        
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-[-1]">
          <img src="/watermark.png" alt="Watermark" className="w-[70%]" />
        </div>
        
        {/* Header Section */}
        <div className="relative w-[calc(100%+6rem)] border-t-8 border-black -mt-12 -ml-12 px-12 pt-12 pb-6 mb-8 flex flex-col">
          <div className="flex justify-between items-start mb-5">
            <div className="w-1/3 mt-15">
              <img src="/header-logo.png" alt="Company Logo" className="w-32 h-auto object-contain" />
            </div>
            <div className="w-1/3 flex justify-center">
              <h1 className="text-4xl text-black font-black tracking-widest uppercase mt-0">RECEIPT</h1>
            </div>
            <div className="w-1/3 flex justify-end">
              <div className="bg-[#4caf50] text-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded mt-15 shadow-sm">{receipt.status}</div>
            </div>
          </div>

          <div className="flex justify-between">
            <div className="w-1/2">
              <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1 leading-tight">
                Pandit Colony, Nashik<br />Maharashtra India - 422002.
              </div>
              <div className="text-[12px] text-black font-bold">
                digitalsupremacy.in
              </div>
            </div>
            <div className="w-1/2 flex flex-col items-end gap-1 text-[13px] -mt-25">
              <div className="flex justify-between w-48 border-b border-gray-200 pb-1 mt-1">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-xs mt-1">Date</span>
                <input type="date" value={receipt.date} onChange={e => setReceipt({...receipt, date: e.target.value})} className="font-bold text-black bg-transparent text-right outline-none max-w-[120px]" />
              </div>
              <div className="flex justify-between w-48 border-b border-gray-200 pb-1 mt-1">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-xs mt-1">Receipt No</span>
                <input type="text" value={receipt.no} onChange={e => setReceipt({...receipt, no: e.target.value})} className="font-bold text-black bg-transparent text-right outline-none w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Issued By / To Section */}
        <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
          <div className="bg-gray-50 border-l-4 border-black p-3 h-full">
            <h2 className="text-black font-bold uppercase tracking-wider text-[11px] mb-2">Issued by</h2>
            <input value={issuedBy.name} onChange={e => setIssuedBy({...issuedBy, name: e.target.value})} className="font-bold mb-1 text-black text-[13px] bg-transparent outline-none w-full border-b border-transparent hover:border-gray-300 focus:border-black" />
            <textarea value={issuedBy.address} onChange={e => { setIssuedBy({...issuedBy, address: e.target.value}); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }} className="w-full bg-transparent outline-none resize-none text-gray-600 mb-2 leading-relaxed text-[12px] border-b border-transparent hover:border-gray-300 focus:border-black overflow-hidden" rows={2} />
            <div className="grid grid-cols-[50px_1fr] gap-x-2 gap-y-0.5 text-gray-800 text-[12px]">
              <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider mt-0.5">GSTIN</span> 
              <input value={issuedBy.gstin} onChange={e => setIssuedBy({...issuedBy, gstin: e.target.value})} className="font-medium bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black w-full" />
              <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider mt-0.5">PAN</span> 
              <input value={issuedBy.pan} onChange={e => setIssuedBy({...issuedBy, pan: e.target.value})} className="font-medium bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black w-full" />
            </div>
          </div>

          <div className="bg-gray-50 border-l-4 border-black p-3 h-full relative group">
            <h2 className="text-black font-bold uppercase tracking-wider text-[11px] mb-2">Issued to</h2>
            
            {/* Client Selector (Visible only in UI, not in print) */}
            <div className="print:hidden mb-3 absolute top-3 right-3 w-48 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <CreatableSelect 
                instanceId="client-select"
                isClearable
                placeholder="Search Client..."
                options={clientOptions}
                value={selectedClient}
                onChange={handleClientChange}
                styles={{
                  control: (base) => ({ ...base, fontSize: '12px', minHeight: '30px' }),
                  menu: (base) => ({ ...base, fontSize: '12px', zIndex: 50 })
                }}
              />
            </div>

            <input value={issuedTo.name} onChange={e => setIssuedTo({...issuedTo, name: e.target.value})} placeholder="Client Name" className="font-bold mb-1 text-black text-[13px] bg-transparent outline-none w-full border-b border-transparent hover:border-gray-300 focus:border-black" />
            <textarea value={issuedTo.address} onChange={e => { setIssuedTo({...issuedTo, address: e.target.value}); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }} placeholder="Client Address" className="w-full bg-transparent outline-none resize-none text-gray-600 mb-2 leading-relaxed text-[12px] border-b border-transparent hover:border-gray-300 focus:border-black overflow-hidden" rows={2} />
            <div className="grid grid-cols-[50px_1fr] gap-x-2 gap-y-0.5 text-gray-800 text-[12px]">
              <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider mt-0.5">GSTIN</span> 
              <input value={issuedTo.gstin} onChange={e => setIssuedTo({...issuedTo, gstin: e.target.value})} placeholder="GSTIN" className="font-medium bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black w-full" />
              <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider mt-0.5">PAN</span> 
              <input value={issuedTo.pan} onChange={e => setIssuedTo({...issuedTo, pan: e.target.value})} placeholder="PAN" className="font-medium bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black w-full" />
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mb-6 relative z-10">
          <h2 className="text-[#333b47] font-bold text-[15px] mb-3">Payment Summary</h2>
          <div className="bg-white border border-gray-100 flex flex-col text-[14px]">
            {/* Row 1 */}
            <div className="grid grid-cols-4">
              <div className="border-r border-b border-gray-100 p-4 col-span-1">
                <div className="text-[#333b47] font-bold mb-4">Payment Account</div>
                <select value={receipt.paymentAccountId} onChange={e => setReceipt({...receipt, paymentAccountId: e.target.value})} className="text-[#4b5563] bg-transparent outline-none w-full border-b border-transparent hover:border-gray-300 focus:border-black leading-tight cursor-pointer">
                  <option value="">-- Select --</option>
                  {paymentAccounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>{acc.accountName} ({acc.bankName || acc.accountType})</option>
                  ))}
                </select>
              </div>
              <div className="border-r border-b border-gray-100 p-4 col-span-1">
                <div className="text-[#333b47] font-bold mb-4">Amount Received</div>
                <div className="flex items-center text-[#4b5563]">
                  <span className="mr-0.5 font-medium text-black">₹</span>
                  <input type="number" value={receipt.amountReceived || ''} onChange={e => setReceipt({...receipt, amountReceived: Number(e.target.value)})} placeholder="0.00" className="font-bold text-black bg-transparent outline-none w-full border-b border-transparent hover:border-gray-300 focus:border-black leading-tight" />
                </div>
              </div>
              <div className="border-r border-b border-gray-100 p-4 col-span-1">
                <div className="text-[#333b47] font-bold mb-4">TDS Amount</div>
                <div className="flex items-center text-[#4b5563]">
                  <span className="mr-0.5 font-medium text-black">₹</span>
                  <input type="number" value={receipt.tdsAmount || ''} onChange={e => setReceipt({...receipt, tdsAmount: Number(e.target.value)})} placeholder="0.00" className="font-bold text-black bg-transparent outline-none w-full border-b border-transparent hover:border-gray-300 focus:border-black leading-tight" />
                </div>
              </div>
              <div className="border-b border-gray-100 p-4 col-span-1">
                <div className="text-[#333b47] font-bold mb-4">Trans. Charges</div>
                <div className="flex items-center text-[#4b5563]">
                  <span className="mr-0.5 font-medium text-black">₹</span>
                  <input type="number" value={receipt.transactionCharges || ''} onChange={e => setReceipt({...receipt, transactionCharges: Number(e.target.value)})} placeholder="0.00" className="font-bold text-black bg-transparent outline-none w-full border-b border-transparent hover:border-gray-300 focus:border-black leading-tight" />
                </div>
              </div>
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-4">
              <div className="border-r border-gray-100 p-4 col-span-3">
                <div className="text-[#333b47] font-bold text-right">Total Settlement Value</div>
              </div>
              <div className="p-4 col-span-1">
                <div className="text-[#333b47] font-bold text-right">₹{totalSettlementValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Settled Invoices Table */}
        <div className="mb-8 relative z-10 print:hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-black uppercase tracking-wider text-sm">Allocate to Invoices</h3>
            <span className={`text-xs font-semibold ${totalAllocated > totalSettlementValue ? 'text-red-600' : 'text-gray-500'}`}>
              Allocated: ₹{totalAllocated.toLocaleString('en-IN')} / ₹{totalSettlementValue.toLocaleString('en-IN')}
            </span>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="py-2 px-3 font-semibold text-[11px] rounded-tl-md text-left">Invoice #</th>
                <th className="py-2 px-3 font-semibold text-[11px] text-right">Due Amount</th>
                <th className="py-2 px-3 font-semibold text-[11px] rounded-tr-md text-right">Allocate Amount</th>
              </tr>
            </thead>
            <tbody>
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-sm text-gray-500 italic bg-gray-50 border-b border-gray-200">
                    No open invoices found for this client.
                  </td>
                </tr>
              ) : (
                allocations.map((alloc, index) => (
                  <tr key={alloc.invoiceId} className="border-b border-gray-200 bg-white align-top hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-3">
                      <span className="text-[12px] font-medium">{alloc.invoiceNumber}</span>
                    </td>
                    <td className="py-2 px-3 text-right text-[12px] text-gray-600 font-medium">
                      ₹{alloc.amountDue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex justify-end items-center text-[12px]">
                        <span className="mr-1">₹</span>
                        <input 
                          type="number" 
                          value={alloc.amountAllocated || ''} 
                          onChange={e => updateAllocation(index, Number(e.target.value))} 
                          className="text-[12px] font-bold leading-tight bg-transparent outline-none w-24 text-right border-b border-transparent hover:border-gray-300 focus:border-black"
                          max={Math.min(alloc.amountDue, totalSettlementValue)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Invoice Allocation Display (Print Only) */}
        <div className="mb-8 relative z-10 hidden print:block">
           <h3 className="font-bold text-black uppercase tracking-wider text-sm mb-4">Settled Against Invoices</h3>
           <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="py-2 px-3 font-semibold text-[11px] rounded-tl-md text-left">Invoice #</th>
                <th className="py-2 px-3 font-semibold text-[11px] rounded-tr-md text-right">Allocated Amount</th>
              </tr>
            </thead>
            <tbody>
              {allocations.filter((a: any) => a.amountAllocated > 0).map((alloc: any) => (
                <tr key={alloc.invoiceId} className="border-b border-gray-200 bg-white align-top">
                    <td className="py-2 px-3 text-[12px] font-medium">{alloc.invoiceNumber}</td>
                    <td className="py-2 px-3 text-[12px] text-right font-medium">₹{alloc.amountAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {allocations.filter((a: any) => a.amountAllocated > 0).length === 0 && (
                <tr><td colSpan={2} className="py-2 px-3 text-[12px] text-gray-500">Unallocated Payment</td></tr>
              )}
            </tbody>
           </table>
        </div>

        {/* Bottom Totals */}
        <div className="flex justify-between items-start mt-auto relative z-10">
          <div className="text-gray-500 w-[50%]">
            <div className="mb-2 text-[13px] font-semibold text-gray-900">Total amount (in words)</div>
            <div className="font-semibold text-gray-700 text-[13px] uppercase">
              {/* Optional: Add number to words package later */}
              INR {totalSettlementValue.toLocaleString('en-IN')} ONLY
            </div>
          </div>
          
          <div className="w-[45%]">
            <div className="grid grid-cols-[1fr_auto] gap-y-3 text-[14px] text-gray-600 mb-4">
              <div>Amount Received</div>
              <div className="text-gray-900 font-medium text-right">₹{(receipt.amountReceived || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              {tds > 0 && (
                <>
                  <div>TDS Dedcuted</div>
                  <div className="text-gray-900 font-medium text-right">₹{tds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </>
              )}
              {charges > 0 && (
                <>
                  <div>Transaction Charges</div>
                  <div className="text-gray-900 font-medium text-right">₹{charges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </>
              )}
              <div>Settled Against Invoices</div>
              <div className="text-gray-900 font-medium text-right">₹{totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            
            <div className="border-t-2 border-b-2 border-black py-3 grid grid-cols-[1fr_auto]">
              <div className="font-bold text-[18px] text-black">Total Settlement Value</div>
              <div className="font-bold text-[18px] text-black text-right">₹{totalSettlementValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>

            <div className="mt-8 flex justify-end">
              <div className="text-center">
                <div className="h-16 flex items-end justify-center mb-1">
                   <img src="/sign.png" alt="Signature" className="h-16 object-contain" />
                </div>
                <div className="text-xs text-gray-800 font-bold border-t border-gray-300 pt-2 px-4 mt-2">Authorised Signatory</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-800 w-full mb-4">
          This is an electronically generated document, no signature is required.
        </div>

      </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          input, textarea, select { border: none !important; padding: 0 !important; margin: 0 !important; -webkit-appearance: none; -moz-appearance: none; appearance: none; }
        }
      `}</style>
    </div>
  );
}
