const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    text : {
        type : String,
        default : ""
    },
    imageUrl : {
        type : String,
        default : ""
    },
    videoUrl : {
        type : String,
        default : ""
    },
    seen : {
        type : Boolean,
        default : false
    },
    senderVisible : {
        type : Boolean,
        default : true
    },
    receiverVisible : {
        type : Boolean,
        default : true
    },
    sender : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'User'
    },
    receiver : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'User'
    },
},{
    timestamps : true
})

const MessageModel = mongoose.model('Message',messageSchema)

module.exports = {
    MessageModel
}