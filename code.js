// MVP Skeleton for Camera Rental Platform with Small Hub System Integration

// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Initialize app
const app = express();
dotenv.config();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['owner', 'customer', 'hubPartner'], required: true },
    hubLocation: { type: String }, // For hub partners
});

const User = mongoose.model('User', userSchema);

// Camera Schema
const cameraSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    model: { type: String, required: true },
    pricePerDay: { type: Number, required: true },
    location: { type: String, required: true },
    description: { type: String },
    availability: { type: Boolean, default: true },
    hub: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Associated hub
});

const Camera = mongoose.model('Camera', cameraSchema);

// Delivery Request Schema
const deliverySchema = new mongoose.Schema({
    camera: { type: mongoose.Schema.Types.ObjectId, ref: 'Camera', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hub: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'in-transit', 'delivered'], default: 'pending' },
    deliveryDate: { type: Date, required: true },
});

const Delivery = mongoose.model('Delivery', deliverySchema);

// Routes

// Register User
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role, hubLocation } = req.body;
        const newUser = new User({ name, email, password, role, hubLocation });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login User
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && user.password === password) {
            res.status(200).json({ message: 'Login successful!', user });
        } else {
            res.status(401).json({ message: 'Invalid credentials!' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Camera Listing
app.post('/api/cameras', async (req, res) => {
    try {
        const { owner, model, pricePerDay, location, description, hub } = req.body;
        const newCamera = new Camera({ owner, model, pricePerDay, location, description, hub });
        await newCamera.save();
        res.status(201).json({ message: 'Camera listed successfully!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get Available Cameras
app.get('/api/cameras', async (req, res) => {
    try {
        const cameras = await Camera.find({ availability: true }).populate('owner', 'name email').populate('hub', 'hubLocation');
        res.status(200).json(cameras);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Delivery Request
app.post('/api/deliveries', async (req, res) => {
    try {
        const { camera, customer, hub, deliveryDate } = req.body;
        const newDelivery = new Delivery({ camera, customer, hub, deliveryDate });
        await newDelivery.save();
        res.status(201).json({ message: 'Delivery request created successfully!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
