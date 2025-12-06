import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { app } from './app.js';

// const app = express();

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

export {app};