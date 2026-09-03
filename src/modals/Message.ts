import mongoose from "mongoose";


const messageSchema = new mongoose.Schema({
    conversationId:{
        type:mongoose.Schema.Types.ObjectId,
        ref : "Conversation",
        required:true
    },
     senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref : "User",
        required:true
    },
    content:String,
    attachement:String,
    audio:String,
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent"
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
},{
  timestamps:true
})

const Message = mongoose.model("Message", messageSchema);
export default Message;