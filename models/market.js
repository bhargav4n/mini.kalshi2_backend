import mongoose from "mongoose";

// Market Db : 
const marketSchema = mongoose.Schema(
    {
        creatorId: { type : mongoose.Schema.Types.ObjectId, ref : 'users', required : true},
        title: { type : String, required : true, trim : true},
        totalissued: { type : Number, default : 0 },
        resolution: { type: String, enum: ["yes", "no", null], default: null }
    },
    { timestamps : true }
)

export const marketmodel = mongoose.model("market", marketSchema);