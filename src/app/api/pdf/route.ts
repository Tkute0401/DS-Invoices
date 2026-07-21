import puppeteer from 'puppeteer';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { html, styles, htmlClasses } = await request.json();
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    // Use the actual request host for the base URL so Puppeteer can reliably fetch CSS and images
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    // Inject the exact styles and HTML classes from the frontend
    const styledHtml = `
      <!DOCTYPE html>
      <html class="${htmlClasses || ''}">
        <head>
          <meta charset="UTF-8">
          <base href="${origin}/">
          ${styles || ''}
          <style>
            body { background: white; -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
            input, textarea, select { 
              border: none !important; 
              resize: none !important; 
              outline: none !important; 
              font-family: inherit; 
              background: transparent !important; 
              color: inherit !important;
              -webkit-appearance: none;
              -moz-appearance: none;
              appearance: none;
            }
            input[type="date"]::-webkit-calendar-picker-indicator { 
              display: none !important; 
              -webkit-appearance: none; 
            }
            input[type="number"]::-webkit-inner-spin-button, 
            input[type="number"]::-webkit-outer-spin-button { 
              -webkit-appearance: none; 
              margin: 0; 
            }
            ::placeholder {
              color: transparent !important;
            }
          </style>
        </head>
        <body class="bg-white">
          <div class="relative w-[210mm] bg-white text-sm text-gray-800 font-sans mx-auto overflow-x-hidden" style="zoom: 0.96; transform-origin: top center;">
            ${html}
          </div>
        </body>
      </html>
    `;
    await page.setContent(styledHtml, { waitUntil: 'load' });

    // Wait for network requests (like fonts and images) to finish loading
    await page.evaluate(async () => {
      // 1. Wait for web fonts (like Geist) to load so we don't get monospace fallback and broken layout
      await document.fonts.ready;
      
      // Additional small delay to ensure rendering completes
      await new Promise(r => setTimeout(r, 500));
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    
    await browser.close();
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="invoice.pdf"',
      },
    });
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
