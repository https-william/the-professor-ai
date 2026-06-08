const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiDir = path.join(__dirname, 'src', 'app', 'api');
const apiBackupDir = path.join(__dirname, 'api-backup');

const authDir = path.join(__dirname, 'src', 'app', 'auth');
const authBackupDir = path.join(__dirname, 'auth-backup');

const isTauriBuild = process.env.NEXT_PUBLIC_TAURI === "1" || process.env.TAURI_ENV_PLATFORM !== undefined;

let apiRenamed = false;
let authRenamed = false;

try {
  if (isTauriBuild) {
    const nextDir = path.join(__dirname, '.next');
    if (fs.existsSync(nextDir)) {
      console.log('Tauri build detected: Cleaning .next cache to prevent stale API routes TypeScript errors...');
      fs.rmSync(nextDir, { recursive: true, force: true });
    }
    
    if (fs.existsSync(apiDir)) {
      console.log('Tauri build detected: Temporarily disabling src/app/api routes for static export...');
      fs.renameSync(apiDir, apiBackupDir);
      apiRenamed = true;
    }
    
    if (fs.existsSync(authDir)) {
      console.log('Tauri build detected: Temporarily disabling src/app/auth routes for static export...');
      fs.renameSync(authDir, authBackupDir);
      authRenamed = true;
    }
  } else {
    console.log('Standard web build detected. Keeping API and Auth routes active.');
  }

  console.log('Running Next.js build...');
  execSync('npx next build --webpack', {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ensure NEXT_PUBLIC_TAURI is set if this is a Tauri build
      ...(isTauriBuild ? { NEXT_PUBLIC_TAURI: '1' } : {}),
    }
  });
  console.log('Next.js build completed successfully.');
} catch (error) {
  console.error('Build failed:', error);
  process.exitCode = 1;
} finally {
  if (apiRenamed && fs.existsSync(apiBackupDir)) {
    console.log('Restoring src/app/api...');
    fs.renameSync(apiBackupDir, apiDir);
  }
  if (authRenamed && fs.existsSync(authBackupDir)) {
    console.log('Restoring src/app/auth...');
    fs.renameSync(authBackupDir, authDir);
  }
}
