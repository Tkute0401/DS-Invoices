import puppeteer from 'puppeteer';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { html, styles } = await request.json();
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    const origin = new URL(request.url).origin;

    // Inject the actual Next.js app styles to ensure the PDF looks exactly like the web page
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <base href="${origin}/">
          ${styles || ''}
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; }
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
        <body class="bg-white" style="margin: 0; padding: 0;">
          <div style="width: 210mm; margin: 0 auto; zoom: 0.96; transform-origin: top center;">
            ${html}
          </div>
        </body>
      </html>
    `;
    await page.setContent(styledHtml, { waitUntil: 'load' });

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
