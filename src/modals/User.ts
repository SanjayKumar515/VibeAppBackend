import {Schema, model} from "mongoose";
import {UserProps} from "../types"

const UserSchema = new Schema<UserProps>({
  phoneNumber:{
    type:String,
    required:true,
    unique:true,
    trim:true
  },
  firebaseUid:{
    type:String,
    required:true,
    unique:true,
  },
  name:{
    type:String,
    default:""
  },

   avatar:{
    type:String,
    default:""
  },
   created:{
    type:String,
    default:Date.now
  }
})

export default model<UserProps>("User", UserSchema)