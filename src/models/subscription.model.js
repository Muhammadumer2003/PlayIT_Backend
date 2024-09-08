import mongoose,{Schema} from "mongoose";

const SubscriptionSchema= new Schema({
    subscriber:{
        type : Schema.types.ObjectId,
        ref:User
    },
    channel:{
        type : Schema.types.ObjectId,
        ref:User

    }

},{timestamps:true});


export const Subscription=mongoose.model("Subscription",SubscriptionSchema);