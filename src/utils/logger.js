const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

const CURRENT_LEVEL =
  process.env.NODE_ENV === 'production' ? LOG_LEVELS.warn : LOG_LEVELS.debug;

const styles = {
  debug: 'color:#888;font-size:11px',
  info:  'color:#22d3a0;font-weight:bold',
  warn:  'color:#ff8c42;font-weight:bold',
  error: 'color:#ff4d6d;font-weight:bold;font-size:13px',
};

function log(level, message, data) {
  if (LOG_LEVELS[level] < CURRENT_LEVEL) return;
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `%c[${timestamp}] [${level.toUpperCase()}]`;
  const fn = level === 'debug' ? console.log : console[level];
  data !== undefined
    ? fn(prefix, styles[level], message, data)
    : fn(prefix, styles[level], message);
}

const logger = {
  debug: (msg, data) => log('debug', msg, data),
  info:  (msg, data) => log('info',  msg, data),
  warn:  (msg, data) => log('warn',  msg, data),
  error: (msg, data) => log('error', msg, data),
  socket: {
    emit: (event, data) => log('debug', `📤 emit → ${event}`, data),
    on:   (event, data) => log('debug', `📥 recv ← ${event}`, data),
  },
};

export default logger;
