const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const ejs = require('ejs'); // Import the ejs module
const serveStatic = require('serve-static');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Generate a random secret key
const secretKey = crypto.randomBytes(32).toString('hex');
console.log('Secret Key:', secretKey);

// Create Express app
const app = express();
const port = 3000;

// MongoDB connection URIs

async function findAvailableFlightNumber(clientCollection, email) {
    let i = 0;
    let availableFlightNumber = '';
    while (true) {
        const flightNumberField = 'flightNumber' + (i === 0 ? '' : i); // Construct field name (flightNumber, flightNumber1, flightNumber2, ...)
        const query = { email: email, [flightNumberField]: { $exists: false } }; // Check if the field exists
        const userDoc = await clientCollection.findOne(query);
        if (userDoc) {
            availableFlightNumber = flightNumberField;
            break;
        }
        i++;
    }
    return availableFlightNumber;
}

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

app.get('/trial', (req, res) => {
    res.render('trial');
});

app.get('/book', (req, res) => {
    res.render('book_page');
});

app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false
}));

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/cargo', (req, res) => {
    res.render('cargo');
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
        res.render('error');
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
        res.render('error');
    }
});

app.get('/search_flight', async (req, res) => {
    const to = req.query.to;
    const from = req.query.from;
    const date = req.query.date;
    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use specific collections
        const ticketCollection = database.collection('flight_tickets');

        // Perform search queries on both collections
        const ticketData = await ticketCollection.find({
            $and: [
                {
                    $or: [
                        { departure_airport: { $regex: from, $options: 'i' } },
                        { departure_name: { $regex: from, $options: 'i' } },
                        { departure_location: { $regex: from, $options: 'i' } }
                    ]
                },
                {
                    $or: [
                        { destination_airport: { $regex: to, $options: 'i' } },
                        { destination_name: { $regex: to, $options: 'i' } },
                        { destination_location: { $regex: to, $options: 'i' } }
                    ]
                }
            ]
        }).toArray();
        
        if (ticketData.length === 0) {
            // If no ticket data found, set ticketData to false
            res.render('flight_search', { ticketData: false, date });
        } else {
            // If ticket data found, render the flight_search template with ticketData
            res.render('flight_search', { ticketData, date });
        }

    } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.render('error');
    }
});

app.get('/cargo_search', async (req, res) => {

    const {cargo_id , email} = req.query;

    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use specific collections
        const cargo = database.collection('cargo');
        const cargo_client = database.collection('cargo_client');

        const clientData = await cargo_client.findOne({ cargo_id, email });
        if (!clientData) {
            return res.status(404).render('no_account', { error: 'Email/Cargo not found' });
        }
        const cargoData = await cargo.findOne({ cargo_id });

        // Render the arrival.ejs template with the search results
        res.render('search_cargo', {clientData, cargoData });

    } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.render('no_account');
    }
});

app.get('/client_cargo_id_search', async (req, res) => {
    const user = req.session.user;

    if (!user) {
        res.redirect('/login');
        return;
    }
    const {cargo_id } = req.query;
    const logedinemail = user.email;

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const database = client.db('airport_management');
        
        const cargo = database.collection('cargo');
        const cargo_client = database.collection('cargo_client');

        const cargoData = await cargo.findOne({ cargo_id });
        if (!cargoData) {
            return res.status(404).render('no_account', { error: 'Email/Cargo not found' });
        }
        const clientData = await cargo_client.findOne({ cargo_id });

        res.render('client_search_cargo', {clientData, cargoData, logedinemail });

    } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.render('no_account');
    }
});


app.get('/client_search_cargo', async (req, res) => {
    const user = req.session.user;

    if (!user) {
        // If user is not in session, redirect to login page
        res.redirect('/login');
        return;
    }
    const logedinemail = user.email;

    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use specific collections
        const cargo = database.collection('cargo');
        const cargo_client = database.collection('cargo_client');

        const clientData = await cargo_client.findOne({ email });
        if (!clientData) {
            return res.status(404).render('client_cargo', {email});
        }
        const cargoData = await cargo.findOne({ cargo_id: clientData.cargo_id });

        await req.session.save();

        res.render('client_search_cargo', {clientData, cargoData, logedinemail });

    } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.render('client_cargo', {logedinemail});
    }
});

app.get('/client_search', async (req, res) => {
    const user = req.session.user;

    if (!user) {
        // If user is not in session, redirect to login page
        res.redirect('/login');
        return;
    }

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

        await req.session.save();

        res.render('client_search', { data });

    } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.render('error');
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
        res.render('error');
    }
});

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

            await req.session.save();

        } else {
            // Render no_account.ejs if passwords don't match
            res.render('no_account');
        }
    } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.render('error');
    }
});

