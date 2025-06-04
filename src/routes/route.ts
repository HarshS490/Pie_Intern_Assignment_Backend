import { Router, Request, Response } from "express";
import { dummyUser } from "../lib/dummyUser.js";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  countInteractions,
  createVideo,
  fetchAllVideos,
  fetchComments,
  postComment,
  postLike,
} from "../controllers/video.controller.js";

export const router = Router();

// dummy auth
router.get("/auth", (req: Request, res: Response) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing");
      return res.status(500).json({ message: "Internal Server Error!" });
    }
    const token = "Bearer " + jwt.sign(dummyUser, process.env.JWT_SECRET);
    return res.status(200).json({ token });
  } catch (error) {
    console.error(error);

    return res.json({ message: "Internal Server Error" }).status(500);
  }
});

// video creation
router.post("/videos", authMiddleware, createVideo);

// retrieving all the videos
router.get("/videos", authMiddleware, fetchAllVideos);

// route to get a video's interactions counts (like ,comments or views)
router.get("/interactions/video/:id",authMiddleware, countInteractions);

// route to fetch the comments related to a video
router.get("/comments/video/:id", authMiddleware, fetchComments);

router.post("/like/video/:id",authMiddleware,postLike);

router.post("/comment/video/:id",authMiddleware, postComment); 

export default router;
