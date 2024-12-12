const { createLogger, format, transports } = require("winston");

const formats = [
  // hashSensitiveFields(),
  format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss.SSS",
  }),
  format.errors({ stack: true }),
  format.simple(),
];

const logger = createLogger({
  level: "info",
  exitOnError: false,
  format: format.combine(...formats),
  transports: [new transports.Console()],
});

module.exports = logger;
