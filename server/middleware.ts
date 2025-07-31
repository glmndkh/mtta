import { Request, Response, NextFunction } from "express";

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  next();
};

export const isClubOwner = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  if (!user || !['admin', 'club_owner'].includes(user.role)) {
    return res.status(403).json({ message: "Forbidden - Club owner access required" });
  }
  next();
};