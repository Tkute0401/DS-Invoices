const fs = require('fs');

async function testPdf() {
  try {
    const res = await fetch('http://localhost:3000/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        html: '<div class="bg-black text-white p-8 font-sans"><h1>Hello World</h1></div>', 
        styles: '<style>.bg-black { background-color: #000; } .text-white { color: #fff; }</style>',
        htmlClasses: ''
      })
    });
    console.log(res.status, res.statusText);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync('test-local.pdf', Buffer.from(buffer));
    console.log('Saved test-local.pdf, size:', buffer.byteLength);
  } catch (err) {
    console.error(err);
  }
}

testPdf();
