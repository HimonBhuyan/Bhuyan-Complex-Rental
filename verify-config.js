#!/usr/bin/env node

/**
 * Configuration Verification Script
 * Run this to verify your deployment setup before going to production
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Rental Management System - Configuration Verification\n');

// Check if required files exist
const requiredFiles = [
  'server.js',
  'package.json',
  'vite.config.mjs',
  'src/utils/api.js',
  'src/context/RealTimeNotificationContext.jsx'
];

console.log('📁 Checking required files:');
let allFilesExist = true;
for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
}

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Check package.json scripts
console.log('\n📦 Checking package.json scripts:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'start', 'server'];
for (const script of requiredScripts) {
  const exists = packageJson.scripts && packageJson.scripts[script];
  console.log(`  ${exists ? '✅' : '❌'} ${script}: ${exists || 'MISSING'}`);
}

// Check environment files
console.log('\n🔧 Checking environment files:');
const envFiles = ['.env.development', '.env.production', '.env.example'];
for (const file of envFiles) {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '⚠️'} ${file} ${exists ? '' : '(optional)'}`);
}

// Check for hardcoded localhost URLs in key files
console.log('\n🔗 Checking for hardcoded localhost URLs:');
const filesToCheck = [
  'src/context/RealTimeNotificationContext.jsx',
  'src/utils/api.js'
];

let hasHardcodedUrls = false;
for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const hasLocalhost = content.includes('localhost:3001') && !content.includes('// Default to localhost');
    console.log(`  ${hasLocalhost ? '⚠️' : '✅'} ${file} ${hasLocalhost ? '(contains hardcoded localhost)' : ''}`);
    if (hasLocalhost) hasHardcodedUrls = true;
  }
}

// Display current configuration
console.log('\n⚙️ Current Configuration:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('  PORT:', process.env.PORT || '3001');

// Production readiness checklist
console.log('\n📋 Production Readiness Checklist:');
const checks = [
  { name: 'All required files present', status: allFilesExist },
  { name: 'No hardcoded localhost URLs', status: !hasHardcodedUrls },
  { name: 'Package.json has start script', status: packageJson.scripts?.start },
  { name: 'Package.json has build script', status: packageJson.scripts?.build },
  { name: 'Environment template exists', status: fs.existsSync('.env.production') },
];

let allChecksPass = true;
for (const check of checks) {
  console.log(`  ${check.status ? '✅' : '❌'} ${check.name}`);
  if (!check.status) allChecksPass = false;
}

// Final verdict
console.log('\n' + '='.repeat(60));
if (allChecksPass) {
  console.log('🎉 READY FOR DEPLOYMENT!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Push code to GitHub/GitLab');
  console.log('2. Create Render web service');
  console.log('3. Set environment variables on Render');
  console.log('4. Deploy and test');
  console.log('');
  console.log('See DEPLOYMENT_GUIDE.md for detailed instructions.');
} else {
  console.log('⚠️  NOT READY FOR DEPLOYMENT');
  console.log('Please fix the issues above before deploying.');
}
console.log('='.repeat(60));