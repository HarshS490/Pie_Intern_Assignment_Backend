import { Router, Request, Response, request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const VideoDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  videoUrl: z.string(),
  thumbnailUrl: z.string().url(),
  label: z.string(),
});

// Paging related constants
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const createVideo = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // check videoData existence
    if (!req.body.videoData) {
      return res.status(400).json({ message: "videoData missing " });
    }

    // validate the videoData object recieved in request.
    const parseResult = VideoDataSchema.safeParse(req.body.videoData);
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Invalid video data",
        errors: parseResult.error.errors,
      });
    }

    const videoData = parseResult.data;

    // create a new Video entry in database.
    const newVideo = await prisma.video.create({
      data: {
        description: videoData.description,
        title: videoData.title,
        videoUrl: videoData.videoUrl,
        metadata: {
          create: {
            label: videoData.label,
            thumbnailUrl: videoData.thumbnailUrl,
          },
        },
        user: {
          connect: {
            id: currentUser?.id,
          },
        },
      },
    });

    return res.json({ video: newVideo }).status(200);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const fetchAllVideos = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // accessing current page no. and pageSize from req;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(
      parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );

    // fetch all the videos
    const videos = await prisma.video.findMany({
      select: {
        metadata: {
          select: {
            thumbnailUrl: true,
            label: true,
          },
        },
        user: {
          select: {
            avatarUrl: true,
            username: true,
            id: true,
          },
        },
        description: true,
        id: true,
        title: true,
        createdAt: true,
      },

      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return res.status(200).json({ videos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const countInteractions = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const videoId = req.params.id;
    if (!videoId?.trim()) {
      return res.status(400).json({ message: "Invalid or missing videoId" });
    }

    const interactions = await prisma.interaction.groupBy({
      by: ["type"],
      where: { videoId },
      _count: {
        _all: true,
      },
    });

    const stats = { likes: 0, views: 0, comments: 0 };

    interactions.forEach(({ type, _count }) => {
      if (type === "like") stats.likes = _count._all;
      if (type === "view") stats.views = _count._all;
      if (type === "comment") stats.comments = _count._all;
    });
    return res.status(200).json({ stats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const fetchComments = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const videoId = req.params.id;
    if (!videoId?.trim()) {
      return res.status(400).json({ message: "Invalid or missing videoId" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(
      parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );

    // paginated comments
    const comments = await prisma.interaction.findMany({
      where: { videoId: videoId, type: "comment" },
      select: {
        content: true,
        id: true,
        user: {
          select: {
            id: true,
            avatarUrl: true,
            username: true,
          },
        },
        createdAt: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return res.status(200).json({ comments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const postLike = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const videoId = req.params.id;
    if (!videoId?.trim()) {
      return res.status(400).json({ message: "Invalid or missing videoId" });
    }

    const existingLike = await prisma.interaction.findFirst({
      where: {
        type: "like",
        userId: currentUser.id,
        videoId: videoId,
      },
    });
    if (existingLike) {
      return res
        .status(200)
        .json({ message: "user has already liked the video" });
    }
    const newLike = await prisma.interaction.create({
      data: {
        type: "like",
        userId: currentUser.id,
        videoId: videoId,
      },
      select: {
        createdAt: true,
        type: true,
        userId: true,
        videoId: true,
      },
    });
    return res.status(200).json({ like: newLike });
  } catch (error) {
    console.error("Unexpected Error in postLike: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const postComment = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const videoId = req.params.id;
    if (!videoId?.trim()) {
      return res.status(400).json({ message: "Invalid or missing videoId" });
    }

    const content: string = req.body.content;
    if (typeof content !== "string" || !content.trim()) {
      return res
        .status(400)
        .json({ message: "content not present in request body" });
    }

    const newComment = await prisma.interaction.create({
      data: {
        content: content,
        videoId: videoId,
        userId: currentUser.id,
        type: "comment",
      },
      select: {
        content: true,
        id: true,
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        createdAt: true,
      },
    });

    return res.status(200).json({ comment: newComment });
  } catch (error) {
    console.error("Unexpected Error in postLike: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  createVideo,
  fetchAllVideos,
  countInteractions,
  fetchComments,
  postLike,
  postComment,
};
