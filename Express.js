// Import required modules
const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const ejs = require('ejs'); // Import the ejs module
const serveStatic = require('serve-static');
const bodyParser = require('body-parser');

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

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

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

app.get('/signup', (req, res) => {
    res.render('signup');
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

app.get('/search', async (req, res) => {
    const query = req.query.query;
    const capitalizedQuery = query.toUpperCase();
    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use specific collections
        const arrivalCollection = database.collection('arrival_list');
        const departureCollection = database.collection('departure_list');

        // Perform search queries on both collections
        const arrivalData = await arrivalCollection.find({ flightNumber: capitalizedQuery }).toArray();
        const departureData = await departureCollection.find({ flightNumber: capitalizedQuery }).toArray();

        // Combine search results from both collections
        const data = arrivalData.concat(departureData);

        // Render the arrival.ejs template with the search results
        res.render('search', { data });

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

const bcrypt = require('bcrypt');

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use a specific collection
        const collection = database.collection('client_account');

        // Find user with the given email
        const user = await collection.findOne({ email: email });

        // Check if user exists
        if (!user) {
            // Render no_account.ejs if user doesn't exist
            res.render('no_account');
            return;
        }

        // Compare passwords
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            // Render account.ejs if passwords match
            res.render('client_acc_page');
        } else {
            // Render no_account.ejs if passwords don't match
            res.render('no_account');
        }
    } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.status(500).send('Error searching in MongoDB');
    }
});

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const db = client.db('airport_management');
        const collection = db.collection('client_account');

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the user data into the collection
        const result = await collection.insertOne({ name, email, password: hashedPassword });
        
        res.render('home');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user');
    }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
