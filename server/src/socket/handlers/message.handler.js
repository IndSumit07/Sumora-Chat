import Message from '../../models/Message.js';
import GroupMessage from '../../models/GroupMessage.js';
import Conversation from '../../models/Conversation.js';
import Group from '../../models/Group.js';
import { emitNewMessage, emitNewGroupMessage, emitMessageReaction } from '../../services/socket.service.js';
import { SOCKET_EVENTS, MESSAGE_TYPES } from '../../utils/constants.js';
import logger from '../../config/logger.js';

export const registerMessageHandlers = (socket, io) => {
  const userId = socket.userId;

  /**
   * Client-initiated message send (low-latency alternative to REST)
   * socket.emit('sendMessage', { conversationId, content, type, replyTo })
   */
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data, callback) => {
    try {
      const { conversationId, content, type = MESSAGE_TYPES.TEXT, replyTo } = data;

      if (!conversationId || (!content && type === MESSAGE_TYPES.TEXT)) {
        return callback?.({ error: 'Invalid message data' });
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return callback?.({ error: 'Conversation not found' });

      const isParticipant = conversation.participants.some((p) => p.toString() === userId);
      if (!isParticipant) return callback?.({ error: 'Not a participant' });

      const message = await Message.create({
        conversationId,
        sender: userId,
        content,
        type,
        replyTo: replyTo || null,
      });

      await message.populate('sender', 'fullName username avatar');

      conversation.lastMessage = message._id;
      conversation.lastMessageAt = message.createdAt;
      const receiverId = conversation.participants.find((p) => p.toString() !== userId);
      conversation.incrementUnread(receiverId.toString());
      await conversation.save();

      const messageObj = message.toJSON();
      emitNewMessage(conversationId, messageObj);

      callback?.({ success: true, message: messageObj });
    } catch (err) {
      logger.error(`Socket sendMessage error: ${err.message}`);
      callback?.({ error: 'Failed to send message' });
    }
  });

  /**
   * Mark messages as read via socket
   */
  socket.on(SOCKET_EVENTS.MARK_READ, async (data, callback) => {
    try {
      const { conversationId } = data;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return callback?.({ error: 'Conversation not found' });

      const otherParticipant = conversation.participants.find((p) => p.toString() !== userId);
      const readAt = new Date();

      await Message.updateMany(
        {
          conversationId,
          sender: otherParticipant,
          'readBy.user': { $ne: userId },
        },
        { $addToSet: { readBy: { user: userId, readAt } } }
      );

      conversation.resetUnread(userId);
      await conversation.save();

      io.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.MESSAGES_READ, {
        conversationId,
        readBy: userId,
        readAt,
      });

      callback?.({ success: true });
    } catch (err) {
      logger.error(`Socket markRead error: ${err.message}`);
      callback?.({ error: 'Failed to mark read' });
    }
  });

  /**
   * Message reaction via socket
   */
  socket.on(SOCKET_EVENTS.MESSAGE_REACTION, async (data, callback) => {
    try {
      const { messageId, emoji, isGroupMessage } = data;

      const Model = isGroupMessage ? GroupMessage : Message;
      const message = await Model.findById(messageId);
      if (!message) return callback?.({ error: 'Message not found' });

      const existingIdx = message.reactions.findIndex(
        (r) => r.user.toString() === userId && r.emoji === emoji
      );

      if (existingIdx > -1) {
        message.reactions.splice(existingIdx, 1);
      } else {
        const userIdx = message.reactions.findIndex((r) => r.user.toString() === userId);
        if (userIdx > -1) message.reactions.splice(userIdx, 1);
        message.reactions.push({ user: userId, emoji });
      }

      await message.save();

      const roomId = isGroupMessage
        ? `group:${message.groupId}`
        : `conv:${message.conversationId}`;

      io.to(roomId).emit(SOCKET_EVENTS.MESSAGE_REACTION, {
        messageId,
        reactions: message.reactions,
        userId,
        emoji,
        isGroupMessage,
      });

      callback?.({ success: true, reactions: message.reactions });
    } catch (err) {
      logger.error(`Socket reaction error: ${err.message}`);
      callback?.({ error: 'Failed to react' });
    }
  });
};
