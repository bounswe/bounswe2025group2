import { 
  users, User, InsertUser,
  forumThreads, ForumThread, InsertForumThread,
  forumPosts, ForumPost, InsertForumPost,
  forumReplies, ForumReply, InsertForumReply,
  forumVotes, forumBookmarks, forumFollowers,
  goals, Goal, InsertGoal,
  sportsPrograms, SportsProgram, InsertSportsProgram,
  challenges, Challenge, InsertChallenge,
  challengeParticipants,
  notifications, Notification, InsertNotification
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  verifyMentor(id: number): Promise<User | undefined>;
  
  // Forum operations
  createThread(thread: InsertForumThread): Promise<ForumThread>;
  getThreads(limit?: number, offset?: number): Promise<ForumThread[]>;
  getThreadsByCategory(category: string): Promise<ForumThread[]>;
  getThreadById(id: number): Promise<ForumThread | undefined>;
  
  createPost(post: InsertForumPost): Promise<ForumPost>;
  getPostsByThreadId(threadId: number): Promise<ForumPost[]>;
  
  createReply(reply: InsertForumReply): Promise<ForumReply>;
  getRepliesByPostId(postId: number): Promise<ForumReply[]>;
  
  addVote(userId: number, postId?: number, replyId?: number, voteType?: string): Promise<void>;
  removeVote(userId: number, postId?: number, replyId?: number): Promise<void>;
  getVotesByUser(userId: number): Promise<any[]>;
  
  bookmarkThread(userId: number, threadId: number): Promise<void>;
  unbookmarkThread(userId: number, threadId: number): Promise<void>;
  getBookmarksByUser(userId: number): Promise<number[]>;
  
  followThread(userId: number, threadId: number): Promise<void>;
  unfollowThread(userId: number, threadId: number): Promise<void>;
  getFollowedThreadsByUser(userId: number): Promise<number[]>;
  
  // Goal operations
  createGoal(goal: InsertGoal): Promise<Goal>;
  getGoalsByUser(userId: number): Promise<Goal[]>;
  getGoalsByMentor(mentorId: number): Promise<Goal[]>;
  updateGoalProgress(id: number, progress: number): Promise<Goal | undefined>;
  
  // Sports programs
  createProgram(program: InsertSportsProgram): Promise<SportsProgram>;
  getAllPrograms(): Promise<SportsProgram[]>;
  getProgramById(id: number): Promise<SportsProgram | undefined>;
  searchPrograms(query: string, filters?: any): Promise<SportsProgram[]>;
  
  // Challenge operations
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  getChallenges(): Promise<Challenge[]>;
  getChallengeById(id: number): Promise<Challenge | undefined>;
  joinChallenge(userId: number, challengeId: number): Promise<void>;
  updateChallengeProgress(userId: number, challengeId: number, progress: number): Promise<void>;
  getChallengeLeaderboard(challengeId: number): Promise<any[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private threads: Map<number, ForumThread>;
  private posts: Map<number, ForumPost>;
  private replies: Map<number, ForumReply>;
  private votes: Map<number, any>;
  private bookmarks: Map<number, any>;
  private followers: Map<number, any>;
  private goals: Map<number, Goal>;
  private programs: Map<number, SportsProgram>;
  private challenges: Map<number, Challenge>;
  private participants: Map<number, any>;
  private notifications: Map<number, Notification>;

  private nextUserId: number;
  private nextThreadId: number;
  private nextPostId: number;
  private nextReplyId: number;
  private nextVoteId: number;
  private nextBookmarkId: number;
  private nextFollowerId: number;
  private nextGoalId: number;
  private nextProgramId: number;
  private nextChallengeId: number;
  private nextParticipantId: number;
  private nextNotificationId: number;

  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.threads = new Map();
    this.posts = new Map();
    this.replies = new Map();
    this.votes = new Map();
    this.bookmarks = new Map();
    this.followers = new Map();
    this.goals = new Map();
    this.programs = new Map();
    this.challenges = new Map();
    this.participants = new Map();
    this.notifications = new Map();

    this.nextUserId = 1;
    this.nextThreadId = 1;
    this.nextPostId = 1;
    this.nextReplyId = 1;
    this.nextVoteId = 1;
    this.nextBookmarkId = 1;
    this.nextFollowerId = 1;
    this.nextGoalId = 1;
    this.nextProgramId = 1;
    this.nextChallengeId = 1;
    this.nextParticipantId = 1;
    this.nextNotificationId = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Create some initial data
    this.seedInitialData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.nextUserId++;
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async verifyMentor(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, verificationStatus: true };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Forum operations
  async createThread(thread: InsertForumThread): Promise<ForumThread> {
    const id = this.nextThreadId++;
    const now = new Date();
    const newThread: ForumThread = { 
      ...thread, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.threads.set(id, newThread);
    return newThread;
  }

  async getThreads(limit: number = 10, offset: number = 0): Promise<ForumThread[]> {
    return Array.from(this.threads.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async getThreadsByCategory(category: string): Promise<ForumThread[]> {
    return Array.from(this.threads.values())
      .filter(thread => thread.category === category)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getThreadById(id: number): Promise<ForumThread | undefined> {
    return this.threads.get(id);
  }

  async createPost(post: InsertForumPost): Promise<ForumPost> {
    const id = this.nextPostId++;
    const now = new Date();
    const newPost: ForumPost = { 
      ...post, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.posts.set(id, newPost);
    return newPost;
  }

  async getPostsByThreadId(threadId: number): Promise<ForumPost[]> {
    return Array.from(this.posts.values())
      .filter(post => post.threadId === threadId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createReply(reply: InsertForumReply): Promise<ForumReply> {
    const id = this.nextReplyId++;
    const now = new Date();
    const newReply: ForumReply = { 
      ...reply, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.replies.set(id, newReply);
    return newReply;
  }

  async getRepliesByPostId(postId: number): Promise<ForumReply[]> {
    return Array.from(this.replies.values())
      .filter(reply => reply.postId === postId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async addVote(userId: number, postId?: number, replyId?: number, voteType: string = 'upvote'): Promise<void> {
    const existingVote = Array.from(this.votes.values()).find(
      vote => vote.userId === userId && 
        ((postId && vote.postId === postId) || (replyId && vote.replyId === replyId))
    );

    if (existingVote) {
      existingVote.voteType = voteType;
      this.votes.set(existingVote.id, existingVote);
    } else {
      const id = this.nextVoteId++;
      this.votes.set(id, {
        id,
        userId,
        postId,
        replyId,
        voteType,
        createdAt: new Date()
      });
    }
  }

  async removeVote(userId: number, postId?: number, replyId?: number): Promise<void> {
    const voteEntry = Array.from(this.votes.entries()).find(
      ([_, vote]) => vote.userId === userId && 
        ((postId && vote.postId === postId) || (replyId && vote.replyId === replyId))
    );

    if (voteEntry) {
      this.votes.delete(voteEntry[0]);
    }
  }

  async getVotesByUser(userId: number): Promise<any[]> {
    return Array.from(this.votes.values()).filter(vote => vote.userId === userId);
  }

  async bookmarkThread(userId: number, threadId: number): Promise<void> {
    const existing = Array.from(this.bookmarks.values()).find(
      bookmark => bookmark.userId === userId && bookmark.threadId === threadId
    );

    if (!existing) {
      const id = this.nextBookmarkId++;
      this.bookmarks.set(id, {
        id,
        userId,
        threadId,
        createdAt: new Date()
      });
    }
  }

  async unbookmarkThread(userId: number, threadId: number): Promise<void> {
    const bookmarkEntry = Array.from(this.bookmarks.entries()).find(
      ([_, bookmark]) => bookmark.userId === userId && bookmark.threadId === threadId
    );

    if (bookmarkEntry) {
      this.bookmarks.delete(bookmarkEntry[0]);
    }
  }

  async getBookmarksByUser(userId: number): Promise<number[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId)
      .map(bookmark => bookmark.threadId);
  }

  async followThread(userId: number, threadId: number): Promise<void> {
    const existing = Array.from(this.followers.values()).find(
      follower => follower.userId === userId && follower.threadId === threadId
    );

    if (!existing) {
      const id = this.nextFollowerId++;
      this.followers.set(id, {
        id,
        userId,
        threadId,
        createdAt: new Date()
      });
    }
  }

  async unfollowThread(userId: number, threadId: number): Promise<void> {
    const followerEntry = Array.from(this.followers.entries()).find(
      ([_, follower]) => follower.userId === userId && follower.threadId === threadId
    );

    if (followerEntry) {
      this.followers.delete(followerEntry[0]);
    }
  }

  async getFollowedThreadsByUser(userId: number): Promise<number[]> {
    return Array.from(this.followers.values())
      .filter(follower => follower.userId === userId)
      .map(follower => follower.threadId);
  }

  // Goal operations
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const id = this.nextGoalId++;
    const now = new Date();
    const newGoal: Goal = { 
      ...goal, 
      id, 
      currentValue: 0,
      status: 'active',
      startDate: now,
      createdAt: now,
      updatedAt: now
    };
    this.goals.set(id, newGoal);
    return newGoal;
  }

  async getGoalsByUser(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values())
      .filter(goal => goal.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getGoalsByMentor(mentorId: number): Promise<Goal[]> {
    return Array.from(this.goals.values())
      .filter(goal => goal.mentorId === mentorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateGoalProgress(id: number, progress: number): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;

    const updatedGoal = { 
      ...goal, 
      currentValue: progress,
      status: progress >= goal.targetValue ? 'completed' : 'active',
      updatedAt: new Date()
    };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  // Sports programs
  async createProgram(program: InsertSportsProgram): Promise<SportsProgram> {
    const id = this.nextProgramId++;
    const now = new Date();
    const newProgram: SportsProgram = { 
      ...program, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.programs.set(id, newProgram);
    return newProgram;
  }

  async getAllPrograms(): Promise<SportsProgram[]> {
    return Array.from(this.programs.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProgramById(id: number): Promise<SportsProgram | undefined> {
    return this.programs.get(id);
  }

  async searchPrograms(query: string, filters?: any): Promise<SportsProgram[]> {
    let results = Array.from(this.programs.values());
    
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      results = results.filter(program => 
        program.name.toLowerCase().includes(lowercaseQuery) ||
        program.description.toLowerCase().includes(lowercaseQuery) ||
        program.sportType.toLowerCase().includes(lowercaseQuery)
      );
    }
    
    if (filters) {
      if (filters.ageGroup) {
        results = results.filter(program => 
          program.ageGroups.some(age => age === filters.ageGroup)
        );
      }
      
      if (filters.sportType) {
        results = results.filter(program => 
          program.sportType === filters.sportType
        );
      }
      
      if (filters.location) {
        results = results.filter(program => 
          program.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }
    }
    
    return results;
  }

  // Challenge operations
  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const id = this.nextChallengeId++;
    const now = new Date();
    const newChallenge: Challenge = { 
      ...challenge, 
      id, 
      status: 'active',
      createdAt: now,
      updatedAt: now
    };
    this.challenges.set(id, newChallenge);
    return newChallenge;
  }

  async getChallenges(): Promise<Challenge[]> {
    return Array.from(this.challenges.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getChallengeById(id: number): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }

  async joinChallenge(userId: number, challengeId: number): Promise<void> {
    const existing = Array.from(this.participants.values()).find(
      participant => participant.userId === userId && participant.challengeId === challengeId
    );

    if (!existing) {
      const id = this.nextParticipantId++;
      this.participants.set(id, {
        id,
        userId,
        challengeId,
        progress: 0,
        joined: new Date()
      });
    }
  }

  async updateChallengeProgress(userId: number, challengeId: number, progress: number): Promise<void> {
    const participant = Array.from(this.participants.values()).find(
      p => p.userId === userId && p.challengeId === challengeId
    );

    if (participant) {
      participant.progress = progress;
      this.participants.set(participant.id, participant);
    }
  }

  async getChallengeLeaderboard(challengeId: number): Promise<any[]> {
    return Array.from(this.participants.values())
      .filter(p => p.challengeId === challengeId)
      .sort((a, b) => b.progress - a.progress)
      .map(p => ({
        userId: p.userId,
        progress: p.progress,
        joined: p.joined
      }));
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.nextNotificationId++;
    const newNotification: Notification = { 
      ...notification, 
      id, 
      read: false,
      createdAt: new Date()
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markNotificationAsRead(id: number): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
      this.notifications.set(id, notification);
    }
  }

  // Seed initial data for testing
  private seedInitialData() {
    // This will be populated by the API calls when users register
  }
}

export const storage = new MemStorage();
