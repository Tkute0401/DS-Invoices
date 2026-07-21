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
    
    // Railway containers cannot make requests to their own public URL (no hairpin NAT).
    // So we tell Puppeteer to fetch resources directly from the local Next.js server instance.
    const port = process.env.PORT || 3000;
    const origin = `http://localhost:${port}`;

    // Inject Tailwind CDN and base styles to ensure the PDF looks exactly like the web page
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <base href="${origin}/">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; background: white; }
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
          <div class="relative w-[210mm] bg-white text-sm text-gray-800 font-sans mx-auto overflow-x-hidden" style="zoom: 0.96; transform-origin: top center;">
            ${html}
          </div>
        </body>
      </html>
    `;
    await page.setContent(styledHtml, { waitUntil: 'load' });

    // Wait specifically for Tailwind to finish generating styles
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        const check = () => {
          const styles = document.querySelectorAll('style');
          for (let s of Array.from(styles)) {
            // Check if Tailwind has generated its styles by looking for a known class
            if (s.innerHTML.includes('.flex')) {
              resolve();
              return true;
            }
          }
          return false;
        };
        if (check()) return;
        const observer = new MutationObserver(() => {
          if (check()) observer.disconnect();
        });
        observer.observe(document.head, { childList: true, subtree: true });
        // Fallback timeout in case Tailwind fails
        setTimeout(resolve, 5000);
      });
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
