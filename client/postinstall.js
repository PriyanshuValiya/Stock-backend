// This script helps fix Rollup installation issues on Vercel deployment
const fs = require('fs');
const path = require('path');

// Path to the problematic Rollup module
const rollupNativePath = path.join(
  process.cwd(),
  'node_modules',
  'rollup',
  'dist',
  'native.js'
);

// Check if the file exists
if (fs.existsSync(rollupNativePath)) {
  console.log('Patching Rollup native.js to fix Vercel deployment issue...');
  
  try {
    // Read the original file
    let content = fs.readFileSync(rollupNativePath, 'utf8');
    
    // Replace the problematic code that tries to load the native module
    // This will make Rollup fall back to the JavaScript implementation
    // which is more compatible across different environments
    content = content.replace(
      /try\s*{\s*.*?requireWithFriendlyError.*?\s*}\s*catch\s*\(e\)\s*{/s,
      'try { throw new Error("Forced fallback to JavaScript implementation"); } catch (e) {'
    );
    
    // Write the modified content back
    fs.writeFileSync(rollupNativePath, content);
    console.log('Successfully patched Rollup for Vercel deployment');
  } catch (error) {
    console.error('Failed to patch Rollup:', error);
  }
} else {
  console.log('Rollup native.js not found, skipping patch');
}
