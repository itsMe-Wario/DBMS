// Import required modules
const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const ejs = require('ejs'); // Import the ejs module
const serveStatic = require('serve-static');
const bodyParser = require('body-parser');
const session = require('express-session');

const crypto = require('crypto');

// Generate a random secret key
const secretKey = crypto.randomBytes(32).toString('hex');
console.log('Secret Key:', secretKey);

// Create Express app
const app = express();
const port = 3000;

// MongoDB connection URIs
const uri1 = 'mongodb://localhost:27017/airport_management';

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

app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false
}));

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
        const client = new MongoClient(uri1, { useNewUrlParser: true, useUnifiedTopology: true });
        
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

app.get('/admin', async (req, res) => {
    try {
        // Create a new MongoClient for the second database
        const client = new MongoClient(uri1, { useNewUrlParser: true, useUnifiedTopology: true });
        
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use a specific collection
        const collection = database.collection('client_account');

        // Fetch data from the collection
        const data = await collection.find().toArray();

        // Render the arrival2.ejs template with the fetched data
        res.render('admin_client', { data });

    } catch (error) {
        console.error('Error connecting to MongoDB (Database 2):', error);
        res.status(500).send('Error connecting to MongoDB (Database 2)');
    }
});

app.get('/admin_arrival', async (req, res) => {
    try {
        // Create a new MongoClient for the second database
        const client = new MongoClient(uri1, { useNewUrlParser: true, useUnifiedTopology: true });
        
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use a specific collection
        const collection = database.collection('arrival_list');

        // Fetch data from the collection
        const data = await collection.find().toArray();

        // Render the arrival2.ejs template with the fetched data
        res.render('admin_arrival', { data });

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
            // Store user information in session
            req.session.user = user;

            // Redirect to client account page
            res.redirect('/client_acc_page');
        } else {
            // Render no_account.ejs if passwords don't match
            res.render('no_account');
        }
    } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.status(500).send('Error searching in MongoDB');
    }
});

app.get('/client_acc_page',  async (req, res) => {
    // Retrieve user information from session
    const user = req.session.user;

    if (!user) {
        // If user is not in session, redirect to login page
        res.redirect('/login');
        return;
    }

    // Retrieve flightNumber from user's information
    const flightNumber = user.flightNumber;
    const email = user.email;

    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use specific collections
        const departureCollection = database.collection('departure_list');
        const anotherdepartureCollection = database.collection('another_airport_departure');
        const anotherarrivalCollection = database.collection('another_airport_arrival');
        const arrivalCollection = database.collection('arrival_list');
        const clientCollection = database.collection('client_account');

        // Find client flight details from client_account collection
        const clientFlightDetails = await clientCollection.findOne({ flightNumber, email });

        if (!clientFlightDetails) {
            return res.status(404).render('error', { error: 'Flight not found' });
        }

        const arrivalDetails_1 = await arrivalCollection.findOne({ flightNumber });
        const arrivalDetails_2 = await anotherarrivalCollection.findOne({ flightNumber });

        const departureDetails_1 = await departureCollection.findOne({ flightNumber });
        const departureDetails_2 = await anotherdepartureCollection.findOne({ flightNumber });

        const arrivalDetails = arrivalDetails_1 || arrivalDetails_2;
        const departureDetails = departureDetails_1 || departureDetails_2;

        res.render('client_acc_page',{ clientFlightDetails, arrivalDetails, departureDetails });
    } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.status(500).send('Error searching in MongoDB');
    }
});

app.get('/client_arrival', async (req, res) => {
    // Retrieve user information from session
    const user = req.session.user;

    if (!user) {
        // If user is not in session, redirect to login page
        res.redirect('/login');
        return;
    }

    try {
        // Create a new MongoClient for the first database
        const client = new MongoClient(uri1, { useNewUrlParser: true, useUnifiedTopology: true });
        
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use a specific collection
        const arrivalcollection = database.collection('arrival_list');
        const usercollection = database.collection('client_account');
        // Fetch data from the collection
        const arrivalData = await arrivalcollection.find().toArray();
        const userData = await usercollection.find().toArray();

        // Combine arrival data and user data
        const data = {
            arrivalData: arrivalData,
            userData: userData,
            user: user  // Include user information
        };

        res.render('client_arrival', { data });

    } catch (error) {
        console.error('Error connecting to MongoDB (Database 1):', error);
        res.status(500).send('Error connecting to MongoDB (Database 1)');
    }
});

