// index.js

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hospital Patient API is running");
});


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
});

// Patient Schema
const patientSchema = new mongoose.Schema({
    patientId: { type: String, unique: true, required: true },

    fullName: { 
        type: String, 
        required: true 
    },

    email: { 
        type: String, 
        required: true, 
        unique: true 
    },

    phoneNumber: { 
        type: String, 
        required: true 
    },

    age: { 
        type: Number, 
        min: 0 
    },

    gender: { 
        type: String, 
        enum: ["Male", "Female", "Other"] 
    },

    disease: { 
        type: String, 
        required: true 
    },

    doctorAssigned: { 
        type: String, 
        required: true 
    },

    admissionDate: { 
        type: Date 
    },

    roomNumber: { 
        type: String 
    },

    patientType: { 
        type: String, 
        enum: ["Inpatient", "Outpatient"] 
    },

    status: { 
        type: String, 
        enum: ["Admitted", "Discharged"], 
        default: "Admitted" 
    }

}, { timestamps: true });

const Patient = mongoose.model("Patient", patientSchema);

// Generate Patient ID
const generatePatientId = () => "PAT" + Date.now();


// ROUTES

// Register Patient
app.post("/patients", async (req, res, next) => {
    try {
        const data = req.body;
        data.patientId = generatePatientId();

        const patient = new Patient(data);
        await patient.save();

        res.status(201).json(patient);

    } catch (err) {
        next(err);
    }
});


// Get All Patients
app.get("/patients", async (req, res, next) => {
    try {

        const patients = await Patient.find();
        res.status(200).json(patients);

    } catch (err) {
        next(err);
    }
});


// Get Patient by ID
app.get("/patients/:id", async (req, res, next) => {
    try {

        const patient = await Patient.findById(req.params.id);

        if (!patient)
            return res.status(404).json({ message: "Patient not found" });

        res.status(200).json(patient);

    } catch (err) {
        next(err);
    }
});


// Update Patient
app.put("/patients/:id", async (req, res, next) => {
    try {

        const updatedPatient = await Patient.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedPatient)
            return res.status(404).json({ message: "Patient not found" });

        res.status(200).json(updatedPatient);

    } catch (err) {
        next(err);
    }
});


// Delete Patient
app.delete("/patients/:id", async (req, res, next) => {
    try {

        const deletedPatient = await Patient.findByIdAndDelete(req.params.id);

        if (!deletedPatient)
            return res.status(404).json({ message: "Patient not found" });

        res.status(200).json({ message: "Patient deleted successfully" });

    } catch (err) {
        next(err);
    }
});


// Search Patients by Name or Disease
app.get("/patients/search", async (req, res, next) => {
    try {

        const { name, disease } = req.query;
        const query = {};

        if (name)
            query.fullName = { $regex: name, $options: "i" };

        if (disease)
            query.disease = { $regex: disease, $options: "i" };

        const patients = await Patient.find(query);

        res.status(200).json(patients);

    } catch (err) {
        next(err);
    }
});


// Error Handling Middleware
app.use((err, req, res, next) => {

    console.error(err);

    if (err.name === "ValidationError")
        return res.status(400).json({ message: err.message });

    if (err.code === 11000)
        return res.status(400).json({
            message: "Duplicate value error",
            fields: err.keyValue
        });

    res.status(500).json({ message: "Server Error" });

});


// Start Server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));