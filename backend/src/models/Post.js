import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: 4,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: 40,
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 220,
      default: "",
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      minlength: 20,
    },
    coverImageUrl: {
      type: String,
      default: "",
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    comments: [commentSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Post = mongoose.model("Post", postSchema);
