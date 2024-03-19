// Import required modules
const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const ejs = require('ejs'); // Import the ejs module
const serveStatic = require('serve-static');

// Create Express app
const app = express();
const port = 3000;

// MongoDB connection URIs
const uri1 = 'mongodb://localhost:27017/airport_management';
const uri2 = 'mongodb://localhost:27017/airport_management2';

const client = new MongoClient(uri1, { useNewUrlParser: true, useUnifiedTopology: true });

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(serveStatic(path.join(__dirname, 'public')));

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

app.get('/', (req, res) => {
    res.render('home');
});

// Define route handler for the first database
app.get('/database1', async (req, res) => {
    try {
        // Create a new MongoClient for the first database
        const client = new MongoClient(uri1, { useNewUrlParser: true, useUnifiedTopology: true });
        
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB (Database 1)');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use a specific collection
        const collection = database.collection('arrival_list');

        // Fetch data from the collection
        const data = await collection.find().toArray();

        // Render the arrival.ejs template with the fetched data
        res.render('arrival', { data });

    } catch (error) {
        console.error('Error connecting to MongoDB (Database 1):', error);
        res.status(500).send('Error connecting to MongoDB (Database 1)');
    }
});

app.get('/find', async (req, res) => {
    const query = req.query.query;
    const capitalizedQuery = query.toUpperCase();
    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use a specific collection
        const collection = database.collection('arrival_list');

        // Perform search query
        const data = await collection.find({ flightNumber: capitalizedQuery   }).toArray();

        // Render the arrival.ejs template with the search results
        res.render('arrival_search', { data });

    } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.status(500).send('Error searching in MongoDB');
    }
});

// Define route handler for the second database
app.get('/database2', async (req, res) => {
    try {
        // Create a new MongoClient for the second database
        const client = new MongoClient(uri2, { useNewUrlParser: true, useUnifiedTopology: true });
        
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB (Database 2)');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use a specific collection
        const collection = database.collection('departure_list');

        // Fetch data from the collection
        const data = await collection.find().toArray();

        // Render the arrival2.ejs template with the fetched data
        res.render('departure', { data });

    } catch (error) {
        console.error('Error connecting to MongoDB (Database 2):', error);
        res.status(500).send('Error connecting to MongoDB (Database 2)');
    }
});
// Define route handler for search
app.get('/search', async (req, res) => {
    // Get the query parameter from the request and capitalize it
    const query = req.query.query;

    // Convert the query to uppercase
    const capitalizedQuery = query.toUpperCase();
    
    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use a specific collection
        const collection = database.collection('departure_list');

        // Perform search query with the capitalized query
        const data = await collection.find({ flightNumber: capitalizedQuery }).toArray();

        // Render the departure_search.ejs template with the search results
        res.render('departure_search', { data });

    } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.status(500).send('Error searching in MongoDB');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
