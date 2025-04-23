import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "genfitsecretkey",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Try to find by username first, then by email if that fails
        let user = await storage.getUserByUsername(username);
        
        if (!user) {
          user = await storage.getUserByEmail(username);
        }
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if user already exists by username
      const existingUserByUsername = await storage.getUserByUsername(req.body.username);
      if (existingUserByUsername) {
        console.log("Registration failed: Username already exists", req.body.username);
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if user already exists by email
      const existingUserByEmail = await storage.getUserByEmail(req.body.email);
      if (existingUserByEmail) {
        console.log("Registration failed: Email already exists", req.body.email);
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create the user with hashed password
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      console.log("User registered successfully:", { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        user_type: user.user_type 
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      // Login the user
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: { message: string } | undefined) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      if (!user) {
        console.log("Login failed:", info?.message || "Invalid login credentials");
        return res.status(401).json({ message: info && info.message ? info.message : "Invalid login credentials" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Login session error:", err);
          return next(err);
        }
        
        console.log("User logged in successfully:", { 
          id: user.id, 
          username: user.username,
          user_type: user.user_type 
        });
        
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    if (!req.user) {
      console.log("Logout failed: User not logged in");
      return res.status(401).json({ message: "Not logged in" });
    }
    
    const userId = req.user.id;
    const username = req.user.username;
    
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout session error:", err);
        return next(err);
      }
      req.logout(() => {
        console.log("User logged out successfully:", { id: userId, username });
        res.clearCookie('connect.sid');
        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Don't send password back to client
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  // Apply for mentor/coach role
  app.post("/api/user/apply-role", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { role } = req.body;
      if (role !== 'mentor' && role !== 'coach') {
        return res.status(400).json({ message: "Invalid role specified" });
      }
      
      const updatedUser = await storage.updateUser(req.user.id, { role });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password back to client
      const { password, ...userWithoutPassword } = updatedUser;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Verify mentor/coach (admin only)
  app.post("/api/user/verify/:userId", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // In a real app, you would check if the current user is an admin
    // For now, we'll just allow any authenticated user to verify others
    try {
      const userId = parseInt(req.params.userId, 10);
      const verifiedUser = await storage.verifyMentor(userId);
      
      if (!verifiedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password back to client
      const { password, ...userWithoutPassword } = verifiedUser;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
}
