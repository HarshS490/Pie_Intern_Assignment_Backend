import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader === null || authHeader === undefined) {
    return res
      .status(401)
      .json({ message: "Unauthorized: missing authorziation token" });
  }

  const token = authHeader.split(" ")[1];
  const authSecret = process.env.JWT_SECRET;
  if(!authSecret){
    throw new Error("Missing jwt secret from environment variables.");
  }
  jwt.verify(token,authSecret,(err,user)=>{
    if(err) return res.status(401).json({status:401,message:"Unauthorized"});
    req.user = user as AuthUser;
    
    next();
  })
};
