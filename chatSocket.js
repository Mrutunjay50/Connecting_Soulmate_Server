// chatSocket.js
const getUserDetailsFromToken = require('./helper/getUserDetailsFromToken');
const User = require('./models/Users');
const { ConversationModel, MessageModel } = require('./models/conversationModel');
const getConversation = require('./helper/getConversation');
const { checkAcceptedInterestRequest } = require('./middleware/checkAcceptedInterestRequest');

exports.chatSocket = async (socket) => {
    const onlineUser = new Set();
    const token = socket.handshake.auth.token || "";
    const user = await getUserDetailsFromToken(token);
    onlineUser.add(user?._id?.toString());
    console.log(onlineUser);

    socket.on('onChatPage', async (userId) => {
      await getOrCreateConversationModel(userId)
    })

    socket.on('chatInitiated', async (data) => {
      console.log(data);
      await checkAcceptedInterestRequest(data);
    })
    // io.on('connection', async (socket) => {

    //   const token = socket.handshake.auth.token;
    //   const user = await getUserDetailsFromToken(token);

    //   socket.join(user?._id.toString());
    //   onlineUser.add(user?._id?.toString());

    //   console.log(onlineUser);

    //   io.emit('onlineUser', Array.from(onlineUser));

    //   socket.on('message-page', async (userId) => {
    //       const userDetails = await User.findById(userId).select("-password");

  socket.on('chatinitiated', async (data) => {
    // console.log(data);
    socket.emit('onlineUser', Array.from(onlineUser));
    const token = socket.handshake;
    const user = await getUserDetailsFromToken(token);
    socket.on('message-page', async (userId) => {
      const userDetails = await User.findById(userId).select("-password");

      const payload = {
        _id: userDetails._id,
        name: userDetails.name,
        email: userDetails.email,
        profile_pic: userDetails.profile_pic,
        online: onlineUser.has(userId)
      };
      socket.emit('message-user', payload);

      const getConversationMessage = await ConversationModel.findOne({
        "$or": [
          { sender: user._id, receiver: userId },
          { sender: userId, receiver: user._id }
        ]
      }).populate('messages').sort({ updatedAt: -1 });

      socket.emit('message', getConversationMessage?.messages || []);
    });

    socket.on('new message', async (data) => {
      let conversation = await ConversationModel.findOne({
        "$or": [
          { sender: data.sender, receiver: data.receiver },
          { sender: data.receiver, receiver: data.sender }
        ]
      });

      if (!conversation) {
        const createConversation = new ConversationModel({
          sender: data.sender,
          receiver: data.receiver
        });
        conversation = await createConversation.save();
      }

      const message = new MessageModel({
        text: data.text,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        msgByUserId: data.msgByUserId,
      });
      const saveMessage = await message.save();

      await ConversationModel.updateOne({ _id: conversation._id }, {
        "$push": { messages: saveMessage._id }
      });

      const getConversationMessage = await ConversationModel.findOne({
        "$or": [
          { sender: data.sender, receiver: data.receiver },
          { sender: data.receiver, receiver: data.sender }
        ]
      }).populate('messages').sort({ updatedAt: -1 });

      socket.to(data.sender).emit('message', getConversationMessage?.messages || []);
      socket.to(data.receiver).emit('message', getConversationMessage?.messages || []);

      const conversationSender = await getConversation(data.sender);
      const conversationReceiver = await getConversation(data.receiver);

      socket.to(data.sender).emit('conversation', conversationSender);
      socket.to(data.receiver).emit('conversation', conversationReceiver);
    });

    socket.on('sidebar', async (currentUserId) => {
      const conversation = await getConversation(currentUserId);
      socket.emit('conversation', conversation);
    });

    socket.on('seen', async (msgByUserId) => {
      let conversation = await ConversationModel.findOne({
        "$or": [
          { sender: user._id, receiver: msgByUserId },
          { sender: msgByUserId, receiver: user._id }
        ]
      });

      const conversationMessageId = conversation?.messages || [];

      await MessageModel.updateMany(
        { _id: { "$in": conversationMessageId }, msgByUserId: msgByUserId },
        { "$set": { seen: true } }
      );

      const conversationSender = await getConversation(user._id.toString());
      const conversationReceiver = await getConversation(msgByUserId);

      socket.to(user._id.toString()).emit('conversation', conversationSender);
      socket.to(msgByUserId).emit('conversation', conversationReceiver);
    });

    socket.on('disconnect', () => {
      onlineUser.delete(user._id.toString());
      console.log('User disconnected:', socket.id);
    });
  });
};
