const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// User schema
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Lost item schema
const LostSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  last_seen: { type: String, required: true },
  contact: { type: String, required: true },
  imageUrl: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: "users" },
  status: { type: String, enum: ["active", "resolved"], default: "active" },
},
  { timestamps: true });

// Found item schema
const FoundSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  last_seen: { type: String, required: true },
  contact: { type: String, required: true },
  imageUrl: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: "users" },
  status: { type: String, enum: ["active", "resolved"], default: "active" },
},
  { timestamps: true });

const UserModel = mongoose.model("users", UserSchema);
const LostModel = mongoose.model("losts", LostSchema);
const FoundModel = mongoose.model("founds", FoundSchema);

module.exports = { UserModel, LostModel, FoundModel };
