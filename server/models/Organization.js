const mongoose = require("mongoose");
const { MongooseAutoIncrementID } = require("mongoose-auto-increment-reworked");
const immutablePlugin = require("mongoose-immutable-plugin");
const bcrypt = require("bcryptjs");
const R = require("ramda");
const uuid = require("uuid/v4");

const pid = () => `pid${uuid().replace(/-/g, "")}`;


const organizationSchema = new mongoose.Schema({
  username: { type: String, lowercase: true, required: true, unique: true, trim: true }, // eslint-disable-line object-curly-newline
  password: { type: String, required: true },
  organizationId: { type: String, default: pid, immutable: true },
  email: { type: String, required: true, trim: true },
  profilePic: { type: String },
  firstName: { type: String, maxlength: 30, trim: true },
  lastName: { type: String, maxlength: 30, trim: true },
  bio: { type: String, maxlength: 240, trim: true },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

MongooseAutoIncrementID.initialise("counters");

organizationSchema.plugin(MongooseAutoIncrementID.plugin, {
  modelName: "Organization",
  field: "organization",
  incrementBy: 1,
  startAt: 1,
  unique: true,
  nextCount: false,
  resetCount: false,
});
organizationSchema.plugin(immutablePlugin);

organizationSchema.virtual("fullName").get(() => {
  if (this.firstName && this.lastName) return `${this.firstName} ${this.lastName}`;
  if (this.firstName && !this.lastName) return this.firstName;
  if (!this.firstName && this.lastName) return this.lastName;
  return undefined;
});
organizationSchema.virtual("initials").get(() => (this.firstName && this.lastName && `${this.firstName[0].concat(this.lastName[0]).toUpperCase()}`));

organizationSchema.methods.validPassword = function validPassword(password) {
  return bcrypt.compareSync(password, this.password);
};

organizationSchema.methods.validUsername = function validUsername(username) {
  return username === this.username;
};

organizationSchema.methods.validEmail = function validEmail(email) {
  return email === this.email;
};

organizationSchema.methods.hashPassword = function hashPassword() {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err1, salt) => {
      if (err1) { reject(err1); }
      bcrypt.hash(this.password, salt, (err2, hash) => {
        if (err2) { reject(err2); }
        this.password = hash;
        resolve(hash);
      });
    });
  });
};
organizationSchema.methods.hidePassword = function hidePassword() {
  return R.omit(["password", "__v", "_id"], this.toObject({ virtuals: true }));
};

const Organization = mongoose.model("Organization", organizationSchema);

module.exports = Organization;
