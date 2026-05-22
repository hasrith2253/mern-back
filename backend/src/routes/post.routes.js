import express from "express";
import { allowRoles, requireAuth } from "../middleware/auth.js";
import { Post } from "../models/Post.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { makeSlug } from "../utils/slug.js";

export const postRouter = express.Router();

const postPopulate = [
  { path: "author", select: "firstName lastName email role avatarUrl" },
  { path: "comments.user", select: "firstName lastName email role avatarUrl" },
];

const canManagePost = (post, user) => {
  return (
    user.role === "ADMIN" ||
    post.author?._id?.toString() === user._id.toString() ||
    post.author?.toString() === user._id.toString()
  );
};

postRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const posts = await Post.find({ isPublished: true }).sort({ createdAt: -1 }).populate(postPopulate);
    res.json({ message: "Posts", payload: posts });
  }),
);

postRouter.get(
  "/mine",
  requireAuth,
  allowRoles("AUTHOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const filter = req.user.role === "ADMIN" ? {} : { author: req.user._id };
    const posts = await Post.find(filter).sort({ createdAt: -1 }).populate(postPopulate);
    res.json({ message: "My posts", payload: posts });
  }),
);

postRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id).populate(postPopulate);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!post.isPublished && !canManagePost(post, req.user)) {
      return res.status(403).json({ message: "You are not authorized" });
    }

    res.json({ message: "Post", payload: post });
  }),
);

postRouter.post(
  "/",
  requireAuth,
  allowRoles("AUTHOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { title, category, summary, content, coverImageUrl, isPublished = true } = req.body;

    const post = await Post.create({
      author: req.user._id,
      title,
      slug: makeSlug(title),
      category,
      summary,
      content,
      coverImageUrl,
      isPublished,
    });

    await post.populate(postPopulate);
    res.status(201).json({ message: "Post created", payload: post });
  }),
);

postRouter.put(
  "/:id",
  requireAuth,
  allowRoles("AUTHOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!canManagePost(post, req.user)) {
      return res.status(403).json({ message: "You are not authorized" });
    }

    const previousTitle = post.title;
    const fields = ["title", "category", "summary", "content", "coverImageUrl", "isPublished"];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field];
      }
    });

    if (req.body.title && req.body.title !== previousTitle) {
      post.slug = makeSlug(req.body.title);
    }

    await post.save();
    await post.populate(postPopulate);

    res.json({ message: "Post updated", payload: post });
  }),
);

postRouter.patch(
  "/:id/publish",
  requireAuth,
  allowRoles("AUTHOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!canManagePost(post, req.user)) {
      return res.status(403).json({ message: "You are not authorized" });
    }

    post.isPublished = Boolean(req.body.isPublished);
    await post.save();
    await post.populate(postPopulate);

    res.json({ message: "Post status updated", payload: post });
  }),
);

postRouter.delete(
  "/:id",
  requireAuth,
  allowRoles("AUTHOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!canManagePost(post, req.user)) {
      return res.status(403).json({ message: "You are not authorized" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  }),
);

postRouter.post(
  "/:id/comments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post || !post.isPublished) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      user: req.user._id,
      body: req.body.body,
    });

    await post.save();
    await post.populate(postPopulate);

    res.status(201).json({ message: "Comment added", payload: post });
  }),
);

postRouter.delete(
  "/:postId/comments/:commentId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const ownsComment = comment.user.toString() === req.user._id.toString();

    if (!ownsComment && !canManagePost(post, req.user)) {
      return res.status(403).json({ message: "You are not authorized" });
    }

    comment.deleteOne();
    await post.save();
    await post.populate(postPopulate);

    res.json({ message: "Comment deleted", payload: post });
  }),
);
