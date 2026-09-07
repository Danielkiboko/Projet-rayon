function formatPrivateKey(key) {
  if (!key) return key;
  
  // Remove surrounding quotes if present
  let formattedKey = key;
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.slice(1, -1);
  } else if (formattedKey.startsWith("'") && formattedKey.endsWith("'")) {
    formattedKey = formattedKey.slice(1, -1);
  }

  // Replace literal '\n' strings with actual newlines
  formattedKey = formattedKey.replace(/\\n/g, '\n');

  // If the key is just one single line with spaces instead of newlines (common copy-paste error)
  if (!formattedKey.includes('\n')) {
    const beginHeader = "-----BEGIN PRIVATE KEY-----";
    const endHeader = "-----END PRIVATE KEY-----";
    if (formattedKey.includes(beginHeader) && formattedKey.includes(endHeader)) {
      const body = formattedKey
        .replace(beginHeader, "")
        .replace(endHeader, "")
        .replace(/\s+/g, ""); // remove all whitespaces from the body
      
      // Reconstruct the key with proper newlines
      const match = body.match(/.{1,64}/g);
      if (match) {
        formattedKey = `${beginHeader}\n${match.join('\n')}\n${endHeader}\n`;
      }
    }
  }

  return formattedKey;
}
console.log(formatPrivateKey("-----BEGIN PRIVATE KEY----- MIIC... ABC DEF -----END PRIVATE KEY-----"));
