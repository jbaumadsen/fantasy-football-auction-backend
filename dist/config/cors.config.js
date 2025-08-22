const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
// console.log('allowedOrigins from cors.config.ts line 4', allowedOrigins);
if (!process.env.CORS_ORIGINS) {
    console.warn('⚠️ Warning: CORS_ORIGINS is not set in environment variables');
}
const corsOptions = {
    origin: function (origin, callback) {
        // console.log('origin', origin);
        // console.log('allowedOrigins', allowedOrigins);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
};
export default corsOptions;
//# sourceMappingURL=cors.config.js.map