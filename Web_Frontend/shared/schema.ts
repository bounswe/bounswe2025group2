import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema with role
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  role: text("role").notNull().default("trainee"),
  verificationStatus: boolean("verification_status").default(false),
  interests: text("interests").array(),
  visibility: text("visibility").notNull().default("public"),
  createdAt: timestamp("created_at").defaultNow()
});

// Forums schema
export const forumThreads = pgTable("forum_threads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const forumReplies = pgTable("forum_replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const forumVotes = pgTable("forum_votes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id"),
  replyId: integer("reply_id"),
  userId: integer("user_id").notNull(),
  voteType: text("vote_type").notNull(), // "upvote" or "downvote"
  createdAt: timestamp("created_at").defaultNow()
});

export const forumBookmarks = pgTable("forum_bookmarks", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const forumFollowers = pgTable("forum_followers", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Goals schemas
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mentorId: integer("mentor_id"),
  title: text("title").notNull(),
  type: text("type").notNull(), // Walking/Running, Workout, Cycling, Swimming, Sports
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").default(0),
  unit: text("unit").notNull(), // miles, hours, etc.
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("active"), // active, completed, paused
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Sports Programs
export const sportsPrograms = pgTable("sports_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  sportType: text("sport_type").notNull(),
  ageGroups: text("age_groups").array().notNull(),
  cost: text("cost").notNull(),
  imageUrl: text("image_url"),
  contactInfo: text("contact_info").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Challenges
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // Daily/Weekly/Monthly step count, workout duration, calories
  targetValue: integer("target_value").notNull(),
  unit: text("unit").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const challengeParticipants = pgTable("challenge_participants", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull(),
  userId: integer("user_id").notNull(),
  progress: integer("progress").default(0),
  joined: timestamp("joined").defaultNow()
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // like, comment, tag, goal, challenge, etc.
  content: text("content").notNull(),
  relatedId: integer("related_id"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Schema validations
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
  bio: true,
  profileImage: true,
  role: true,
  interests: true,
  visibility: true,
}).extend({
  username: z.string().min(3).regex(/^[a-z][a-z0-9]*$/i, {
    message: "Username must start with a letter and contain only alphanumeric characters"
  }),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message: "Password must be at least 8 characters and contain at least one letter and one number"
  })
});

export const insertThreadSchema = createInsertSchema(forumThreads).pick({
  userId: true,
  title: true,
  category: true,
  tags: true,
});

export const insertPostSchema = createInsertSchema(forumPosts).pick({
  threadId: true,
  userId: true,
  content: true,
  imageUrl: true,
});

export const insertReplySchema = createInsertSchema(forumReplies).pick({
  postId: true,
  userId: true,
  content: true,
});

export const insertGoalSchema = createInsertSchema(goals).pick({
  userId: true,
  mentorId: true,
  title: true,
  type: true,
  targetValue: true,
  unit: true,
  endDate: true,
});

export const insertProgramSchema = createInsertSchema(sportsPrograms).pick({
  name: true,
  description: true,
  location: true,
  sportType: true,
  ageGroups: true,
  cost: true,
  imageUrl: true,
  contactInfo: true,
});

export const insertChallengeSchema = createInsertSchema(challenges).pick({
  creatorId: true,
  title: true,
  description: true,
  type: true,
  targetValue: true,
  unit: true,
  startDate: true,
  endDate: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  content: true,
  relatedId: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertForumThread = z.infer<typeof insertThreadSchema>;
export type ForumThread = typeof forumThreads.$inferSelect;

export type InsertForumPost = z.infer<typeof insertPostSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;

export type InsertForumReply = z.infer<typeof insertReplySchema>;
export type ForumReply = typeof forumReplies.$inferSelect;

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

export type InsertSportsProgram = z.infer<typeof insertProgramSchema>;
export type SportsProgram = typeof sportsPrograms.$inferSelect;

export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
