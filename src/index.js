// require('dotenv').config({path: './.env'});

import dotenv from 'dotenv';
import express from 'express';
import connectDB from './db/index.js';

import { app } from './app.js';

dotenv.config({ path: './.env' });

// const app = express();



connectDB()
.then(()=>{
    app.on("error", (err) => {
        console.error('Server error', err);
        throw err;
    });

    app.listen(process.env.PORT || 8000 , () => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
})
.catch((err)=>{
    console.error('Failed to connect to DB', err);
    process.exit(1);
});








// (async () => {
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}` );
//         console.log('Connected to MongoDB');

//         app.on("error", (err) => {
//             console.error('Server error', err);
//             throw err;
//         });

//         app.listen(process.env.PORT, () => {
//             console.log(`Server is running on port ${process.env.PORT}`);
//         });
//     }
//     catch(err){
//         console.error('Failed to connect to MongoDB', err);
//         throw err;
//     }
// })