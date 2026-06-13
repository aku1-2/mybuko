const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// 1. Load .env variables
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        process.env[key] = val;
      }
    });
  }
} catch (err) {
  console.error('Failed to load env:', err);
}

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD;

console.log('Testing SMTP connection with credentials:');
console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`User: ${user}`);
console.log(`Password length: ${pass ? pass.length : 0}`);

if (!host || !user || !pass) {
  console.error('ERROR: SMTP credentials missing from .env');
  process.exit(1);
}

// 2. Create transport
const transporter = nodemailer.createTransport({
  host: host,
  port: parseInt(port || '587'),
  secure: port === '465',
  auth: {
    user: user,
    pass: pass,
  },
});

// 3. Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection failed:', error);
  } else {
    console.log('SMTP Server is ready to take messages!');
    
    // Attempt sending test email
    transporter.sendMail({
      from: `MyBuko Team <${user}>`,
      to: 'abchangehongenaruto@gmail.com',
      subject: 'MyBuko SMTP Test Email',
      text: 'If you see this, your Gmail App Password and SMTP settings are 100% correct!'
    }).then(info => {
      console.log('Test email sent successfully! Info:', info.messageId);
    }).catch(err => {
      console.error('Failed to send test email:', err);
    });
  }
});
