const fs = require('fs');
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcryptjs');

const envPath = path.join(__dirname, '..', '.env');

function promptPassword(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    // Mask terminal output for privacy
    let password = '';
    process.stdout.write(query);

    const onData = (char) => {
      char = char.toString('utf8');
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.removeListener('data', onData);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007f': // Backspace
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    };

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', onData);
    }

    rl.question('', (answer) => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      rl.close();
      resolve(process.stdin.isTTY ? password : answer);
    });
  });
}

function updateEnvFile(hash) {
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Remove any legacy plaintext ADMIN_PASSWORD
  envContent = envContent.replace(/^ADMIN_PASSWORD=.*$/gm, '');

  // Ensure ADMIN_USERNAME=admin
  if (/^ADMIN_USERNAME=/m.test(envContent)) {
    envContent = envContent.replace(/^ADMIN_USERNAME=.*$/gm, 'ADMIN_USERNAME=admin');
  } else {
    envContent += '\nADMIN_USERNAME=admin';
  }

  // Update or append ADMIN_PASSWORD_HASH
  if (/^ADMIN_PASSWORD_HASH=/m.test(envContent)) {
    envContent = envContent.replace(/^ADMIN_PASSWORD_HASH=.*$/gm, `ADMIN_PASSWORD_HASH=${hash}`);
  } else {
    envContent += `\nADMIN_PASSWORD_HASH=${hash}`;
  }

  // Clean extra blank lines
  envContent = envContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim() + '\n';

  fs.writeFileSync(envPath, envContent, 'utf8');
}

async function main() {
  console.log('===========================================================');
  console.log('  AI&DS Laboratory Audit - Administrator Password Setup');
  console.log('===========================================================');
  console.log('Username is locked to: admin\n');

  let password = process.argv[2];

  if (!password) {
    password = await promptPassword('Enter new administrator password (min 8 chars): ');
    console.log();

    if (!password || password.trim().length < 8) {
      console.error('\nError: Password must be at least 8 characters long.');
      process.exit(1);
    }

    const confirm = await promptPassword('Confirm new administrator password: ');
    console.log();

    if (password !== confirm) {
      console.error('\nError: Passwords do not match. Setup aborted.');
      process.exit(1);
    }
  } else {
    if (password.trim().length < 8) {
      console.error('\nError: Password must be at least 8 characters long.');
      process.exit(1);
    }
  }

  console.log('\nGenerating secure bcrypt hash (cost factor 12)...');
  const hash = bcrypt.hashSync(password.trim(), 12);

  // Update backend/.env
  updateEnvFile(hash);

  console.log('✓ Success! Admin password hash generated and saved to backend/.env\n');
  console.log('-----------------------------------------------------------');
  console.log('ADMIN_USERNAME=admin');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log('-----------------------------------------------------------\n');

  console.log('📋 Instructions for updating on Render (Production):');
  console.log('1. Go to your Render Dashboard (https://dashboard.render.com).');
  console.log('2. Select your backend Web Service.');
  console.log('3. In the left menu, click "Environment".');
  console.log('4. Ensure "ADMIN_USERNAME" is set to "admin".');
  console.log('5. Set "ADMIN_PASSWORD_HASH" to the hash above:');
  console.log(`   ${hash}`);
  console.log('6. Click "Save Changes". Render will automatically redeploy.');
  console.log('===========================================================');
  process.exit(0);
}

main().catch(err => {
  console.error('\nFatal error during password setup:', err);
  process.exit(1);
});
