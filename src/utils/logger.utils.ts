import fs from 'fs';
import path from 'path';

export class Logger {
  private logDir: string;
  private maxFiles: number = 5;
  private currentLogFile: string;

  constructor(logDir: string = 'logs') {
    this.logDir = logDir;
    this.ensureLogDirectory();
    this.currentLogFile = this.getCurrentLogFileName();
    this.rotateLogsIfNeeded();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getCurrentLogFileName(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-'); // HH-MM-SS
    return `yahoo-players-${dateStr}-${timeStr}.log`;
  }

  private rotateLogsIfNeeded(): void {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.startsWith('yahoo-players-') && file.endsWith('.log'))
        .sort()
        .reverse();

      // Remove old files if we have more than maxFiles
      if (files.length >= this.maxFiles) {
        const filesToRemove = files.slice(this.maxFiles);
        filesToRemove.forEach(file => {
          const filePath = path.join(this.logDir, file);
          fs.unlinkSync(filePath);
          console.log(`🗑️ Removed old log file: ${file}`);
        });
        console.log(`📁 Kept ${this.maxFiles} most recent log files`);
      }
    } catch (error) {
      console.error('Error rotating log files:', error);
    }
  }

  private writeToFile(message: string): void {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;
      const logPath = path.join(this.logDir, this.currentLogFile);
      
      fs.appendFileSync(logPath, logEntry);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  log(message: string, data?: any): void {
    const fullMessage = data ? `${message} ${JSON.stringify(data, null, 2)}` : message;
    console.log(fullMessage);
    this.writeToFile(fullMessage);
  }

  error(message: string, error?: any): void {
    const fullMessage = error ? `${message} ${JSON.stringify(error, null, 2)}` : message;
    console.error(fullMessage);
    this.writeToFile(`ERROR: ${fullMessage}`);
  }

  warn(message: string, data?: any): void {
    const fullMessage = data ? `${message} ${JSON.stringify(data, null, 2)}` : message;
    console.warn(fullMessage);
    this.writeToFile(`WARN: ${fullMessage}`);
  }
}

export const logger = new Logger();
export default logger;
