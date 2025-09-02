export declare class Logger {
    private logDir;
    private maxFiles;
    private currentLogFile;
    constructor(logDir?: string);
    private ensureLogDirectory;
    private getCurrentLogFileName;
    private rotateLogsIfNeeded;
    private writeToFile;
    log(message: string, data?: any): void;
    error(message: string, error?: any): void;
    warn(message: string, data?: any): void;
}
export declare const logger: Logger;
export default logger;
//# sourceMappingURL=logger.utils.d.ts.map