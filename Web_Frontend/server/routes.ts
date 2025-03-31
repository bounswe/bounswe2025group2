import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertThreadSchema,
  insertPostSchema,
  insertReplySchema,
  insertGoalSchema,
  insertProgramSchema,
  insertChallengeSchema,
  insertNotificationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "You must be logged in" });
  };

  // Forum Routes
  
  // Get all threads
  app.get("/api/forum/threads", async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const threads = await storage.getThreads(limit, offset);
      
      // Enhance threads with post counts and other metadata
      const threadsWithMeta = await Promise.all(threads.map(async (thread) => {
        const posts = await storage.getPostsByThreadId(thread.id);
        return {
          ...thread,
          postCount: posts.length,
          firstPost: posts[0]
        };
      }));
      
      res.json(threadsWithMeta);
    } catch (error) {
      next(error);
    }
  });

  // Get threads by category
  app.get("/api/forum/threads/category/:category", async (req, res, next) => {
    try {
      const category = req.params.category;
      const threads = await storage.getThreadsByCategory(category);
      
      // Enhance threads with post counts and other metadata
      const threadsWithMeta = await Promise.all(threads.map(async (thread) => {
        const posts = await storage.getPostsByThreadId(thread.id);
        return {
          ...thread,
          postCount: posts.length,
          firstPost: posts[0]
        };
      }));
      
      res.json(threadsWithMeta);
    } catch (error) {
      next(error);
    }
  });

  // Get thread by ID with posts and replies
  app.get("/api/forum/threads/:id", async (req, res, next) => {
    try {
      const threadId = parseInt(req.params.id, 10);
      const thread = await storage.getThreadById(threadId);
      
      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }
      
      const posts = await storage.getPostsByThreadId(threadId);
      
      // For each post, get its replies
      const postsWithReplies = await Promise.all(posts.map(async (post) => {
        const replies = await storage.getRepliesByPostId(post.id);
        return {
          ...post,
          replies
        };
      }));
      
      res.json({
        ...thread,
        posts: postsWithReplies
      });
    } catch (error) {
      next(error);
    }
  });

  // Create a new thread
  app.post("/api/forum/threads", isAuthenticated, async (req, res, next) => {
    try {
      const parsedData = insertThreadSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const newThread = await storage.createThread(parsedData);
      
      // If a post content is provided, create the first post
      if (req.body.postContent) {
        await storage.createPost({
          threadId: newThread.id,
          userId: req.user!.id,
          content: req.body.postContent,
          imageUrl: req.body.imageUrl
        });
      }
      
      res.status(201).json(newThread);
    } catch (error) {
      next(error);
    }
  });

  // Create a post in a thread
  app.post("/api/forum/posts", isAuthenticated, async (req, res, next) => {
    try {
      const parsedData = insertPostSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const newPost = await storage.createPost(parsedData);
      
      // Check if we need to create a notification
      const thread = await storage.getThreadById(parsedData.threadId);
      if (thread && thread.userId !== req.user!.id) {
        await storage.createNotification({
          userId: thread.userId,
          type: "post",
          content: `${req.user!.username} posted in your thread`,
          relatedId: newPost.id
        });
      }
      
      res.status(201).json(newPost);
    } catch (error) {
      next(error);
    }
  });

  // Create a reply to a post
  app.post("/api/forum/replies", isAuthenticated, async (req, res, next) => {
    try {
      const parsedData = insertReplySchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const newReply = await storage.createReply(parsedData);
      
      // Notify the post author
      const post = await storage.getPostsByThreadId(req.body.threadId)
        .then(posts => posts.find(p => p.id === parsedData.postId));
      
      if (post && post.userId !== req.user!.id) {
        await storage.createNotification({
          userId: post.userId,
          type: "reply",
          content: `${req.user!.username} replied to your post`,
          relatedId: newReply.id
        });
      }
      
      res.status(201).json(newReply);
    } catch (error) {
      next(error);
    }
  });

  // Upvote a post
  app.post("/api/forum/posts/:id/upvote", isAuthenticated, async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id, 10);
      await storage.addVote(req.user!.id, postId, undefined, "upvote");
      
      // Notify the post author
      const post = await storage.getPostsByThreadId(0)
        .then(posts => posts.find(p => p.id === postId));
      
      if (post && post.userId !== req.user!.id) {
        await storage.createNotification({
          userId: post.userId,
          type: "vote",
          content: `${req.user!.username} upvoted your post`,
          relatedId: postId
        });
      }
      
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Downvote a post
  app.post("/api/forum/posts/:id/downvote", isAuthenticated, async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id, 10);
      await storage.addVote(req.user!.id, postId, undefined, "downvote");
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Remove vote from a post
  app.delete("/api/forum/posts/:id/vote", isAuthenticated, async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id, 10);
      await storage.removeVote(req.user!.id, postId);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Bookmark a thread
  app.post("/api/forum/threads/:id/bookmark", isAuthenticated, async (req, res, next) => {
    try {
      const threadId = parseInt(req.params.id, 10);
      await storage.bookmarkThread(req.user!.id, threadId);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Remove bookmark from a thread
  app.delete("/api/forum/threads/:id/bookmark", isAuthenticated, async (req, res, next) => {
    try {
      const threadId = parseInt(req.params.id, 10);
      await storage.unbookmarkThread(req.user!.id, threadId);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Follow a thread
  app.post("/api/forum/threads/:id/follow", isAuthenticated, async (req, res, next) => {
    try {
      const threadId = parseInt(req.params.id, 10);
      await storage.followThread(req.user!.id, threadId);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Unfollow a thread
  app.delete("/api/forum/threads/:id/follow", isAuthenticated, async (req, res, next) => {
    try {
      const threadId = parseInt(req.params.id, 10);
      await storage.unfollowThread(req.user!.id, threadId);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Goal Routes

  // Create a new goal
  app.post("/api/goals", isAuthenticated, async (req, res, next) => {
    try {
      const parsedData = insertGoalSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const newGoal = await storage.createGoal(parsedData);
      
      // If the goal has a mentor, notify them
      if (parsedData.mentorId) {
        await storage.createNotification({
          userId: parsedData.mentorId,
          type: "goal_assigned",
          content: `${req.user!.username} set a new goal that needs your guidance`,
          relatedId: newGoal.id
        });
      }
      
      res.status(201).json(newGoal);
    } catch (error) {
      next(error);
    }
  });

  // Get user's goals
  app.get("/api/goals", isAuthenticated, async (req, res, next) => {
    try {
      const goals = await storage.getGoalsByUser(req.user!.id);
      res.json(goals);
    } catch (error) {
      next(error);
    }
  });

  // Get goals assigned to a mentor
  app.get("/api/mentor/goals", isAuthenticated, async (req, res, next) => {
    try {
      // Check if user is a mentor or coach
      if (req.user!.role !== 'mentor' && req.user!.role !== 'coach') {
        return res.status(403).json({ message: "Access denied. User is not a mentor or coach" });
      }
      
      const goals = await storage.getGoalsByMentor(req.user!.id);
      res.json(goals);
    } catch (error) {
      next(error);
    }
  });

  // Update goal progress
  app.patch("/api/goals/:id/progress", isAuthenticated, async (req, res, next) => {
    try {
      const goalId = parseInt(req.params.id, 10);
      const { progress } = req.body;
      
      if (typeof progress !== 'number') {
        return res.status(400).json({ message: "Progress must be a number" });
      }
      
      const updatedGoal = await storage.updateGoalProgress(goalId, progress);
      
      if (!updatedGoal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // Check if this is a goal assigned by a mentor
      if (updatedGoal.mentorId) {
        await storage.createNotification({
          userId: updatedGoal.mentorId,
          type: "goal_progress",
          content: `${req.user!.username} updated their progress on a goal you assigned`,
          relatedId: goalId
        });
      }
      
      // Check if goal is completed
      if (updatedGoal.status === 'completed') {
        await storage.createNotification({
          userId: req.user!.id,
          type: "goal_completed",
          content: `Congratulations! You've completed your goal: ${updatedGoal.title}`,
          relatedId: goalId
        });
      }
      
      res.json(updatedGoal);
    } catch (error) {
      next(error);
    }
  });

  // Programs Routes

  // Create a new program
  app.post("/api/programs", isAuthenticated, async (req, res, next) => {
    try {
      // In a real app, verify that the user has admin permissions
      const parsedData = insertProgramSchema.parse(req.body);
      const newProgram = await storage.createProgram(parsedData);
      res.status(201).json(newProgram);
    } catch (error) {
      next(error);
    }
  });

  // Get all programs
  app.get("/api/programs", async (req, res, next) => {
    try {
      const programs = await storage.getAllPrograms();
      res.json(programs);
    } catch (error) {
      next(error);
    }
  });

  // Get a specific program
  app.get("/api/programs/:id", async (req, res, next) => {
    try {
      const programId = parseInt(req.params.id, 10);
      const program = await storage.getProgramById(programId);
      
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      res.json(program);
    } catch (error) {
      next(error);
    }
  });

  // Search programs
  app.get("/api/programs/search", async (req, res, next) => {
    try {
      const query = req.query.q as string || '';
      const filters = {
        ageGroup: req.query.ageGroup as string,
        sportType: req.query.sportType as string,
        location: req.query.location as string
      };
      
      const programs = await storage.searchPrograms(query, filters);
      res.json(programs);
    } catch (error) {
      next(error);
    }
  });

  // Challenge Routes

  // Create a new challenge
  app.post("/api/challenges", isAuthenticated, async (req, res, next) => {
    try {
      const parsedData = insertChallengeSchema.parse({
        ...req.body,
        creatorId: req.user!.id
      });
      
      const newChallenge = await storage.createChallenge(parsedData);
      res.status(201).json(newChallenge);
    } catch (error) {
      next(error);
    }
  });

  // Get all challenges
  app.get("/api/challenges", async (req, res, next) => {
    try {
      const challenges = await storage.getChallenges();
      res.json(challenges);
    } catch (error) {
      next(error);
    }
  });

  // Get specific challenge
  app.get("/api/challenges/:id", async (req, res, next) => {
    try {
      const challengeId = parseInt(req.params.id, 10);
      const challenge = await storage.getChallengeById(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      res.json(challenge);
    } catch (error) {
      next(error);
    }
  });

  // Join a challenge
  app.post("/api/challenges/:id/join", isAuthenticated, async (req, res, next) => {
    try {
      const challengeId = parseInt(req.params.id, 10);
      await storage.joinChallenge(req.user!.id, challengeId);
      
      // Notify the challenge creator
      const challenge = await storage.getChallengeById(challengeId);
      if (challenge && challenge.creatorId !== req.user!.id) {
        await storage.createNotification({
          userId: challenge.creatorId,
          type: "challenge_join",
          content: `${req.user!.username} joined your challenge`,
          relatedId: challengeId
        });
      }
      
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Update challenge progress
  app.patch("/api/challenges/:id/progress", isAuthenticated, async (req, res, next) => {
    try {
      const challengeId = parseInt(req.params.id, 10);
      const { progress } = req.body;
      
      if (typeof progress !== 'number') {
        return res.status(400).json({ message: "Progress must be a number" });
      }
      
      await storage.updateChallengeProgress(req.user!.id, challengeId, progress);
      
      // Get the challenge to check if completed
      const challenge = await storage.getChallengeById(challengeId);
      if (challenge && progress >= challenge.targetValue) {
        // Notify the user of completion
        await storage.createNotification({
          userId: req.user!.id,
          type: "challenge_completed",
          content: `Congratulations! You've completed the challenge: ${challenge.title}`,
          relatedId: challengeId
        });
      }
      
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Get challenge leaderboard
  app.get("/api/challenges/:id/leaderboard", async (req, res, next) => {
    try {
      const challengeId = parseInt(req.params.id, 10);
      const leaderboard = await storage.getChallengeLeaderboard(challengeId);
      
      // Enhance with user information
      const enhancedLeaderboard = await Promise.all(leaderboard.map(async (entry) => {
        const user = await storage.getUser(entry.userId);
        return {
          ...entry,
          username: user?.username,
          name: user?.name
        };
      }));
      
      res.json(enhancedLeaderboard);
    } catch (error) {
      next(error);
    }
  });

  // Notification Routes

  // Get user's notifications
  app.get("/api/notifications", isAuthenticated, async (req, res, next) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res, next) => {
    try {
      const notificationId = parseInt(req.params.id, 10);
      await storage.markNotificationAsRead(notificationId);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Profile Routes
  
  // Update user profile
  app.patch("/api/user/profile", isAuthenticated, async (req, res, next) => {
    try {
      // Only allow updating specific fields
      const allowedFields = ['name', 'bio', 'profileImage', 'interests', 'visibility'];
      const updateData: Partial<SelectUser> = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field as keyof SelectUser] = req.body[field];
        }
      }
      
      const updatedUser = await storage.updateUser(req.user!.id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password back to client
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Get user profile by username
  app.get("/api/users/:username", async (req, res, next) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password back to client
      const { password, ...userWithoutPassword } = user;
      
      // If user has private visibility, only return basic info
      if (user.visibility === 'private' && (!req.isAuthenticated() || req.user!.id !== user.id)) {
        return res.json({
          id: user.id,
          username: user.username,
          name: user.name,
          profileImage: user.profileImage,
          role: user.role,
          verificationStatus: user.verificationStatus,
          visibility: user.visibility
        });
      }
      
      // Return full profile for public or owner
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
