const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const moves = [
  { from: 'components/ui', to: 'modules/shared/components/ui' },
  { from: 'components/brand', to: 'modules/shared/components/brand' },
  { from: 'components/charts', to: 'modules/shared/components/charts' },
  { from: 'components/shared', to: 'modules/shared/components/shared' },
  { from: 'components/layouts', to: 'modules/shared/components/layouts' },
  { from: 'components/notifications', to: 'modules/shared/components/notifications' },
  { from: 'components/products', to: 'modules/shared/components/products' },
  { from: 'components/properties', to: 'modules/shared/components/properties' },
  { from: 'components/invoices', to: 'modules/shared/components/invoices' },
  { from: 'components/hotels', to: 'modules/shared/components/hotels' },
  { from: 'components/reviews', to: 'modules/shared/components/reviews' },
  
  { from: 'components/dashboards', to: 'modules/supplier/components/dashboards' },
  { from: 'components/ProfileUpdateModal.tsx', to: 'modules/supplier/components/ProfileUpdateModal.tsx' },
  { from: 'components/ClientChatsWidget.tsx', to: 'modules/supplier/components/ClientChatsWidget.tsx' },

  { from: 'components/home', to: 'modules/client/components/home' },
  { from: 'components/rayon', to: 'modules/client/components/rayon' },
  { from: 'components/cart', to: 'modules/client/components/cart' },
  { from: 'components/DirectBuyModal.tsx', to: 'modules/client/components/DirectBuyModal.tsx' },
  { from: 'components/ChatBox.tsx', to: 'modules/client/components/ChatBox.tsx' },
  { from: 'components/ImmoContactModal.tsx', to: 'modules/client/components/ImmoContactModal.tsx' },
  { from: 'components/TrackingMap.tsx', to: 'modules/client/components/TrackingMap.tsx' },

  { from: 'components/CurrencySelector.tsx', to: 'modules/shared/components/CurrencySelector.tsx' },
  { from: 'components/ThemeProvider.tsx', to: 'modules/shared/components/ThemeProvider.tsx' },
  { from: 'components/OptimizedImage.tsx', to: 'modules/shared/components/OptimizedImage.tsx' },
  { from: 'components/Footer.tsx', to: 'modules/shared/components/Footer.tsx' },
  { from: 'components/GlobalChatbot.tsx', to: 'modules/shared/components/GlobalChatbot.tsx' }
];

// 1. Move files
console.log('--- MOVING FILES ---');
for (const move of moves) {
  const fromPath = path.join(srcDir, move.from);
  const toPath = path.join(srcDir, move.to);
  if (fs.existsSync(fromPath)) {
    // Ensure parent dir exists
    fs.mkdirSync(path.dirname(toPath), { recursive: true });
    fs.renameSync(fromPath, toPath);
    console.log(`Moved: ${move.from} -> ${move.to}`);
  } else {
    console.log(`Not found (already moved?): ${move.from}`);
  }
}

// 2. Update imports
console.log('--- UPDATING IMPORTS ---');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  for (const move of moves) {
    const fromImport = `@/${move.from.replace('.tsx', '')}`;
    const toImport = `@/${move.to.replace('.tsx', '')}`;
    
    // Replace all occurrences
    const regex = new RegExp(fromImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (regex.test(content)) {
      content = content.replace(regex, toImport);
      updated = true;
    }
  }

  // Handle generic @/components/ imports that might have been missed if they reference subfiles
  // Since we mapped the folders, anything like @/components/ui/Skeleton is mapped correctly by the folder rule.
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      updateFile(fullPath);
    }
  }
}

walkDir(srcDir);
console.log('--- DONE ---');
