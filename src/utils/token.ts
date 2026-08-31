import { UserProps } from "../types";
import jwt from "jsonwebtoken";

export const generateToken = (user:UserProps)=>{
    const payload = {
        user:{
            id:user.id,
            name:user.name,
            phoneNumber:user.phoneNumber,
            avatar: user.avatar,
            about: user.about,
        }
    }
  return jwt.sign(payload, process.env.JWT_SECRET as string ,{
    expiresIn :'30d'

  })

}