app.post('/login_2', async (req, res) => {
    const { email, password, to, from, date } = req.body;

    
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
            res.redirect(`/client_flight_search?from=${from}&to=${to}&date=${date}`);

            await req.session.save();

        } else {
            // Render no_account.ejs if passwords don't match
            res.render('no_account');
        }
    } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.render('error');
    }
});

app.get('/client_book_page',  async (req, res) => {
    // Retrieve user information from session
    const user = req.session.user;

    if (user) {
        const email = user.email;
        await req.session.save();
        res.render('client_book_page', {email});
        return;
    }
    res.render('home');

});

app.get('/client_flight_search',  async (req, res) => {
    // Retrieve user information from session
    const user = req.session.user;

    if (!user) {
        // If user is not in session, redirect to login page
        res.redirect('/login');
        return;
    }

    const to = req.query.to;
    const from = req.query.from;
    const date = req.query.date;
    const email = user.email;
    const password = user.password;

    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');

        // Use a specific database
        const database = client.db('airport_management');
        
        // Use specific collections
        const ticketCollection = database.collection('flight_tickets');

        // Perform search queries on both collections
        const ticketData = await ticketCollection.find({
            $and: [
                {
                    $or: [
                        { departure_airport: { $regex: from, $options: 'i' } },
                        { departure_name: { $regex: from, $options: 'i' } },
                        { departure_location: { $regex: from, $options: 'i' } }
                    ]
                },
                {
                    $or: [
                        { destination_airport: { $regex: to, $options: 'i' } },
                        { destination_name: { $regex: to, $options: 'i' } },
                        { destination_location: { $regex: to, $options: 'i' } }
                    ]
                }
            ]
        }).toArray();

        await req.session.save();
        
        if (ticketData.length === 0) {
            res.render('client_flight_search', { ticketData: false, date });
        } else {
            res.render('client_flight_search', { ticketData, date, email, password });
        }

    } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.render('error');
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

        await req.session.save();

        res.render('client_acc_page',{ clientFlightDetails, arrivalDetails, departureDetails });
    } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.render('error');
    }
});

app.get('/client_other_flight', async (req, res) => {
    const user = req.session.user;

    if (!user) {
        // If user is not in session, redirect to login page
        res.redirect('/login');
        return;
    }

    const email = user.email;
    let { flightNumber } = req.query;

    // If flightNumber is a single value, convert it to an array
    if (!Array.isArray(flightNumber)) {
        flightNumber = [flightNumber];
    }

    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');
        const database = client.db('airport_management');
        const flightCollection = database.collection('flight_tickets');

        const ticketData = await flightCollection.find({ flight_number: { $in: flightNumber } }).toArray();

        await req.session.save();

        res.render('client_other_flight', { ticketData, email });

    } catch (error) {

        console.error('Error fetching user data:', error);
        res.render('error');
    }
});

app.get('/client_book_password', async (req, res) => {
    // Retrieve user information from session
    const user = req.session.user;

    if (!user) {
        // If user is not in session, redirect to login page
        res.redirect('/login');
        return;
    }

    const {from ,flightNumber, to} =req.query;
    const email = user.email;

    res.render('client_book_password', {from ,flightNumber, to, email });
});


app.get('/client_book_flight', async (req, res) => {
    // Retrieve user information from session
    const user = req.session.user;

    if (!user) {
        // If user is not in session, redirect to login page
        return res.redirect('/login');
    }
    
    const { flightNumber, password } = req.query;
    const email = user.email;
    const hashedPassword = user.password; // Assuming you stored the hashed password in user.password
    const noFlights = user.numberof;

    try {
        // Verify password
        const passwordMatch = await bcrypt.compare(password, hashedPassword);
        if (!passwordMatch) {
            return res.render('error');
        }

        // Connect to MongoDB
        await client.connect();
        console.log('Connected to MongoDB');
        const database = client.db('airport_management');
        const clientCollection = database.collection('client_account');

        // Find available flight number
        const availableFlightNumber = await findAvailableFlightNumber(clientCollection, email);

        // Update user document
        const query = { email: email };
        const flightCount = noFlights + 1;
        const update = { 
            $set: { 
                [availableFlightNumber]: flightNumber, 
                numberof: flightCount
            } 
        };
        const options = { returnOriginal: false };
        const updatedUser = await clientCollection.findOneAndUpdate(query, update, options);

        console.log('Update:', flightCount);
        console.log('Updated User:', updatedUser);

        await req.session.save();

        res.redirect('/client_acc_page');
    } catch (error) {
        console.error('Error connecting to MongoDB (Database 1):', error);
        res.render('error');
    } finally {
        // Close MongoDB connection
        await client.close();
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
        res.render('error');
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
        res.render('error');
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

        await req.session.save();
        
        res.render('home' ,{result});
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});