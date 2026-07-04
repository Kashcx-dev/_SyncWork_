import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './router.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);

// Global 404 Error Handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler (catches 500s)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
