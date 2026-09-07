const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

// Insert isSubSupplier and ownsSupplierData helpers
const helperInsert = `  function isSubSupplier() {
    return request.auth.token.role == 'SUB_SUPPLIER' || request.auth.token.role == 'sub_supplier';
  }
  function ownsSupplierData(supplierId) {
    return (isSupplier() && request.auth.uid == supplierId) ||
           (isSubSupplier() && request.auth.token.parentSupplierId == supplierId);
  }
`;
rules = rules.replace("  function isDriver() {", helperInsert + "  function isDriver() {");

// Replace all instances of `isSupplier() && request.resource.data.supplierId == request.auth.uid`
// or `isSupplier() && resource.data.supplierId == request.auth.uid`
// with `ownsSupplierData(request.resource.data.supplierId)` or `ownsSupplierData(resource.data.supplierId)`

rules = rules.replace(/isSupplier\(\) && request\.auth\.uid == supplierId/g, "ownsSupplierData(supplierId)");
rules = rules.replace(/isSupplier\(\) && request\.resource\.data\.supplierId == request\.auth\.uid/g, "ownsSupplierData(request.resource.data.supplierId)");
rules = rules.replace(/isSupplier\(\) && resource\.data\.supplierId == request\.auth\.uid/g, "ownsSupplierData(resource.data.supplierId)");

// Also chats collection:
rules = rules.replace(/resource\.data\.supplierId == request\.auth\.uid/g, "ownsSupplierData(resource.data.supplierId)");
rules = rules.replace(/get\(\/databases\/\$\(database\)\/documents\/chats\/\$\(chatId\)\)\.data\.supplierId == request\.auth\.uid/g, "ownsSupplierData(get(/databases/$(database)/documents/chats/$(chatId)).data.supplierId)");

fs.writeFileSync('firestore.rules', rules);
