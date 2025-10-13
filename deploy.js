#!/usr/bin/env node

/**
 * Deployment script for Rental Management System
 * Supports deployment to Netlify, Vercel, and other static hosting services
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🏗️  Building Rental Management System for production...\n');

try {
  // Clean previous build
  if (fs.existsSync('dist')) {
    console.log('🧹 Cleaning previous build...');
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Install dependencies if node_modules doesn't exist
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // Build the project
  console.log('⚡ Building project...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!\n');

  // Check if build was successful
  if (!fs.existsSync('dist')) {
    throw new Error('Build failed - dist directory not found');
  }

  console.log('📊 Build Statistics:');
  const distStats = fs.readdirSync('dist');
  distStats.forEach(file => {
    const filePath = path.join('dist', file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`   ${file}: ${sizeKB} KB`);
  });

  console.log('\n🚀 Deployment Options:');
  console.log('');
  console.log('1. Netlify:');
  console.log('   - Drag and drop the "dist" folder to netlify.com/deploy');
  console.log('   - Or use: netlify deploy --prod --dir=dist');
  console.log('');
  console.log('2. Vercel:');
  console.log('   - Use: vercel --prod');
  console.log('');
  console.log('3. GitHub Pages:');
  console.log('   - Push to GitHub and enable Pages with "dist" folder');
  console.log('');
  console.log('4. Any Static Host:');
  console.log('   - Upload contents of "dist" folder to your web server');
  console.log('');

  console.log('✨ Your Rental Management System is ready for deployment!');
  console.log('');
  console.log('Demo Credentials:');
  console.log('Tenant: john.doe / tenant123 (Room 101)');
  console.log('Tenant: jane.smith / tenant123 (Room 202)');
  console.log('Owner: owner / owner123');
  console.log('');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}