app.get('/client_departure', async (req, res) => {
    // Retrieve user information from session
    const user = req.session.user;

    if (!user) {
        // If user is not in session, redirect to login page
        res.redirect('/login');
        return;
    }

    try {
        // Create a new MongoClient for the first database
        const client = new MongoClient(uri1, { useNewUrlParser: true, useUnifiedTopology: true });
        
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use a specific collection
        const departurecollection = database.collection('departure_list');
        const usercollection = database.collection('client_account');
        // Fetch data from the collection
        const departureData = await departurecollection.find().toArray();
        const userData = await usercollection.find().toArray();

        // Combine arrival data and user data
        const data = {
            departureData: departureData,
            userData: userData,
            user: user  // Include user information
        };

        res.render('client_departure', { data });

    } catch (error) {
        console.error('Error connecting to MongoDB (Database 2):', error);
        res.status(500).send('Error connecting to MongoDB (Database 1)');
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

app.post('/client_add', async (req, res) => {
    const { name, email, password, flightNumber } = req.body;

    try {
        const db = client.db('airport_management');
        const collection = db.collection('client_account');

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the user data into the collection
        const result = await collection.insertOne({ name, email, password: hashedPassword, flightNumber });
        
        res.redirect('/admin');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user');
    }
});

app.post('/client_delete', async (req, res) => {
    const { email } = req.body;

    try {
        const db = client.db('airport_management');
        const collection = db.collection('client_account');

        // Delete the client account based on the email
        const result = await collection.deleteOne({ email });
        
        if (result.deletedCount === 1) {
            res.redirect('/admin');
        } else {
            res.status(404).send('Client account not found');
        }
    } catch (error) {
        console.error('Error deleting client account:', error);
        res.status(500).send('Error deleting client account');
    }
});

app.post('/client_edit', async (req, res) => {
    const { email, newName, newPassword } = req.body;

    try {
        const db = client.db('airport_management');
        const collection = db.collection('client_account');

        // Check if the email exists in the collection
        const existingUser = await collection.findOne({ email });
        if (!existingUser) {
            return res.status(404).send('Client account not found');
        }

        // Prepare update fields
        const updateFields = {};
        if (newName) {
            updateFields.name = newName;
        }
        if (newPassword) {
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateFields.password = hashedPassword;
        }

        // Update the client account
        const result = await collection.updateOne({ email }, { $set: updateFields });
        
        if (result.modifiedCount === 1) {
            res.redirect('/admin');
        } else {
            res.status(500).send('Error updating client account');
        }
    } catch (error) {
        console.error('Error editing client account:', error);
        res.status(500).send('Error editing client account');
    }
});

app.post('/arrival_add', async (req, res) => {
    const { flightNumber, origin, "scheduled Arrival Time": scheduledArrivalTime, "estimated Arrival Time": estimatedArrivalTime,
        status, gate, "baggage Claim": baggageClaim, airline, terminal, remarks } = req.body;

    try {
        const db = client.db('airport_management');
        const collection = db.collection('arrival_list');

        // Insert the user data into the collection
        const result = await collection.insertOne({ flightNumber, origin, scheduledArrivalTime, estimatedArrivalTime,
            status, gate, baggageClaim, airline, terminal, remarks });

        res.redirect('/admin');
    } catch (error) {
        console.error('Error adding arrival:', error);
        res.status(500).send('Error adding arrival');
    }
});

app.post('/arrival_delete', async (req, res) => {
    const { flightNumber } = req.body;

    try {
        const db = client.db('airport_management');
        const collection = db.collection('arrival_list');


        const result = await collection.deleteOne({ flightNumber });
        
        if (result.deletedCount === 1) {
            res.redirect('/admin');
        } else {
            res.status(404).send('Flight not found');
        }
    } catch (error) {
        console.error('Error deleting client account:', error);
        res.status(500).send('Error deleting flight');
    }
});

app.post('/arrival_edit/:flightNumber', async (req, res) => {
    const { origin, scheduledArrivalTime, estimatedArrivalTime, status, gate, baggageClaim, airline, terminal, remarks } = req.body;
    const { flightNumber } = req.params;

    try {
        const db = client.db('airport_management');
        const collection = db.collection('arrival_list');

        // Update the arrival entry
        const result = await collection.updateOne({ flightNumber }, { $set: { origin, scheduledArrivalTime, estimatedArrivalTime, status, gate, baggageClaim, airline, terminal, remarks } });

        if (result.modifiedCount === 1) {
            res.redirect('/admin');
        } else {
            res.status(404).send('Arrival entry not found');
        }
    } catch (error) {
        console.error('Error editing arrival:', error);
        res.status(500).send('Error editing arrival');
    }
});
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});