fetch("http://localhost:3000/api/makuta", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ supplierId: "0S19vBzZKzLHklyHB81lzH6gKl03" })
}).then(r => r.json()).then(console.log).catch(console.error);
