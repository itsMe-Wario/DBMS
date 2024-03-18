// Import required modules
const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const ejs = require('ejs'); // Import the ejs module

// Create Express app
const app = express();
const port = 3000;

// MongoDB connection URI
const uri = 'mongodb://localhost:27017/arrivals';

// Create a new MongoClient
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static(__dirname, 'public'));

// Define route handler for the root URL ("/")
app.get('/', async (req, res) => {
    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');

        // Use a specific database
        const database = client.db('arrivals');
        
        // Use a specific collection
        const collection = database.collection('flight');

        // Fetch data from the collection
        const data = await collection.find().toArray();

        // Render the index.ejs template with the fetched data
        const renderedHtml = await ejs.renderFile(path.join(__dirname, 'views', 'index.ejs'), { data });

        // Send the rendered HTML to the client
        res.send(renderedHtml);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        res.status(500).send('Error connecting to MongoDB');
    } finally {
        // Close the MongoDB client connection
        await client.close();
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});


