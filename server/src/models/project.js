const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['admin', 'member'], default: 'member' },
      },
    ],
    color: {
      type: String,
      default: '#1976d2', // project accent color for UI
    },
  },
  { timestamps: true }
);

// Virtual: all user IDs with access (owner + members)
ProjectSchema.virtual('allMembers').get(function () {
  return [this.owner, ...this.members.map((m) => m.user)];
});

module.exports = mongoose.model('Project', ProjectSchema);