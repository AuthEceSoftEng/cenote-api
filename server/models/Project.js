const R = require("ramda");
const mongoose = require("mongoose");
const immutablePlugin = require("mongoose-immutable-plugin");
const uuid = require("uuid/v4");

const pid = () => `pid${uuid().replace(/-/g, "").slice(0, 11)}`;

const projectSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.ObjectId, ref: "Organization", required: true },
  collaborators: [{ type: mongoose.Schema.ObjectId, ref: "Organization" }],
  title: { type: String, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date },
  projectId: { type: String, default: pid, immutable: true, unique: true, trim: true }, // eslint-disable-line object-curly-newline
  readKeys: { type: Array, default: [uuid()] },
  writeKeys: { type: Array, default: [uuid()] },
  masterKeys: { type: Array, default: [uuid()] },
  redisHist: { type: Boolean, default: false },
});

projectSchema.plugin(immutablePlugin);
projectSchema.methods.hide = function hide() {
  return R.omit(["__v", "_id"], this.toObject());
};

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
