// Captures console logs, errors, and crashes into memory so they're viewable on the web page
const MAX_LOGS = 100;
const logs = [];

function record(level, ...args) {
  const line = `[${new Date().toISOString()}] ${level}: ${args.map(a => 
    typeof a === 'object' ? JSON.stringify(a) : String(a)
  ).join(' ')}`;
  logs.push(line);
  if (logs.length > MAX_LOGS) logs.shift();
}

function attach() {
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args) => {
    record('INFO', ...args);
    originalLog(...args);
  };

  console.error = (...args) => {
    record('ERROR', ...args);
    originalError(...args);
  };

  process.on('uncaughtException', (err) => {
    record('CRASH', err.message, err.stack);
    originalError('Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (reason) => {
    record('CRASH', 'Unhandled Rejection:', reason);
    originalError('Unhandled Rejection:', reason);
  });
}

function getLogs() {
  return logs.join('\n');
}

module.exports = { attach, getLogs };