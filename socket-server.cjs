const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Load environment variables from .env manually
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        process.env[key] = val;
      }
    });
  }
} catch (err) {
  console.error('Failed to read .env file:', err);
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('CRITICAL ERROR: JWT_SECRET not found in environment');
  process.exit(1);
}

const prisma = new PrismaClient();
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('MyBuko Socket.io Server Active\n');
});

const io = new Server(server, {
  cors: {
    origin: '*', // Allow connections from frontend
    methods: ['GET', 'POST']
  }
});

// Middleware to authenticate socket connections via JWT
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication failed: Token required'));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication failed: Invalid token'));
      }
      socket.userId = decoded.userId;
      next();
    });
  } catch (err) {
    console.error('Auth middleware error:', err);
    next(new Error('Authentication internal error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected to WebSockets: ${socket.userId} (Socket ID: ${socket.id})`);

  // 1. Join Room
  socket.on('join_room', async ({ chatId }) => {
    if (!chatId) return;

    // Verify user is a participant of this chat
    try {
      const participant = await prisma.chatParticipant.findFirst({
        where: { chatId, userId: socket.userId }
      });

      if (!participant) {
        socket.emit('error_message', { error: 'Access denied: Not a participant of this chat' });
        return;
      }

      socket.join(chatId);
      console.log(`Socket ${socket.id} joined room: ${chatId}`);

      // Update lastSeenAt for this participant on join
      const now = new Date();
      await prisma.chatParticipant.update({
        where: {
          chatId_userId: { chatId, userId: socket.userId }
        },
        data: {
          lastSeenAt: now
        }
      });

      // Broadcast mark_seen event to other users in room
      socket.to(chatId).emit('mark_seen', {
        chatId,
        userId: socket.userId,
        lastSeenAt: now
      });

    } catch (err) {
      console.error('Error in join_room:', err);
    }
  });

  // 2. Leave Room
  socket.on('leave_room', ({ chatId }) => {
    if (!chatId) return;
    socket.leave(chatId);
    console.log(`Socket ${socket.id} left room: ${chatId}`);
  });

  // 3. Send Message
  socket.on('send_message', async ({ chatId, text, fileUrl, fileType }) => {
    if (!chatId) return;

    try {
      // Confirm participant
      const participant = await prisma.chatParticipant.findFirst({
        where: { chatId, userId: socket.userId }
      });
      if (!participant) {
        socket.emit('error_message', { error: 'Forbidden' });
        return;
      }

      // 1. Save to database
      const message = await prisma.message.create({
        data: {
          chatId,
          senderId: socket.userId,
          text: text || null,
          fileUrl: fileUrl || null,
          fileType: fileType || null
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true
            }
          }
        }
      });

      // 2. Update parent chat's updatedAt timestamp
      const now = new Date();
      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: now }
      });

      // Also mark seen for the sender immediately
      await prisma.chatParticipant.update({
        where: {
          chatId_userId: { chatId, userId: socket.userId }
        },
        data: { lastSeenAt: now }
      });

      // 3. Broadcast message to room (both sender and receiver)
      io.to(chatId).emit('message', message);

      // 4. Update the chat list for all participants (for live updating sidebars)
      // Get participants userIds
      const allParts = await prisma.chatParticipant.findMany({
        where: { chatId }
      });
      allParts.forEach(p => {
        io.emit(`chat_list_update:${p.userId}`, {
          chatId,
          lastMessage: message,
          updatedAt: now
        });
      });
    } catch (err) {
      console.error('Error in send_message socket handler:', err);
      socket.emit('error_message', { error: 'Failed to deliver message' });
    }
  });

  // 3.5. Broadcast Saved Message (sent via REST)
  socket.on('broadcast_saved_message', ({ chatId, message }) => {
    if (!chatId || !message) return;

    // Broadcast message to other room participants in real-time
    socket.to(chatId).emit('message', message);

    // Update the chat list for all participants
    const now = new Date();
    prisma.chatParticipant.findMany({
      where: { chatId }
    }).then(allParts => {
      allParts.forEach(p => {
        io.emit(`chat_list_update:${p.userId}`, {
          chatId,
          lastMessage: message,
          updatedAt: now
        });
      });
    }).catch(err => {
      console.error('Error in broadcast_saved_message list update:', err);
    });
  });

  // 3.7. Message Reactions
  socket.on('react_message', async ({ chatId, messageId, emoji }) => {
    if (!chatId || !messageId || !emoji) return;

    try {
      // 1. Fetch current message reactions
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { reactions: true }
      });

      if (!message) return;

      // 2. Append new reaction
      const currentReactions = message.reactions ? message.reactions.split(',').filter(Boolean) : [];
      currentReactions.push(emoji);
      const updatedReactions = currentReactions.join(',');

      // 3. Update database
      await prisma.message.update({
        where: { id: messageId },
        data: { reactions: updatedReactions }
      });

      // 4. Broadcast the reaction in real-time to everyone else in the room
      socket.to(chatId).emit('message_reaction', { messageId, emoji });

    } catch (err) {
      console.error('Error handling message reaction:', err);
    }
  });

  // 4. Typing Indicators
  socket.on('typing', ({ chatId, name }) => {
    if (!chatId) return;
    socket.to(chatId).emit('typing', { chatId, userId: socket.userId, name });
  });

  socket.on('stop_typing', ({ chatId }) => {
    if (!chatId) return;
    socket.to(chatId).emit('stop_typing', { chatId, userId: socket.userId });
  });

  // 5. Mark Seen Receipt
  socket.on('mark_seen', async ({ chatId }) => {
    if (!chatId) return;

    try {
      const now = new Date();
      await prisma.chatParticipant.update({
        where: {
          chatId_userId: { chatId, userId: socket.userId }
        },
        data: {
          lastSeenAt: now
        }
      });

      // Broadcast mark_seen to the other participant
      socket.to(chatId).emit('mark_seen', {
        chatId,
        userId: socket.userId,
        lastSeenAt: now
      });

    } catch (err) {
      console.error('Error in mark_seen socket handler:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected from WebSockets: ${socket.userId}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});
