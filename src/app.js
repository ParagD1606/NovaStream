import {ApiError} from './utils/ApiError.js';
import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static('public'));
app.use(cookieParser());

//routes

import userRouter from './routes/user.routes.js';

app.use('/users', userRouter);


//routes declaration
app.use('/api/v1/users', userRouter);


//error checking middleware
app.use((err, req, res, next) => {
    // If it's a known error, use its properties; otherwise, default to 500
    const statusCode = err instanceof ApiError ? err.statusCode : 500;
    const message = err.message || "Internal Server Error";

    return res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || []
    });
});

export {app};