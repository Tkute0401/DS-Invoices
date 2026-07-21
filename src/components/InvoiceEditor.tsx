'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import { numberToIndianWords } from '@/lib/utils';

type Client = {
  id: string;
  name: string;
  billingAddress?: string;
  gstin?: string;
  pan?: string;
  email?: string;
  phone?: string;
};

type Item = {
  id: string;
  name: string;
  gstRate: number;
  price: number;
};

export default function InvoiceEditor({ invoiceId }: { invoiceId?: string }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);
  
  const [invoiceNumber, setInvoiceNumber] = useState('B000001');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  // Fetched data
  const [clients, setClients] = useState<Client[]>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  
  // Selected Client State
  const [selectedClient, setSelectedClient] = useState<{ value: string, label: string, isNew: boolean } | null>(null);
  
  // Invoice To details (auto-populated when existing client is selected, or manually filled)
  const [invoiceTo, setInvoiceTo] = useState({
    id: '', // Empty if new
    name: '',
    address: '',
    gstin: '',
    pan: '',
    email: '',
    phone: ''
  });

  const [businessProfile, setBusinessProfile] = useState<any>(null);

  const [invoiceBy, setInvoiceBy] = useState({
    name: '',
    address: '',
    gstin: '',
    pan: '',
    email: '',
    phone: ''
  });

  const [items, setItems] = useState([
    {
      id: Date.now().toString(),
      name: '',
      gstRate: 18,
      quantity: 1,
      rate: 0,
      discount: 0,
      itemId: '' // If selected from existing
    }
  ]);

  const [additionalCharges, setAdditionalCharges] = useState(0);

  // Tax Settings
  const [taxType, setTaxType] = useState('IGST'); // IGST or CGST_SGST
  const [countryOfSupply, setCountryOfSupply] = useState('India');
  const [placeOfSupply, setPlaceOfSupply] = useState('Maharashtra (27)');

  useEffect(() => {
    const initData = async () => {
      const [bpRes, clRes, itemRes] = await Promise.all([
        fetch('/api/business-profile').then(res => res.json()),
        fetch('/api/clients').then(res => res.json()),
        fetch('/api/items').then(res => res.json())
      ]);

      setBusinessProfile(bpRes);
      if (bpRes && !bpRes.error) {
        setInvoiceBy({
          name: bpRes.name || '',
          address: bpRes.address || '',
          gstin: bpRes.gstin || '',
          pan: bpRes.pan || '',
          email: bpRes.email || '',
          phone: bpRes.phone || ''
        });
      }
      setClients(clRes);
      setAvailableItems(itemRes);

      if (invoiceId) {
        try {
          const invData = await fetch(`/api/invoices/${invoiceId}`).then(res => res.json());
          if (invData && !invData.error) {
            setInvoiceNumber(invData.invoiceNumber);
            setDate(new Date(invData.date).toISOString().split('T')[0]);
            setDueDate(new Date(invData.dueDate).toISOString().split('T')[0]);
            setAdditionalCharges(invData.additionalCharges || 0);
            setTaxType(invData.taxType || 'GST');
            setCountryOfSupply(invData.countryOfSupply || 'India');
            setPlaceOfSupply(invData.placeOfSupply || '');
            
            if (invData.client) {
              setSelectedClient({ value: invData.client.id, label: invData.client.name, isNew: false });
              setInvoiceTo({
                id: invData.client.id,
                name: invData.client.name,
                address: invData.client.billingAddress || '',
                gstin: invData.client.gstin || '',
                pan: invData.client.pan || '',
                email: invData.client.email || '',
                phone: invData.client.phone || ''
              });
            }

            if (invData.lineItems && invData.lineItems.length > 0) {
              setItems(invData.lineItems.map((item: any) => ({
                id: item.id || Date.now().toString() + Math.random(),
                name: item.itemName,
                gstRate: item.gstRate,
                quantity: item.quantity,
                rate: item.rate,
                discount: item.discount,
                itemId: item.itemId || ''
              })));
            }
          }
        } catch (error) {
          console.error("Error fetching invoice:", error);
        }
      }
    };
    initData();
  }, [invoiceId]);

  // Format clients for react-select
  const clientOptions = clients.map((c: any) => ({ value: c.id, label: c.name, isNew: false }));

  const itemOptions = availableItems.map((i: any) => ({
    value: i.id,
    label: i.name,
    itemData: i
  }));

  const handleClientChange = (newValue: any, actionMeta: any) => {
    setSelectedClient(newValue);
    if (!newValue) {
      setInvoiceTo({ id: '', name: '', address: '', gstin: '', pan: '', email: '', phone: '' });
      return;
    }

    if (newValue.__isNew__) {
      setInvoiceTo({
        id: '',
        name: newValue.value,
        address: '',
        gstin: '',
        pan: '',
        email: '',
        phone: ''
      });
    } else {
      const client = clients.find((c: any) => c.id === newValue.value);
      if (client) {
        setInvoiceTo({
          id: client.id,
          name: client.name,
          address: client.billingAddress || '',
          gstin: client.gstin || '',
          pan: client.pan || '',
          email: client.email || '',
          phone: client.phone || ''
        });
        
        // Auto-detect Place of Supply based on GSTIN (First 2 digits)
        // If it starts with 27 (Maharashtra, same as invoiceBy), then CGST_SGST, else IGST
        if (client.gstin && client.gstin.startsWith('27')) {
          setTaxType('CGST_SGST');
        } else {
          setTaxType('IGST');
        }
      }
    }
  };

  const handleItemChange = (index: number, newValue: any) => {
    const newItems = [...items];
    if (!newValue) {
      newItems[index] = { ...newItems[index], name: '', itemId: '' };
    } else if (newValue.__isNew__) {
      newItems[index] = { ...newItems[index], name: newValue.value, itemId: '' };
    } else {
      const iData = newValue.itemData;
      newItems[index] = { 
        ...newItems[index], 
        name: iData.name, 
        itemId: iData.id,
        rate: iData.price || 0,
        gstRate: iData.gstRate || 0
      };
    }
    setItems(newItems);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let discountTotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let grandTotal = 0;

    items.forEach((item: any) => {
      const baseAmount = item.quantity * item.rate;
      const itemDiscount = item.discount || 0;
      const amount = baseAmount - itemDiscount;
      
      subtotal += baseAmount;
      discountTotal += itemDiscount;
      
      if (taxType === 'CGST_SGST') {
        const cgst = (amount * (item.gstRate / 2)) / 100;
        const sgst = (amount * (item.gstRate / 2)) / 100;
        totalCgst += cgst;
        totalSgst += sgst;
        grandTotal += amount + cgst + sgst;
      } else {
        const igst = (amount * item.gstRate) / 100;
        totalIgst += igst;
        grandTotal += amount + igst;
      }
    });

    grandTotal += additionalCharges || 0;

    return { subtotal, discountTotal, totalCgst, totalSgst, totalIgst, grandTotal };
  };

  const totals = calculateTotals();
  const amountPaid = 0; 
  const dueAmount = totals.grandTotal - amountPaid;
  const paymentStatus = amountPaid >= totals.grandTotal ? 'PAID' : (amountPaid > 0 ? 'PART PAID' : 'UNPAID');
  const paymentStatusColor = paymentStatus === 'PAID' ? 'bg-green-500' : (paymentStatus === 'PART PAID' ? 'bg-[#3b82f6]' : 'bg-black');

  const handlePrint = async () => {
    setIsGeneratingPdf(true);
    setTimeout(async () => {
      if (!printAreaRef.current) return;
      const elements = printAreaRef.current.querySelectorAll('input, textarea');
      elements.forEach((el) => {
        if (el instanceof HTMLInputElement) {
          el.setAttribute('value', el.value);
        } else if (el instanceof HTMLTextAreaElement) {
          el.innerHTML = el.value;
        }
      });
      const html = printAreaRef.current.innerHTML;
        
      try {
        const res = await fetch('/api/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html })
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Invoice_${invoiceNumber}.pdf`;
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
    if (!invoiceTo.name) {
      alert("Please select or enter a client.");
      return;
    }
    
    setIsSaving(true);
    try {
      let clientId = invoiceTo.id;
      
      // If new client, save it first
      if (!clientId) {
        const clientRes = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: invoiceTo.name,
            billingAddress: invoiceTo.address,
            gstin: invoiceTo.gstin,
            pan: invoiceTo.pan,
            email: invoiceTo.email,
            phone: invoiceTo.phone
          })
        });
        const client = await clientRes.json();
        clientId = client.id;
      }

      // Save the invoice
      const url = invoiceId ? `/api/invoices/${invoiceId}` : '/api/invoices';
      const method = invoiceId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId,
          invoiceNumber,
          date,
          dueDate,
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          additionalCharges: additionalCharges || 0,
          taxTotal: taxType === 'IGST' ? totals.totalIgst : totals.totalCgst + totals.totalSgst,
          grandTotal: totals.grandTotal,
          amountPaid: amountPaid,
          amountDue: dueAmount,
          gstType: taxType,
          countryOfSupply: countryOfSupply,
          placeOfSupply: placeOfSupply,
          lineItems: items.map((item: any) => {
            const baseAmount = item.quantity * item.rate;
            const itemDiscount = item.discount || 0;
            const amount = baseAmount - itemDiscount;
            let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
            if (taxType === 'CGST_SGST') {
              cgstAmount = (amount * (item.gstRate / 2)) / 100;
              sgstAmount = (amount * (item.gstRate / 2)) / 100;
            } else {
              igstAmount = (amount * item.gstRate) / 100;
            }
            return {
              itemId: item.itemId || null,
              itemName: item.name,
              quantity: item.quantity,
              rate: item.rate,
              discount: item.discount || 0,
              gstRate: item.gstRate,
              cgstAmount,
              sgstAmount,
              igstAmount,
              totalAmount: amount + cgstAmount + sgstAmount + igstAmount
            }
          })
        })
      });

      const data = await res.json();
      if (res.ok && !data.error) {
        alert('Invoice saved successfully!');
      } else {
        alert('Failed to save invoice: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error saving invoice');
    }
    setIsSaving(false);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', gstRate: 18, quantity: 1, rate: 0, discount: 0, itemId: '' }]);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      
      {/* Editor Controls */}
      <div className="w-full max-w-[1050px] mb-4 bg-white p-4 rounded shadow print:hidden flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-700">Tax Type</label>
            <select value={taxType} onChange={(e) => setTaxType(e.target.value)} className="border border-gray-300 rounded p-1 text-sm bg-white">
              <option value="IGST">IGST (Inter-state)</option>
              <option value="CGST_SGST">CGST/SGST (Intra-state)</option>
            </select>
          </div>
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
        <div id="print-area" ref={printAreaRef} className="relative w-full min-w-[800px] max-w-[1050px] min-h-[290mm] bg-white shadow-lg print:shadow-none print:max-w-none print:w-[210mm] p-8 sm:p-12 text-sm text-gray-800 font-sans mx-auto z-0 overflow-x-hidden">
          
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-[-1]">
          <img src="/watermark.png" alt="Watermark" className="w-[70%]" />
        </div>
        
        {/* Header Section */}
        <div className="relative w-[calc(100%+6rem)] border-t-8 border-black -mt-12 -ml-12 px-12 pt-12 pb-6 mb-8 flex flex-col">
          <div className="flex justify-between items-start mb-5">
            <div className="w-1/3 mt-[60px]">
              <img src="/header-logo.png" alt="Company Logo" className="w-32 h-auto object-contain" />
            </div>
            <div className="w-1/3 flex justify-center">
              <h1 className="text-4xl text-black font-black tracking-widest uppercase mt-0">INVOICE</h1>
            </div>
            <div className="w-1/3 flex justify-end">
              <div className={`${paymentStatusColor} text-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded mt-[60px] shadow-sm`}>{paymentStatus}</div>
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
            <div className="w-1/2 flex flex-col items-end gap-1 text-[13px] -mt-[100px]">
              <div className="flex justify-between w-48 border-b border-gray-200 pb-1">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-xs mt-1">Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="font-bold text-black bg-transparent text-right outline-none max-w-[120px]" />
              </div>
              <div className="flex justify-between w-48 border-b border-gray-200 pb-1">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-xs mt-1">Due Date</span>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="font-bold text-black bg-transparent text-right outline-none max-w-[120px]" />
              </div>
              <div className="flex justify-between w-48 border-b border-gray-200 pb-1">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-xs mt-1">Invoice No</span>
                <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="font-bold text-black bg-transparent text-right outline-none w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Billed By / To Section */}
        <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
          <div className="bg-gray-50 border-l-4 border-black p-5 h-full">
            <h2 className="text-black font-bold uppercase tracking-wider text-xs mb-3">Invoice By</h2>
            <input value={invoiceBy.name} onChange={e => setInvoiceBy({ ...invoiceBy, name: e.target.value })} className="font-bold mb-1 text-black text-[15px] bg-transparent outline-none w-full border-b border-transparent hover:border-gray-300 focus:border-black" />
            <textarea value={invoiceBy.address} onChange={e => { setInvoiceBy({ ...invoiceBy, address: e.target.value }); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }} className="w-full bg-transparent outline-none resize-none text-gray-600 mb-4 leading-relaxed text-[13px] border-b border-transparent hover:border-gray-300 focus:border-black overflow-hidden" rows={2} />
            <div className="grid grid-cols-[50px_1fr] gap-x-2 gap-y-1 text-gray-800 text-[13px]">
              <span className="font-semibold text-gray-500 uppercase text-[11px] tracking-wider mt-1">GSTIN</span>
              <input value={invoiceBy.gstin} onChange={e => setInvoiceBy({ ...invoiceBy, gstin: e.target.value })} className="font-medium bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black w-full" />
              <span className="font-semibold text-gray-500 uppercase text-[11px] tracking-wider mt-1">PAN</span>
              <input value={invoiceBy.pan} onChange={e => setInvoiceBy({ ...invoiceBy, pan: e.target.value })} className="font-medium bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black w-full" />
              <span className="font-semibold text-gray-500 uppercase text-[11px] tracking-wider mt-1">Email</span>
              <input value={invoiceBy.email} onChange={e => setInvoiceBy({ ...invoiceBy, email: e.target.value })} placeholder="Email" className="font-medium bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black w-full" />
              <span className="font-semibold text-gray-500 uppercase text-[11px] tracking-wider mt-1">Phone</span>
              <input value={invoiceBy.phone} onChange={e => setInvoiceBy({ ...invoiceBy, phone: e.target.value })} placeholder="Phone" className="font-medium bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black w-full" />
            </div>
          </div>

          <div className="bg-gray-50 border-l-4 border-black p-5 h-full relative group">
            <h2 className="text-black font-bold uppercase tracking-wider text-xs mb-3">Invoice To</h2>
            
            {/* Client Selector (Visible only in UI, not in print) */}
            <div className="print:hidden mb-3 absolute top-3 right-3 w-48 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <CreatableSelect 
                instanceId="invoice-client-select"
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

            <input value={invoiceTo.name} onChange={e => setInvoiceTo({ ...invoiceTo, name: e.target.value })} placeholder="Client Name" className="font-bold mb-1 text-black text-[15px] bg-transparent outline-none w-full border-b border-transparent hover:border-gray-300 focus:border-black" />
            <textarea value={invoiceTo.address} onChange={e => { setInvoiceTo({ ...invoiceTo, address: e.target.value }); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }} placeholder="Client Address" className="w-full bg-transparent outline-none resize-none text-gray-600 mb-4 leading-relaxed text-[13px] border-b border-transparent hover:border-gray-300 focus:border-black overflow-hidden" rows={2} />
            <div className="grid grid-cols-[50px_1fr] gap-x-2 gap-y-1 text-gray-800 text-[13px]">
              <span className="font-semibold text-gray-500 uppercase text-[11px] tracking-wider mt-1">GSTIN</span>
              <input value={invoiceTo.gstin} onChange={e => setInvoiceTo({ ...invoiceTo, gstin: e.target.value })} placeholder="GSTIN" className="font-medium bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black w-full" />
              <span className="font-semibold text-gray-500 uppercase text-[11px] tracking-wider mt-1">PAN</span>
              <input value={invoiceTo.pan} onChange={e => setInvoiceTo({ ...invoiceTo, pan: e.target.value })} placeholder="PAN" className="font-medium bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black w-full" />
              <span className="font-semibold text-gray-500 uppercase text-[11px] tracking-wider mt-1">Email</span>
              <input value={invoiceTo.email} onChange={e => setInvoiceTo({ ...invoiceTo, email: e.target.value })} placeholder="Email" className="font-medium bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black w-full" />
              <span className="font-semibold text-gray-500 uppercase text-[11px] tracking-wider mt-1">Phone</span>
              <input value={invoiceTo.phone} onChange={e => setInvoiceTo({ ...invoiceTo, phone: e.target.value })} placeholder="Phone" className="font-medium bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black w-full" />
            </div>
          </div>
        </div>

        {/* Supply Details */}
        <div className="flex justify-between items-center mb-2 px-4 text-[11px] font-semibold text-black relative z-10">
          <div className="flex items-center">
            <span className="text-gray-900 font-bold">Country of Supply:</span>
            <input value={countryOfSupply} onChange={e => setCountryOfSupply(e.target.value)} className="bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black ml-1 font-medium w-32" />
          </div>
          <div className="flex items-center">
            <span className="text-gray-900 font-bold">Place of Supply:</span>
            <input value={placeOfSupply} onChange={e => setPlaceOfSupply(e.target.value)} className="bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black ml-1 font-medium w-40 text-right" />
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6 relative z-10">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-black text-white">
                <th className="py-2 px-3 font-semibold text-[11px] rounded-tl-md w-[35%] text-left">Item</th>
                <th className="py-2 px-2 font-semibold text-[11px] text-center w-[7%] whitespace-nowrap">GST Rate</th>
                <th className="py-2 px-2 font-semibold text-[11px] text-center w-[6%]">Qty</th>
                <th className="py-2 px-2 font-semibold text-[11px] text-center w-[12%]">Rate</th>
                <th className="py-2 px-2 font-semibold text-[11px] text-center w-[10%]">Discount</th>
                <th className="py-2 px-2 font-semibold text-[11px] text-center w-[12%]">Taxable</th>
                {taxType === 'CGST_SGST' ? (
                  <>
                    <th className="py-2 px-2 font-semibold text-[11px] text-center w-[7%]">CGST</th>
                    <th className="py-2 px-2 font-semibold text-[11px] text-center w-[7%]">SGST</th>
                  </>
                ) : (
                  <th className="py-2 px-2 font-semibold text-[11px] text-center w-[14%]">IGST</th>
                )}
                <th className="py-2 px-3 font-semibold text-[11px] text-center rounded-tr-md w-[14%]">Total</th>
                <th className="print:hidden w-6"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const baseAmount = item.quantity * item.rate;
                const itemDiscount = item.discount || 0;
                const amount = baseAmount - itemDiscount;
                let cgst = 0, sgst = 0, igst = 0, total = 0;
                
                if (taxType === 'CGST_SGST') {
                  cgst = (amount * (item.gstRate / 2)) / 100;
                  sgst = (amount * (item.gstRate / 2)) / 100;
                  total = amount + cgst + sgst;
                } else {
                  igst = (amount * item.gstRate) / 100;
                  total = amount + igst;
                }

                return (
                  <tr key={item.id} className="border-b border-gray-200 bg-white align-top hover:bg-gray-50 transition-colors group/row">
                    <td className="py-2 px-3 relative">
                      <div className="flex space-x-2 items-start">
                        <span className="text-gray-500 text-[12px] mt-1">{index + 1}.</span>
                        <div className="w-full relative">
                          <textarea
                            value={item.name}
                            onChange={e => {
                              updateItem(index, 'name', e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            className="bg-transparent outline-none w-full border-b border-transparent hover:border-gray-300 focus:border-black text-[11px] resize-none overflow-hidden min-h-[20px] pt-1 leading-tight"
                            placeholder="Item Name"
                            rows={1}
                          />
                          <div className="print:hidden absolute top-[-10px] right-0 w-48 opacity-0 group-hover/row:opacity-100 transition-opacity z-30">
                             <CreatableSelect
                                instanceId={`item-select-${index}`}
                                isClearable
                                placeholder="Search Items..."
                                options={itemOptions}
                                value={item.itemId ? itemOptions.find((o: any) => o.value === item.itemId) : (item.name ? { label: item.name, value: item.name, __isNew__: true } : null)}
                                onChange={(v) => handleItemChange(index, v)}
                                styles={{
                                  control: (base) => ({ ...base, fontSize: '10px', minHeight: '24px' }),
                                  menu: (base) => ({ ...base, fontSize: '10px', zIndex: 60 })
                                }}
                             />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex justify-center items-center text-[11px]">
                        <input type="number" value={item.gstRate} onChange={e => updateItem(index, 'gstRate', Number(e.target.value))} className="bg-transparent outline-none w-6 text-center border-b border-transparent hover:border-gray-300 focus:border-black text-[11px] leading-tight" />%
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex justify-center items-center text-[11px]">
                        <input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', Number(e.target.value))} className="bg-transparent outline-none w-full text-center border-b border-transparent hover:border-gray-300 focus:border-black text-[11px] leading-tight" />
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex justify-center text-[11px]">
                        ₹<input type="number" value={item.rate} onChange={e => updateItem(index, 'rate', Number(e.target.value))} className="bg-transparent outline-none w-14 text-center border-b border-transparent hover:border-gray-300 focus:border-black ml-1 text-[11px] leading-tight" />
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex justify-center text-[11px]">
                        ₹<input type="number" value={item.discount} onChange={e => updateItem(index, 'discount', Number(e.target.value))} className="bg-transparent outline-none w-14 text-center border-b border-transparent hover:border-gray-300 focus:border-black ml-1 text-[11px] leading-tight" />
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center text-gray-600 text-[11px]">₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    
                    {taxType === 'CGST_SGST' ? (
                      <>
                        <td className="py-2 px-2 text-center text-gray-600 text-[11px]">₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-2 text-center text-gray-600 text-[11px]">₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </>
                    ) : (
                      <td className="py-2 px-2 text-center text-gray-600 text-[11px]">₹{igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    )}
                    
                    <td className="py-2 px-3 text-center text-gray-800 font-medium text-[11px]">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-1 print:hidden text-center">
                      <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 font-bold">×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button onClick={addItem} className="mt-4 text-sm font-semibold text-black hover:underline print:hidden">+ Add Line Item</button>
        </div>
        
        {/* Total in Words */}
        <div className="mb-6 relative z-10 text-[11px] font-bold text-black uppercase tracking-wide">
          Total (in words) : {numberToIndianWords(totals.grandTotal)}
        </div>

        {/* Bottom Section */}
        <div className="flex justify-between items-start relative z-10">

          {/* Column 1: Bank Details & Terms */}
          <div className="w-[35%] pr-4 flex flex-col">
            <div className="bg-gray-50 border-l-4 border-black p-4 mb-4 text-[13px]">
              <h3 className="text-black font-bold uppercase tracking-wider text-[11px] mb-3">Bank Details</h3>
              {businessProfile ? (
                <div className="grid grid-cols-[100px_1fr] gap-y-2 text-gray-800">
                  <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Account Name</span> <span className="font-medium">{businessProfile.bankAccountName || '-'}</span>
                  <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Account No</span> <span className="font-medium">{businessProfile.bankAccountNumber || '-'}</span>
                  <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider">IFSC</span> <span className="font-medium">{businessProfile.bankIfsc || '-'}</span>
                  <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Acc Type</span> <span className="font-medium">{businessProfile.bankType || '-'}</span>
                  <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Bank</span> <span className="font-medium leading-tight">{businessProfile.bankName || '-'}</span>
                </div>
              ) : (
                <div className="text-gray-500 text-xs">Loading bank details...</div>
              )}
            </div>

            <div className="text-black font-semibold cursor-pointer hover:underline text-[13px] print:hidden">
              Terms and Conditions
            </div>
          </div>

          {/* Column 2: QR Code */}
          <div className="w-[25%] flex flex-col items-center pt-2">
            {businessProfile?.upiId && (
              <>
                <div className="text-black text-[12px] mb-1 font-bold uppercase tracking-widest text-center">Scan to pay via UPI</div>
                <div className="text-[10px] text-gray-500 mb-2 leading-tight text-center">Maximum of 1 lakh can<br />be transferred via upi in a<br />single day</div>
                <img src="/qr.png" alt="QR Code" className="w-24 h-24 object-contain mb-1" />
                <div className="text-[11px] text-gray-800 font-medium mt-1">{businessProfile.upiId}</div>
              </>
            )}
          </div>

          {/* Column 3: Totals & Signature */}
          <div className="w-[35%] flex flex-col">

            <div className="grid grid-cols-2 gap-y-2 text-[13px] mb-3 text-gray-700">
              <div>Amount</div>
              <div className="text-right text-black font-medium">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              
              {totals.discountTotal > 0 && (
                <>
                  <div>Discount</div>
                  <div className="text-right text-black font-medium">-₹{totals.discountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </>
              )}
              
              {taxType === 'CGST_SGST' ? (
                <>
                  <div>CGST</div>
                  <div className="text-right text-black font-medium">₹{totals.totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div>SGST</div>
                  <div className="text-right text-black font-medium">₹{totals.totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </>
              ) : (
                <>
                  <div>IGST</div>
                  <div className="text-right text-black font-medium">₹{totals.totalIgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </>
              )}
              
              <div className="flex items-center text-gray-700">Addt. Charges</div>
              <div className="text-right text-black font-medium flex justify-end items-center">
                 ₹<input type="number" value={additionalCharges} onChange={e => setAdditionalCharges(Number(e.target.value))} className="bg-transparent outline-none w-16 text-right border-b border-transparent hover:border-gray-300 focus:border-black text-[13px] ml-1" />
              </div>
            </div>

            <div className="border-t-2 border-b-2 border-black py-2 mb-3 grid grid-cols-2 items-center">
              <div className="font-bold text-lg text-black">Total (INR)</div>
              <div className="font-bold text-lg text-black text-right">₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-[13px] text-gray-700 mb-8">
              <div>Amount Paid</div>
              <div className="text-right">(₹{amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })})</div>
              <div>Due Amount</div>
              <div className="text-right font-bold text-black text-base">₹{dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>

            <div className="flex flex-col items-end mt-auto">
              <div className="h-16 flex items-end justify-center mb-1">
                <img src="/sign.png" alt="Signature" className="h-16 object-contain" />
              </div>
              <div className="text-xs text-gray-800 font-bold border-t border-gray-300 pt-2 px-4 mt-2">Authorised Signatory</div>
            </div>

          </div>

        </div>

      </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          input, textarea { border: none !important; padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
}
