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
    
    // Use the actual request host for the base URL so Puppeteer can reliably fetch images
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    // Inject Tailwind CDN with custom font configuration
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <base href="${origin}/">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  fontFamily: {
                    sans: ['Inter', 'sans-serif'],
                  }
                }
              }
            }
          </script>
          <style>
            body { background: white; -webkit-print-color-adjust: exact; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
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

    // Wait for Tailwind CSS to generate and fonts to load
    await page.evaluate(async () => {
      // Wait for Tailwind to inject its style tag
      await new Promise((resolve) => {
        const check = () => {
          const styles = document.querySelectorAll('style');
          if (styles.length > 1) { 
            resolve(true);
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });
      
      // Wait for web fonts (Inter) to load so we don't get monospace fallback and broken layout
      await document.fonts.ready;
      
      // Additional small delay to ensure rendering completes
      await new Promise(r => setTimeout(r, 500));
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '0', bottom: '0', left: '0' }
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (!type || !id || !['invoice', 'receipt'].includes(type)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    // Set viewport for a4 print
    await page.setViewport({ width: 1050, height: 1485 });

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    // Navigate to the view page
    const url = `${origin}/${type}s/${id}`;
    
    // Wait until network is idle to ensure data is fetched and rendered
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Additional small delay to ensure rendering completes
    await new Promise(r => setTimeout(r, 1500));

    // Inject fonts and styles to fix missing Rupee symbol and calendar icons
    await page.addStyleTag({
      content: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body, #print-area { font-family: 'Inter', sans-serif !important; }
        
        @media print {
          input, textarea, select { 
            border: none !important; 
            resize: none !important; 
            outline: none !important; 
            font-family: inherit !important; 
            background: transparent !important; 
            color: inherit !important;
            -webkit-appearance: none !important;
            appearance: none !important;
          }
          input[type="date"]::-webkit-calendar-picker-indicator { 
            display: none !important; 
          }
          input[type="number"]::-webkit-inner-spin-button, 
          input[type="number"]::-webkit-outer-spin-button { 
            display: none !important; 
          }
          ::placeholder { color: transparent !important; }
        }
      `
    });

    // Freeze inputs to text and wait for fonts
    await page.evaluate(async () => {
      const elements = document.querySelectorAll('input, textarea');
      elements.forEach((el) => {
        if (el instanceof HTMLInputElement) {
          el.setAttribute('value', el.value);
          if (el.type === 'checkbox' || el.type === 'radio') {
             if (el.checked) el.setAttribute('checked', 'checked');
          }
        } else if (el instanceof HTMLTextAreaElement) {
          el.innerHTML = el.value;
        }
      });
      
      // Wait for the Inter font to load completely
      await document.fonts.ready;
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '0', bottom: '0', left: '0' }
    });
    
    await browser.close();
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type}_${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF GET Generation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
