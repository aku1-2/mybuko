const { spawn } = require('child_process');

console.log('Starting Next.js and Socket.io server concurrently...');

const nextProcess = spawn('npx', ['next', 'dev'], { stdio: 'inherit', shell: true });
const socketProcess = spawn('node', ['socket-server.cjs'], { stdio: 'inherit', shell: true });

const killAll = () => {
  nextProcess.kill();
  socketProcess.kill();
};

process.on('SIGINT', () => {
  killAll();
  process.exit();
});

process.on('SIGTERM', () => {
  killAll();
  process.exit();
});

nextProcess.on('exit', (code) => {
  console.log(`Next.js process exited with code ${code}`);
  killAll();
  process.exit(code || 0);
});

socketProcess.on('exit', (code) => {
  console.log(`Socket server process exited with code ${code}`);
  killAll();
  process.exit(code || 0);
});
