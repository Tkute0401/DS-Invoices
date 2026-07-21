const fs = require('fs');
(async () => {
  try {
    const res = await fetch('https://ds-invoices-production.up.railway.app/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        html: '<h1>Test PDF</h1>', 
        styles: '<style>h1 { color: red; }</style>',
        htmlClasses: ''
      })
    });
    console.log(res.status, res.statusText);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync('test-prod.pdf', Buffer.from(buffer));
    console.log('Saved test-prod.pdf, size:', buffer.byteLength);
  } catch (err) {
    console.error(err);
  }
})();
