import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

//importing from outside files
import routes from './routes/index.js';

dotenv.config();

const app = express();
//port number
const PORT = process.env.PORT || 8800;

// Middleware
app.use(cors());//acess from any origin
//if we want from particular origin then we can do like this
// app.use(cors({
//   origin: 'http://example.com' // Replace with your frontend URL
// }));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api-v1",routes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found",
    status: "404 not found"
   });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


