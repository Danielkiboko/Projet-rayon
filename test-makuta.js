fetch("http://localhost:3000/api/makuta", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ supplierId: "test-supplier-id" })
}).then(r => r.json()).then(console.log).catch(console.error);
