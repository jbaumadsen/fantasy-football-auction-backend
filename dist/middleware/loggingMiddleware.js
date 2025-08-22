export const loggingMiddleware = (req, res, next) => {
    console.log(`LoggingMiddleware line 8: [${new Date().toISOString()}] ${req.method} ${req.url}`);
    // Log the request body if it exists
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('LoggingMiddleware line 12: Request Body:', req.body);
    }
    const originalSend = res.send;
    res.send = function (body) {
        console.log(`LoggingMiddleware line 18: [${new Date().toISOString()}] Response Body:`, body);
        return originalSend.call(this, body);
    };
    next();
};
//# sourceMappingURL=loggingMiddleware.js.map