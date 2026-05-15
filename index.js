require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserModel, LostModel, FoundModel } = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET; 

app.use(express.json());

// Fix CORS - Allow your frontend port
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});


// database connection
async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    console.log(process.env.MONGO_URL);
  }
}
main();

// Middleware 
function authMiddleware(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
}

app.get("/", (req, res) => {
  res.json({ connected: "you are on the home page " });
});

app.get("/test", (req, res) => {
  res.json({ message: "Backend working" });
});
// Signup
// app.post("/api/signup", async (req, res) => {
//   try {
//     const { name, email, password } = req.body;
//     const hashed = await bcrypt.hash(password, 10);
//     const user = await UserModel.create({ name, email, password: hashed });
//     res.json({ message: "User created successfully", user });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });


app.post("/api/signup", async (req, res) => {
  console.log("Signup route hit");
  console.log(req.body);

  try {
    const { name, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      name,
      email,
      password: hashed,
    });

    res.json({
      message: "User created successfully",
      user,
    });

  } catch (err) {
    console.log("SIGNUP ERROR:");
    console.log(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ message: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//post lost
app.post("/api/lost", authMiddleware, async (req, res) => {
  try {
    const { title, description, location, contact, imageUrl } = req.body;
    const newLost = await LostModel.create({
      title,
      description,
      last_seen: location,
      contact,
      imageUrl,
      userId: req.user.id,
    });
    res.json({ message: "Lost item reported successfully!", newLost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// post found
app.post("/api/found", authMiddleware, async (req, res) => {
  try {
    const { title, description, location, contact, imageUrl } = req.body;
    const newFound = await FoundModel.create({
      title,
      description,
      last_seen: location,
      contact,
      imageUrl,
      userId: req.user.id,
    });
    res.json({ message: "Found item reported successfully!", newFound });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get all items
app.get("/api/items", async (req, res) => {
  try {
    const lostItems = await LostModel.find().sort({ createdAt: -1 });
    const foundItems = await FoundModel.find().sort({ createdAt: -1 });


    const items = [
      ...lostItems.map((item) => ({ ...item._doc, type: "Lost" })),
      ...foundItems.map((item) => ({ ...item._doc, type: "Found" })),
    ];
    // Final sort across both collections
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete item
app.delete("/api/items/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted =
      (await LostModel.findOneAndDelete({ _id: id, userId: req.user.id })) ||
      (await FoundModel.findOneAndDelete({ _id: id, userId: req.user.id }));

    if (!deleted) return res.status(404).json({ error: "Item not found or not yours" });
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// resolve item
app.patch("/api/items/:id/resolve", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updated =
      (await LostModel.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        { status: "resolved" },
        { new: true }
      )) ||
      (await FoundModel.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        { status: "resolved" },
        { new: true }
      ));

    if (!updated) return res.status(404).json({ error: "Item not found or not yours" });
    res.json({ message: "Item marked as resolved", updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});






