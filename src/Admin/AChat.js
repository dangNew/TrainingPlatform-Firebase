import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarToggleContext } from "../components/LgNavbar";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  Calendar,
  Edit2,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  PlusCircle,
  Search,
  Send,
  Smile,
  Trash2,
  Users,
  UserPlus,
  ImageIcon,
  Palette,
  X,
  Check,
  Info,
} from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase.config";
import Sidebar from "../Admin/Aside";
import LgNavbar from "../components/LgNavbar";
import styled from "styled-components";
import uploadToCloudinary from "../uploadToCloudinary";

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f6f9;
`;

const HeaderWrapper = styled.div`
  width: 100%;
  z-index: 10;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
`;

const SidebarWrapper = styled.div`
  height: 100%;
  z-index: 5;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  background-color: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  margin-left: ${({ expanded }) => (expanded ? "270px" : "70px")};
  transition: margin-left 0.3s ease;
`;

const CourseDashboard = () => {
  const [user] = useAuthState(auth);
  const { expanded } = useContext(SidebarToggleContext);
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [formValue, setFormValue] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [allGroupMembers, setAllGroupMembers] = useState([]);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageText, setEditMessageText] = useState("");
  const [showReactionMenu, setShowReactionMenu] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [chatTheme, setChatTheme] = useState({});
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [chatEmoji, setChatEmoji] = useState({});
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("❤️");
  const [pinnedMessages, setPinnedMessages] = useState({});
  const [unreadMessages, setUnreadMessages] = useState({});
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dummy = useRef();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Reaction emoji mapping
  const reactionEmojis = {
    heart: "❤️",
    laugh: "😂",
    sad: "😢",
    angry: "😡",
  };

  // Theme color definitions
  const themeColors = {
    green: {
      light: "#dcfce7",
      main: "#22c55e",
      messageBackground: "#16a34a",
      messageText: "white",
    },
    yellow: {
      light: "#fef9c3",
      main: "#eab308",
      messageBackground: "#ca8a04",
      messageText: "white",
    },
    blue: {
      light: "#dbeafe",
      main: "#3b82f6",
      messageBackground: "#2563eb",
      messageText: "white",
    },
    black: {
      light: "#e5e7eb",
      main: "#4b5563",
      messageBackground: "#1f2937",
      messageText: "white",
    },
    violet: {
      light: "#ede9fe",
      main: "#8b5cf6",
      messageBackground: "#7c3aed",
      messageText: "white",
    },
    indigo: {
      light: "#e0e7ff",
      main: "#6366f1",
      messageBackground: "#4f46e5",
      messageText: "white",
    },
  };

  // Emoji options
  const emojiOptions = ["❤️", "👍", "😊", "😂", "🎉", "🔥", "👏", "🙏"];

  // Fetch current user data
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      // Check users collection
      const userQuery = query(
        collection(db, "users"),
        where("email", "==", user.email)
      );

      let userData = await getDocs(userQuery);

      if (!userData.empty) {
        const userDoc = userData.docs[0];
        setCurrentUser({
          id: userDoc.id,
          ...userDoc.data(),
          collection: "users",
          role: "adviser",
        });
        return;
      }

      // Check learner collection
      const learnerQuery = query(
        collection(db, "learner"),
        where("email", "==", user.email)
      );

      userData = await getDocs(learnerQuery);

      if (!userData.empty) {
        const userDoc = userData.docs[0];
        setCurrentUser({
          id: userDoc.id,
          ...userDoc.data(),
          collection: "learner",
        });
      }
    };

    fetchUserData();
  }, [user]);

  // Fetch user's chats
  useEffect(() => {
    if (!currentUser) return;

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.id),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      const chatList = [];

      for (const chatDoc of snapshot.docs) {
        const chatData = chatDoc.data();

        // Fetch participant details
        const participantDetails = [];

        for (const participantId of chatData.participants) {
          if (participantId === currentUser.id) continue;

          // Check users collection
          let participantDoc = await getDoc(doc(db, "users", participantId));

          if (participantDoc.exists()) {
            participantDetails.push({
              id: participantDoc.id,
              ...participantDoc.data(),
              collection: "users",
              role: "adviser",
            });
            continue;
          }

          // Check learner collection
          participantDoc = await getDoc(doc(db, "learner", participantId));

          if (participantDoc.exists()) {
            participantDetails.push({
              id: participantDoc.id,
              ...participantDoc.data(),
              collection: "learner",
            });
          }
        }

        chatList.push({
          id: chatDoc.id,
          ...chatData,
          participantDetails,
        });
      }

      setChats(chatList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChat) return;

    setIsMessagesLoading(true);

    const messagesQuery = query(
      collection(db, "chats", activeChat.id, "messages"),
      orderBy("createdAt"),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Update pinned and unread states
      const newPinned = {};
      const newUnread = {};
      messageList.forEach((msg) => {
        if (msg.isPinned) newPinned[msg.id] = true;
        if (msg.isUnread) newUnread[msg.id] = true;
      });

      setPinnedMessages(newPinned);
      setUnreadMessages(newUnread);

      setMessages(messageList);
      setIsMessagesLoading(false);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [activeChat]);

  // Fetch all group members when showing group members
  useEffect(() => {
    const fetchAllGroupMembers = async () => {
      if ((!showGroupMembers && !showAddMembers) || !activeChat || activeChat.type !== "group") return;

      try {
        const members = [];

        // Add current user to the list
        members.push({
          id: currentUser.id,
          fullName: currentUser.fullName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          role: currentUser.role || currentUser.collection,
          isCurrentUser: true,
        });

        // Add other participants
        for (const participantId of activeChat.participants) {
          if (participantId === currentUser.id) continue;

          // Check users collection
          let participantDoc = await getDoc(doc(db, "users", participantId));

          if (participantDoc.exists()) {
            members.push({
              id: participantDoc.id,
              ...participantDoc.data(),
              role: "adviser",
              isCurrentUser: false,
            });
            continue;
          }

          // Check learner collection
          participantDoc = await getDoc(doc(db, "learner", participantId));

          if (participantDoc.exists()) {
            members.push({
              id: participantDoc.id,
              ...participantDoc.data(),
              role: "learner",
              isCurrentUser: false,
            });
          }
        }

        setAllGroupMembers(members);
      } catch (error) {
        console.error("Error fetching group members:", error);
      }
    };

    fetchAllGroupMembers();
  }, [showGroupMembers, showAddMembers, activeChat, currentUser]);

  // Set up click outside handler for reaction menu and message options
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showReactionMenu && !event.target.closest(".reaction-menu")) {
        setShowReactionMenu(null);
      }
      if (showMessageOptions && !event.target.closest(".message-options")) {
        setShowMessageOptions(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showReactionMenu, showMessageOptions]);

  // Search users when search term changes
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 1 || !currentUser) return;

    const searchUsers = async () => {
      const results = [];

      try {
        // Search in users collection by email
        const usersEmailQuery = query(
          collection(db, "users"),
          where("email", ">=", searchTerm),
          where("email", "<=", searchTerm + "\uf8ff")
        );

        const usersEmailSnapshot = await getDocs(usersEmailQuery);

        usersEmailSnapshot.forEach((doc) => {
          if (doc.id !== currentUser.id) {
            results.push({
              id: doc.id,
              ...doc.data(),
              collection: "users",
              role: "adviser",
            });
          }
        });

        // Search in users collection by fullName
        const usersNameQuery = query(
          collection(db, "users"),
          where("fullName", ">=", searchTerm),
          where("fullName", "<=", searchTerm + "\uf8ff")
        );

        const usersNameSnapshot = await getDocs(usersNameQuery);

        usersNameSnapshot.forEach((doc) => {
          if (doc.id !== currentUser.id && !results.some((user) => user.id === doc.id)) {
            results.push({
              id: doc.id,
              ...doc.data(),
              collection: "users",
              role: "adviser",
            });
          }
        });

        // Search in learners collection by email
        const learnersEmailQuery = query(
          collection(db, "learner"),
          where("email", ">=", searchTerm),
          where("email", "<=", searchTerm + "\uf8ff")
        );

        const learnersEmailSnapshot = await getDocs(learnersEmailQuery);

        learnersEmailSnapshot.forEach((doc) => {
          if (doc.id !== currentUser.id) {
            results.push({
              id: doc.id,
              ...doc.data(),
              collection: "learner",
            });
          }
        });

        // Search in learners collection by fullName
        const learnersNameQuery = query(
          collection(db, "learner"),
          where("fullName", ">=", searchTerm),
          where("fullName", "<=", searchTerm + "\uf8ff")
        );

        const learnersNameSnapshot = await getDocs(learnersNameQuery);

        learnersNameSnapshot.forEach((doc) => {
          if (doc.id !== currentUser.id && !results.some((user) => user.id === doc.id)) {
            results.push({
              id: doc.id,
              ...doc.data(),
              collection: "learner",
            });
          }
        });

        setSearchResults(results);
      } catch (error) {
        console.error("Error searching users:", error);
      }
    };

    const debounceTimeout = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, currentUser]);

  // Update group name
  const updateGroupName = async () => {
    if (!activeChat || !newGroupName.trim()) return;

    try {
      await updateDoc(doc(db, "chats", activeChat.id), {
        name: newGroupName.trim(),
      });

      // Add system message about name change
      await addDoc(collection(db, "chats", activeChat.id, "messages"), {
        text: `${currentUser.fullName} changed the group name to "${newGroupName.trim()}"`,
        createdAt: serverTimestamp(),
        senderId: "system",
        senderName: "System",
        isSystemMessage: true,
      });

      // Update local state
      setActiveChat((prev) => ({
        ...prev,
        name: newGroupName.trim(),
      }));

      setEditingGroupName(false);
      setNewGroupName("");
    } catch (error) {
      console.error("Error updating group name:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!currentUser || !activeChat || !formValue.trim()) return;

    try {
      // Add message to subcollection
      await addDoc(collection(db, "chats", activeChat.id, "messages"), {
        text: formValue,
        createdAt: serverTimestamp(),
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        senderPhoto: currentUser.photoURL?.url || currentUser.photoURL || null,
        senderRole: currentUser.role || currentUser.collection,
        reactions: {},
        isPinned: false,
        isUnread: false,
      });

      // Update last message in chat document
      await updateDoc(doc(db, "chats", activeChat.id), {
        lastMessage: {
          text: formValue,
          sentAt: serverTimestamp(),
          sentBy: currentUser.id,
        },
        updatedAt: serverTimestamp(),
      });

      setFormValue("");
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const editMessage = async (messageId, newText) => {
    if (!newText.trim() || !activeChat) return;

    try {
      await updateDoc(doc(db, "chats", activeChat.id, "messages", messageId), {
        text: newText,
        isEdited: true,
        editedAt: serverTimestamp(),
      });

      // Update last message if this was the last message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.id === messageId) {
        await updateDoc(doc(db, "chats", activeChat.id), {
          lastMessage: {
            text: newText,
            sentAt: lastMessage.createdAt,
            sentBy: lastMessage.senderId,
          },
        });
      }

      setEditingMessage(null);
      setEditMessageText("");
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!activeChat) return;

    try {
      setIsDeleting(true);

      // Get the message before deleting it
      const messageRef = doc(db, "chats", activeChat.id, "messages", messageId);
      const messageSnap = await getDoc(messageRef);

      if (!messageSnap.exists()) return;

      // Delete the message
      await deleteDoc(messageRef);

      // Add system message about deletion
      await addDoc(collection(db, "chats", activeChat.id, "messages"), {
        text: `${currentUser.fullName} deleted a message`,
        createdAt: serverTimestamp(),
        senderId: "system",
        senderName: "System",
        isSystemMessage: true,
      });

      // If this was the last message, update the chat's lastMessage
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.id === messageId) {
        // Find the new last message
        const messagesQuery = query(
          collection(db, "chats", activeChat.id, "messages"),
          orderBy("createdAt", "desc"),
          limit(1),
        );

        const messagesSnapshot = await getDocs(messagesQuery);

        if (!messagesSnapshot.empty) {
          const newLastMessage = messagesSnapshot.docs[0].data();
          await updateDoc(doc(db, "chats", activeChat.id), {
            lastMessage: {
              text: newLastMessage.text,
              sentAt: newLastMessage.createdAt,
              sentBy: newLastMessage.senderId,
            },
            updatedAt: serverTimestamp(),
          });
        } else {
          // No messages left
          await updateDoc(doc(db, "chats", activeChat.id), {
            lastMessage: {
              text: "No messages",
              sentAt: serverTimestamp(),
              sentBy: "system",
            },
            updatedAt: serverTimestamp(),
          });
        }
      }

      setShowMessageOptions(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Improved reaction function - a user can only have one reaction per message
  const addReaction = async (messageId, reactionType) => {
    if (!activeChat || !currentUser) return;

    try {
      const messageRef = doc(db, "chats", activeChat.id, "messages", messageId);
      const messageSnap = await getDoc(messageRef);

      if (!messageSnap.exists()) return;

      const messageData = messageSnap.data();
      const reactions = messageData.reactions || {};

      // First, check if user has ANY reaction on this message
      let userHasReacted = false;
      let existingReactionType = null;

      Object.entries(reactions).forEach(([type, reactors]) => {
        if (reactors && reactors.some((r) => r.userId === currentUser.id)) {
          userHasReacted = true;
          existingReactionType = type;
        }
      });

      // If user already reacted with this exact type, remove it
      if (userHasReacted && existingReactionType === reactionType) {
        await updateDoc(messageRef, {
          [`reactions.${reactionType}`]: arrayRemove({
            userId: currentUser.id,
            userName: currentUser.fullName,
            type: reactionType,
          }),
        });
      }
      // If user reacted with different type, remove old reaction and add new one
      else if (userHasReacted) {
        // Remove old reaction
        await updateDoc(messageRef, {
          [`reactions.${existingReactionType}`]: arrayRemove({
            userId: currentUser.id,
            userName: currentUser.fullName,
            type: existingReactionType,
          }),
        });

        // Add new reaction
        await updateDoc(messageRef, {
          [`reactions.${reactionType}`]: arrayUnion({
            userId: currentUser.id,
            userName: currentUser.fullName,
            type: reactionType,
          }),
        });
      }
      // User has not reacted yet, add new reaction
      else {
        await updateDoc(messageRef, {
          [`reactions.${reactionType}`]: arrayUnion({
            userId: currentUser.id,
            userName: currentUser.fullName,
            type: reactionType,
          }),
        });
      }

      setShowReactionMenu(null);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const togglePinMessage = async (messageId) => {
    if (!activeChat) return;

    try {
      // Update local state
      setPinnedMessages((prev) => ({
        ...prev,
        [messageId]: !prev[messageId],
      }));

      // Update in Firestore
      await updateDoc(doc(db, "chats", activeChat.id, "messages", messageId), {
        isPinned: !pinnedMessages[messageId],
      });
    } catch (error) {
      console.error("Error toggling pin status:", error);
    }
  };

  const toggleMarkAsUnread = async (messageId) => {
    if (!activeChat) return;

    try {
      // Update local state
      setUnreadMessages((prev) => ({
        ...prev,
        [messageId]: !prev[messageId],
      }));

      // Update in Firestore
      await updateDoc(doc(db, "chats", activeChat.id, "messages", messageId), {
        isUnread: !unreadMessages[messageId],
      });
    } catch (error) {
      console.error("Error toggling unread status:", error);
    }
  };

  const startChat = async (selectedUser) => {
    if (!currentUser) return;

    // Check if chat already exists
    const existingChatQuery = query(
      collection(db, "chats"),
      where("type", "==", "direct"),
      where("participants", "array-contains", currentUser.id)
    );

    const existingChats = await getDocs(existingChatQuery);

    const existingChat = existingChats.docs.find((chatDoc) => {
      const participants = chatDoc.data().participants;
      return participants.includes(selectedUser.id) && participants.length === 2;
    });

    if (existingChat) {
      // Chat already exists, set it as active
      setActiveChat({
        id: existingChat.id,
        ...existingChat.data(),
        participantDetails: [selectedUser],
      });
    } else {
      // Create new chat
      const chatName = `${currentUser.fullName} & ${selectedUser.fullName}`;

      const newChatRef = await addDoc(collection(db, "chats"), {
        name: chatName,
        type: "direct",
        participants: [currentUser.id, selectedUser.id],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.id,
      });

      setActiveChat({
        id: newChatRef.id,
        name: chatName,
        type: "direct",
        participants: [currentUser.id, selectedUser.id],
        participantDetails: [selectedUser],
        createdAt: serverTimestamp(),
      });
    }

    setShowUserSearch(false);
    setSearchTerm("");
  };

  const createGroupChat = async () => {
    if (!currentUser || selectedUsers.length === 0 || !groupName.trim()) return;

    const participants = [currentUser.id, ...selectedUsers.map((user) => user.id)];

    // Create new group chat
    const newChatRef = await addDoc(collection(db, "chats"), {
      name: groupName,
      type: "group",
      participants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentUser.id,
    });

    setActiveChat({
      id: newChatRef.id,
      name: groupName,
      type: "group",
      participants,
      participantDetails: selectedUsers,
      createdAt: serverTimestamp(),
    });

    setShowCreateGroup(false);
    setGroupName("");
    setSelectedUsers([]);
  };

  // New function to add members to existing group chat
  const addMembersToGroup = async () => {
    if (!currentUser || !activeChat || activeChat.type !== "group" || selectedUsers.length === 0) return;

    try {
      // Get current participants
      const chatRef = doc(db, "chats", activeChat.id);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) return;

      const currentParticipants = chatSnap.data().participants || [];

      // Add new participants, filtering out any that are already in the group
      const newParticipantIds = selectedUsers
        .map((user) => user.id)
        .filter((id) => !currentParticipants.includes(id));

      if (newParticipantIds.length === 0) {
        // All selected users are already in the group
        setShowAddMembers(false);
        setSelectedUsers([]);
        return;
      }

      // Update the participants array
      await updateDoc(chatRef, {
        participants: [...currentParticipants, ...newParticipantIds],
        updatedAt: serverTimestamp(),
      });

      // Add system message about new members
      const newMemberNames = selectedUsers
        .filter((user) => newParticipantIds.includes(user.id))
        .map((user) => user.fullName)
        .join(", ");

      await addDoc(collection(db, "chats", activeChat.id, "messages"), {
        text: `${currentUser.fullName} added ${newMemberNames} to the group`,
        createdAt: serverTimestamp(),
        senderId: "system",
        senderName: "System",
        isSystemMessage: true,
      });

      // Update last message
      await updateDoc(chatRef, {
        lastMessage: {
          text: `${currentUser.fullName} added ${newMemberNames} to the group`,
          sentAt: serverTimestamp(),
          sentBy: "system",
        },
      });

      // Clear selected users and close the add members panel
      setSelectedUsers([]);
      setShowAddMembers(false);

      // Refresh group members display
      if (showGroupMembers) {
        setShowGroupMembers(true);
      }
    } catch (error) {
      console.error("Error adding members to group:", error);
    }
  };

  const leaveGroupChat = async () => {
    if (!currentUser || !activeChat || activeChat.type !== "group") return;

    try {
      // Create a system message that user left the group
      await addDoc(collection(db, "chats", activeChat.id, "messages"), {
        text: `${currentUser.fullName} left the group`,
        createdAt: serverTimestamp(),
        senderId: "system",
        senderName: "System",
        isSystemMessage: true,
      });

      // Remove user from participants array
      await updateDoc(doc(db, "chats", activeChat.id), {
        participants: arrayRemove(currentUser.id),
        lastMessage: {
          text: `${currentUser.fullName} left the group`,
          sentAt: serverTimestamp(),
          sentBy: "system",
        },
        updatedAt: serverTimestamp(),
      });

      // Clear active chat and close group members panel
      setActiveChat(null);
      setShowGroupMembers(false);

      // Remove this chat from the chats array
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== activeChat.id));
    } catch (error) {
      console.error("Error leaving group chat:", error);
    }
  };

  const deleteChat = async (chatId) => {
    if (!chatId) return;

    try {
      // Delete the chat document from Firestore
      await deleteDoc(doc(db, "chats", chatId));

      // Remove the chat from the local state
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));

      // If the active chat is the one being deleted, clear the active chat
      if (activeChat?.id === chatId) {
        setActiveChat(null);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const handleSelectUser = (user) => {
    if (!selectedUsers.some((selected) => selected.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((user) => user.id !== userId));
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(date);
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check if date is today
      if (date.toDateString() === now.toDateString()) {
        return "Today";
      }

      // Check if date is yesterday
      if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      }

      // Otherwise return full date
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const shouldShowDate = (currentMsg, prevMsg) => {
    if (!prevMsg || !currentMsg.createdAt || !prevMsg.createdAt) return true;

    try {
      const currentDate = currentMsg.createdAt.toDate().toDateString();
      const prevDate = prevMsg.createdAt.toDate().toDateString();

      return currentDate !== prevDate;
    } catch (error) {
      return false;
    }
  };

  const getChatName = (chat) => {
    if (chat.type === "group") return chat.name;

    // For direct chats, show the other person's name
    const otherParticipant = chat.participantDetails[0];
    return otherParticipant?.fullName || "Unknown User";
  };

  const getUserRole = (user) => {
    return user.role || user.collection;
  };

  // Check if a user is already in the group
  const isUserInGroup = (userId) => {
    if (!activeChat) return false;
    return activeChat.participants.includes(userId);
  };

  // Function to handle group photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const uploadResult = await uploadToCloudinary(file);

      if (uploadResult && uploadResult.url) {
        // Update the chat document with the new photo URL
        await updateDoc(doc(db, "chats", activeChat.id), {
          photoURL: uploadResult.url,
          photoPublicId: uploadResult.publicId,
        });

        // Add system message about photo change
        await addDoc(collection(db, "chats", activeChat.id, "messages"), {
          text: `${currentUser.fullName} changed the group photo`,
          createdAt: serverTimestamp(),
          senderId: "system",
          senderName: "System",
          isSystemMessage: true,
        });

        // Update local state
        setActiveChat((prev) => ({
          ...prev,
          photoURL: uploadResult.url,
          photoPublicId: uploadResult.publicId,
        }));

        // Close the chat info panel after successful upload
        setShowChatInfo(false);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Function to change chat theme
  const changeChatTheme = async (color) => {
    if (!activeChat) return;

    try {
      // Update the chat document with the new theme
      await updateDoc(doc(db, "chats", activeChat.id), {
        theme: color,
      });

      // Add system message about theme change
      await addDoc(collection(db, "chats", activeChat.id, "messages"), {
        text: `${currentUser.fullName} changed the chat theme`,
        createdAt: serverTimestamp(),
        senderId: "system",
        senderName: "System",
        isSystemMessage: true,
      });

      // Update local state
      setChatTheme((prev) => ({
        ...prev,
        [activeChat.id]: color,
      }));

      setShowThemeSelector(false);
      setShowChatInfo(false);
    } catch (error) {
      console.error("Error changing theme:", error);
    }
  };

  // Function to change chat emoji
  const changeChatEmoji = async (emoji) => {
    if (!activeChat) return;

    try {
      // Update the chat document with the new emoji
      await updateDoc(doc(db, "chats", activeChat.id), {
        emoji: emoji,
      });

      // Add system message about emoji change
      await addDoc(collection(db, "chats", activeChat.id, "messages"), {
        text: `${currentUser.fullName} changed the chat emoji to ${emoji}`,
        createdAt: serverTimestamp(),
        senderId: "system",
        senderName: "System",
        isSystemMessage: true,
      });

      // Update local state
      setChatEmoji((prev) => ({
        ...prev,
        [activeChat.id]: emoji,
      }));
      setSelectedEmoji(emoji);

      setShowEmojiSelector(false);
      setShowChatInfo(false);
    } catch (error) {
      console.error("Error changing emoji:", error);
    }
  };

  // Add this effect to load chat theme and emoji when active chat changes
  useEffect(() => {
    if (!activeChat) return;

    // Set the theme for the active chat
    if (activeChat.theme) {
      setChatTheme((prev) => ({
        ...prev,
        [activeChat.id]: activeChat.theme,
      }));
    }

    // Set the emoji for the active chat
    if (activeChat.emoji) {
      setChatEmoji((prev) => ({
        ...prev,
        [activeChat.id]: activeChat.emoji,
      }));
      setSelectedEmoji(activeChat.emoji);
    } else {
      setSelectedEmoji("❤️"); // Default emoji
    }
  }, [activeChat]);

  // Add a click handler for the emoji button
  const handleEmojiClick = async () => {
    if (!formValue.trim()) return;

    try {
      // Add message with the selected emoji
      await addDoc(collection(db, "chats", activeChat.id, "messages"), {
        text: selectedEmoji,
        createdAt: serverTimestamp(),
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        senderPhoto: currentUser.photoURL?.url || currentUser.photoURL || null,
        senderRole: currentUser.role || currentUser.collection,
        reactions: {},
      });

      // Update last message in chat document
      await updateDoc(doc(db, "chats", activeChat.id), {
        lastMessage: {
          text: selectedEmoji,
          sentAt: serverTimestamp(),
          sentBy: currentUser.id,
        },
        updatedAt: serverTimestamp(),
      });

      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error sending emoji:", error);
    }
  };

  return (
    <MainContent  expanded={expanded}>
      <div className="flex h-full">
        {/* Chat List - Fixed to always be visible on desktop */}
        <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-300 bg-gray-100 flex flex-col h-full">
          <div className="p-4 border-b border-gray-300 bg-white">
            <h2 className="text-xl font-semibold">Messages</h2>
          </div>

          <div className="p-2 flex space-x-2">
            <button
              onClick={() => {
                setShowUserSearch(true);
                setShowCreateGroup(false);
                setActiveChat(null);
              }}
              className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-md flex items-center justify-center"
            >
              <PlusCircle size={18} className="mr-2" />
              New Chat
            </button>
            <button
              onClick={() => {
                setShowCreateGroup(true);
                setShowUserSearch(false);
                setActiveChat(null);
              }}
              className="flex-1 py-2 px-3 bg-gray-200 text-gray-800 rounded-md flex items-center justify-center"
            >
              <Users size={18} className="mr-2" />
              New Group
            </button>
          </div>

          {/* Chat List - Always visible */}
          <div className="overflow-y-auto flex-1">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-200 ${
                    activeChat?.id === chat.id ? "bg-gray-200" : ""
                  }`}
                  onClick={() => {
                    setActiveChat(chat);
                    setShowUserSearch(false);
                    setShowCreateGroup(false);
                  }}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                      {chat.type === "group" ? (
                        <Users size={20} />
                      ) : chat.participantDetails[0]?.photoURL ? (
                        <img
                          src={
                            chat.participantDetails[0].photoURL ||
                            "/placeholder.svg"
                          }
                          alt="User"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        chat.participantDetails[0]?.fullName?.charAt(0) || "?"
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{getChatName(chat)}</h3>
                        {chat.lastMessage?.sentAt && (
                          <span className="text-xs text-gray-500">
                            {formatTime(chat.lastMessage.sentAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        {chat.type !== "group" && chat.participantDetails[0] && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded mr-2">
                            {getUserRole(chat.participantDetails[0])}
                          </span>
                        )}
                        <p className="text-sm text-gray-600 truncate">
                          {chat.lastMessage?.text || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p>No conversations yet</p>
                <p className="text-sm">Start a new chat to begin messaging</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="hidden md:block md:w-2/3 lg:w-3/4 h-full">
          {/* User Search Panel */}
          <AnimatePresence>
            {showUserSearch && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full bg-white"
              >
                <div className="p-4 border-b border-gray-300 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">New Message</h2>
                  <button
                    onClick={() => setShowUserSearch(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4">
                  <div className="relative mb-4">
                    <Search
                      className="absolute left-3 top-3 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      className="w-full p-2 pl-10 border border-gray-300 rounded-md"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
                    {searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 flex items-center"
                          onClick={() => startChat(user)}
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                            {user.photoURL ? (
                              <img
                                src={user.photoURL || "/placeholder.svg"}
                                alt="User"
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              user.fullName?.charAt(0) || "?"
                            )}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium">{user.fullName}</h3>
                              <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded ml-2">
                                {getUserRole(user)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </motion.div>
                      ))
                    ) : searchTerm.length > 1 ? (
                      <p className="text-center py-4 text-gray-500">
                        No users found
                      </p>
                    ) : (
                      <p className="text-center py-4 text-gray-500">
                        Type at least 2 characters to search
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Create Group Panel */}
          <AnimatePresence>
            {showCreateGroup && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full bg-white"
              >
                <div className="p-4 border-b border-gray-300 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Create Group Chat</h2>
                  <button
                    onClick={() => setShowCreateGroup(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Group Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter group name"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>

                  {selectedUsers.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Selected Users ({selectedUsers.length})
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map((user) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center bg-gray-200 rounded-full pl-2 pr-1 py-1"
                          >
                            <span className="text-sm">{user.fullName}</span>
                            <button
                              className="ml-1 text-gray-500 hover:text-gray-700"
                              onClick={() => handleRemoveUser(user.id)}
                            >
                              <X size={14} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="relative mb-4">
                    <Search
                      className="absolute left-3 top-3 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search users to add..."
                      className="w-full p-2 pl-10 border border-gray-300 rounded-md"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="overflow-y-auto max-h-[calc(100vh-350px)]">
                    {searchResults
                      .filter(
                        (user) =>
                          !selectedUsers.some((selected) => selected.id === user.id)
                      )
                      .map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 flex items-center"
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                            {user.photoURL ? (
                              <img
                                src={user.photoURL || "/placeholder.svg"}
                                alt="User"
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              user.fullName?.charAt(0) || "?"
                            )}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium">{user.fullName}</h3>
                              <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded ml-2">
                                {getUserRole(user)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </motion.div>
                      ))}
                  </div>

                  <button
                    className="w-full mt-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                    disabled={!groupName.trim() || selectedUsers.length === 0}
                    onClick={createGroupChat}
                  >
                    Create Group Chat
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Group Members Panel */}
          <AnimatePresence>
            {showGroupMembers && activeChat && activeChat.type === "group" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full bg-white"
              >
                <div className="p-4 border-b border-gray-300 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Group Members</h2>
                  <button
                    onClick={() => setShowGroupMembers(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4">
                  {editingGroupName ? (
                    <div className="mb-4 flex items-center">
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Enter new group name"
                        className="flex-1 p-2 border border-gray-300 rounded-l-md"
                      />
                      <button
                        onClick={updateGroupName}
                        disabled={!newGroupName.trim()}
                        className="bg-blue-600 text-white p-2 rounded-r-md disabled:bg-gray-300"
                      >
                        <Check size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">{activeChat.name}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setShowAddMembers(true);
                            setShowGroupMembers(false);
                            setSearchTerm("");
                            setSelectedUsers([]);
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <UserPlus size={16} className="mr-1" />
                          Add Member
                        </button>
                        <button
                          onClick={() => {
                            setEditingGroupName(true);
                            setNewGroupName(activeChat.name);
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Edit2 size={16} className="mr-1" />
                          Edit Name
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
                    {allGroupMembers.map((member) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-3 border-b border-gray-200 flex items-center mb-2"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                          {member.photoURL ? (
                            <img
                              src={member.photoURL || "/placeholder.svg"}
                              alt="User"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            member.fullName?.charAt(0) || "?"
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="font-medium">
                              {member.fullName} {member.isCurrentUser && "(You)"}
                            </h3>
                            <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded ml-2">
                              {member.role}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <button
                    onClick={leaveGroupChat}
                    className="w-full mt-4 py-2 bg-rose-600 text-white rounded-md flex items-center justify-center"
                  >
                    <LogOut size={18} className="mr-2" />
                    Leave Group
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Members Panel */}
          <AnimatePresence>
            {showAddMembers && activeChat && activeChat.type === "group" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full bg-white"
              >
                <div className="p-4 border-b border-gray-300 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Add Members to Group</h2>
                  <button
                    onClick={() => setShowAddMembers(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Add people to "{activeChat.name}"
                    </label>
                  </div>

                  {selectedUsers.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Selected Users ({selectedUsers.length})
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map((user) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center bg-gray-200 rounded-full pl-2 pr-1 py-1"
                          >
                            <span className="text-sm">{user.fullName}</span>
                            <button
                              className="ml-1 text-gray-500 hover:text-gray-700"
                              onClick={() => handleRemoveUser(user.id)}
                            >
                              <X size={14} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="relative mb-4">
                    <Search
                      className="absolute left-3 top-3 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search users to add..."
                      className="w-full p-2 pl-10 border border-gray-300 rounded-md"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="overflow-y-auto max-h-[calc(100vh-350px)]">
                    {searchResults
                      .filter(
                        (user) =>
                          !selectedUsers.some((selected) => selected.id === user.id) &&
                          !isUserInGroup(user.id)
                      )
                      .map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 flex items-center"
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                            {user.photoURL ? (
                              <img
                                src={user.photoURL || "/placeholder.svg"}
                                alt="User"
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              user.fullName?.charAt(0) || "?"
                            )}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium">{user.fullName}</h3>
                              <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded ml-2">
                                {getUserRole(user)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </motion.div>
                      ))}
                  </div>

                  <button
                    className="w-full mt-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                    disabled={selectedUsers.length === 0}
                    onClick={addMembersToGroup}
                  >
                    Add to Group
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Messages */}
          {activeChat && !showUserSearch && !showCreateGroup && !showGroupMembers && !showAddMembers && (
            <div className="w-full h-full flex flex-col bg-white">
              <div className="p-4 border-b border-gray-300 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                    {activeChat.type === "group" ? (
                      activeChat.photoURL ? (
                        <img
                          src={activeChat.photoURL || "/placeholder.svg"}
                          alt="Group"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Users size={20} />
                      )
                    ) : activeChat.participantDetails[0]?.photoURL ? (
                      <img
                        src={
                          activeChat.participantDetails[0].photoURL ||
                          "/placeholder.svg"
                        }
                        alt="User"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      activeChat.participantDetails[0]?.fullName?.charAt(0) || "?"
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold">{getChatName(activeChat)}</h2>
                    {activeChat.type !== "group" && activeChat.participantDetails[0] && (
                      <div className="flex items-center">
                        <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded">
                          {getUserRole(activeChat.participantDetails[0])}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <button
                    onClick={() => setShowChatInfo(!showChatInfo)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full transition-colors"
                    title="Chat Information"
                  >
                    <Info size={20} />
                  </button>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto p-4 relative"
                style={{
                  backgroundColor: chatTheme[activeChat?.id]
                    ? themeColors[chatTheme[activeChat.id]].light
                    : "#f9fafb",
                  height: "calc(100vh - 160px)",
                  overflowY: "auto",
                }}
              >
                {isMessagesLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle size={48} className="text-blue-300" />
                    <p className="mt-2">No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {/* Pinned Messages Section */}
                    {pinnedMessages && Object.keys(pinnedMessages).length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <X size={16} className="mr-2 text-yellow-500" />
                          <span className="font-medium text-gray-700">Pinned Messages</span>
                        </div>
                        {messages
                          .filter((msg) => pinnedMessages[msg.id])
                          .map((pinnedMsg) => (
                            <div key={pinnedMsg.id} className="mb-2 p-3 bg-yellow-50 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">{pinnedMsg.senderName}</div>
                                  <div>{pinnedMsg.text}</div>
                                </div>
                                <button
                                  onClick={() => togglePinMessage(pinnedMsg.id)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {messages.map((msg, index) => {
                      const isCurrentUser = msg.senderId === currentUser?.id;
                      const isSystemMessage = msg.senderId === "system" || msg.isSystemMessage;
                      const prevMsg = index > 0 ? messages[index - 1] : null;
                      const showDateHeader = shouldShowDate(msg, prevMsg);

                      // Render date header if needed
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {showDateHeader && msg.createdAt && (
                            <div className="flex justify-center my-4">
                              <div className="px-3 py-1 bg-white text-gray-600 text-xs rounded-full flex items-center shadow-sm">
                                <Calendar size={12} className="mr-1" />
                                {formatDate(msg.createdAt)}
                              </div>
                            </div>
                          )}

                          {isSystemMessage ? (
                            <div className="mb-4 flex justify-center">
                              <div className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {msg.text}
                              </div>
                            </div>
                          ) : (
                            <div className={`mb-4 flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                              <div className={`flex max-w-[75%] ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                                {!isCurrentUser && (
                                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
                                    {msg.senderPhoto ? (
                                      <img
                                        src={
                                          typeof msg.senderPhoto === "object"
                                            ? msg.senderPhoto.url
                                            : msg.senderPhoto || "/placeholder.svg"
                                        }
                                        alt="User"
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      msg.senderName?.charAt(0) || "?"
                                    )}
                                  </div>
                                )}

                                <div>
                                  <div className={`flex items-center mb-1 ${isCurrentUser ? "justify-end" : ""}`}>
                                    <span className="text-xs font-medium text-gray-800">
                                      {isCurrentUser ? "You" : msg.senderName}
                                    </span>
                                    {!isCurrentUser && msg.senderRole && (
                                      <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded ml-1">
                                        {msg.senderRole}
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-500 ml-2">
                                      {msg.createdAt && formatTime(msg.createdAt)}
                                    </span>
                                    {msg.isEdited && (
                                      <span className="text-xs text-gray-500 ml-1">(edited)</span>
                                    )}
                                  </div>

                                  {editingMessage === msg.id ? (
                                    <div className="flex items-center">
                                      <input
                                        type="text"
                                        value={editMessageText}
                                        onChange={(e) => setEditMessageText(e.target.value)}
                                        className="p-2 border border-gray-300 rounded-l-md w-full"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => editMessage(msg.id, editMessageText)}
                                        disabled={!editMessageText.trim()}
                                        className="bg-blue-600 text-white p-2 rounded-r-md disabled:bg-gray-300"
                                      >
                                        <Check size={20} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="relative group">
                                      <div
                                        className={`p-3 rounded-lg ${
                                          isCurrentUser
                                            ? chatTheme[activeChat?.id]
                                              ? `bg-${themeColors[chatTheme[activeChat.id]].messageBackground} text-${
                                                  themeColors[chatTheme[activeChat.id]].messageText
                                                } rounded-tr-none`
                                              : "bg-blue-600 text-white rounded-tr-none"
                                            : "bg-gray-200 text-gray-800 rounded-tl-none"
                                        }`}
                                      >
                                        {msg.text}
                                      </div>

                                      {/* Message options button for current user's messages */}
                                      {isCurrentUser && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowMessageOptions(
                                              showMessageOptions === msg.id ? null : msg.id
                                            );
                                          }}
                                          className="absolute top-0 right-0 p-1 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <MoreHorizontal size={16} />
                                        </button>
                                      )}

                                      {/* Message options menu */}
                                      {showMessageOptions === msg.id && (
                                        <div className="absolute top-0 right-8 bg-white shadow-md rounded-md py-1 z-10 message-options">
                                          <button
                                            onClick={() => {
                                              setEditingMessage(msg.id);
                                              setEditMessageText(msg.text);
                                              setShowMessageOptions(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center transition-colors"
                                          >
                                            <Edit2 size={14} className="mr-2" /> Edit
                                          </button>
                                          <button
                                            onClick={() => deleteMessage(msg.id)}
                                            disabled={isDeleting}
                                            className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-gray-100 flex items-center transition-colors"
                                          >
                                            {isDeleting ? (
                                              <>
                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-rose-600 rounded-full animate-spin mr-2"></div>
                                                Deleting...
                                              </>
                                            ) : (
                                              <>
                                                <Trash2 size={14} className="mr-2" /> Delete
                                              </>
                                            )}
                                          </button>
                                          <button
                                            onClick={() => {
                                              toggleMarkAsUnread(msg.id);
                                              setShowMessageOptions(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center transition-colors"
                                          >
                                            {unreadMessages[msg.id] ? (
                                              <>
                                                <MessageCircle size={14} className="mr-2" /> Mark as Read
                                              </>
                                            ) : (
                                              <>
                                                <MessageCircle size={14} className="mr-2" /> Mark as Unread
                                              </>
                                            )}
                                          </button>
                                          <button
                                            onClick={() => {
                                              togglePinMessage(msg.id);
                                              setShowMessageOptions(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center transition-colors"
                                          >
                                            {pinnedMessages[msg.id] ? (
                                              <>
                                                <X size={14} className="mr-2" /> Unpin
                                              </>
                                            ) : (
                                              <>
                                                <X size={14} className="mr-2" /> Pin
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      )}

                                      {/* Reaction button */}
                                      <button
                                        onClick={() =>
                                          setShowReactionMenu(
                                            showReactionMenu === msg.id ? null : msg.id
                                          )
                                        }
                                        className="absolute bottom-0 right-0 p-1 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Smile size={16} />
                                      </button>

                                      {/* Reaction menu */}
                                      {showReactionMenu === msg.id && (
                                        <div className="absolute bottom-8 right-0 bg-white shadow-md rounded-full py-1 px-2 flex space-x-2 z-10 reaction-menu">
                                          {Object.entries(reactionEmojis).map(([type, emoji]) => (
                                            <button
                                              key={type}
                                              onClick={() => addReaction(msg.id, type)}
                                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-lg transition-colors"
                                            >
                                              {emoji}
                                            </button>
                                          ))}
                                        </div>
                                      )}

                                      {/* Display reactions */}
                                      {msg.reactions && Object.entries(msg.reactions).length > 0 && (
                                        <div className="flex mt-1 flex-wrap">
                                          {Object.entries(msg.reactions).map(([type, users]) =>
                                            users && users.length > 0 ? (
                                              <div
                                                key={type}
                                                className="bg-white rounded-full px-2 py-0.5 text-xs flex items-center mr-1 mb-1 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                                                title={users.map((u) => u.userName).join(", ")}
                                              >
                                                {reactionEmojis[type]} {users.length}
                                              </div>
                                            ) : null
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef}></div>
              </div>

              <form
                onSubmit={sendMessage}
                className="border-t border-gray-300 p-4 bg-white"
              >
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleEmojiClick}
                    className="bg-gray-100 text-gray-800 p-2 hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    {selectedEmoji}
                  </button>
                  <button
                    type="submit"
                    disabled={!formValue.trim()}
                    className="bg-blue-600 text-white p-2 rounded-r-md disabled:bg-gray-300"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Empty State */}
          {!activeChat && !showUserSearch && !showCreateGroup && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white">
              <MessageCircle size={64} className="text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Welcome to Chat</h2>
              <p className="text-gray-500 mb-4">Select a conversation or start a new one</p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowUserSearch(true)}
                  className="py-2 px-4 bg-blue-600 text-white rounded-md flex items-center"
                >
                  <PlusCircle size={18} className="mr-2" />
                  New Chat
                </button>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md flex items-center"
                >
                  <Users size={18} className="mr-2" />
                  New Group
                </button>
              </div>
            </div>
          )}

          {/* Chat Info Panel */}
          {showChatInfo && activeChat && (
            <div className="absolute top-16 right-4 bg-white shadow-lg rounded-md p-4 z-20 w-64">
              <div className="text-lg font-medium mb-2 border-b pb-2 flex justify-between items-center">
                <span>Chat info</span>
                <button
                  onClick={() => setShowChatInfo(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 py-2">
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center"
                  onClick={() => {
                    setEditingGroupName(true);
                    setNewGroupName(activeChat.name);
                  }}
                >
                  <Edit2 size={18} className="mr-3 text-blue-600" />
                  <span className="text-gray-700">Change chat name</span>
                </button>

                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={18} className="mr-3 text-blue-600" />
                  <span className="text-gray-700">Change photo</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </button>

                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center"
                  onClick={() => setShowThemeSelector(!showThemeSelector)}
                >
                  <Palette size={18} className="mr-3 text-blue-600" />
                  <span className="text-gray-700">Change theme</span>
                </button>

                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center"
                  onClick={() => setShowEmojiSelector(!showEmojiSelector)}
                >
                  <Smile size={18} className="mr-3 text-blue-600" />
                  <span className="text-gray-700">Change emoji</span>
                </button>

                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center"
                  onClick={() => {
                    setShowChatInfo(false);
                    if (activeChat.type === "group") {
                      setShowGroupMembers(true);
                    }
                  }}
                >
                  <Users size={18} className="mr-3 text-blue-600" />
                  <span className="text-gray-700">{activeChat.type === "group" ? "Chat members" : "Edit nicknames"}</span>
                </button>

                {activeChat.type === "group" && (
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center"
                    onClick={() => {
                      setShowChatInfo(false);
                      setShowAddMembers(true);
                      setSelectedUsers([]);
                      setSearchTerm("");
                    }}
                  >
                    <UserPlus size={18} className="mr-3 text-blue-600" />
                    <span className="text-gray-700">Add members</span>
                  </button>
                )}

                <div className="border-t pt-2 mt-2">
                  <button
                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center"
                    onClick={() => {
                      setShowChatInfo(false);
                      if (activeChat.type === "group") {
                        leaveGroupChat();
                      } else {
                        deleteChat(activeChat.id);
                      }
                    }}
                  >
                    <LogOut size={18} className="mr-3" />
                    <span>{activeChat.type === "group" ? "Leave group" : "Delete chat"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Theme selector panel */}
          {showThemeSelector && (
            <div className="absolute top-48 right-4 bg-white shadow-lg rounded-md p-4 z-20 w-64">
              <div className="text-lg font-medium mb-2 border-b pb-2">Select Theme</div>
              <div className="grid grid-cols-3 gap-2 p-2">
                {Object.entries(themeColors).map(([color, _]) => (
                  <button
                    key={color}
                    className="w-full h-10 rounded-lg border border-gray-200 flex items-center justify-center capitalize hover:border-blue-500 transition-colors"
                    style={{ backgroundColor: themeColors[color].light }}
                    onClick={() => changeChatTheme(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Emoji selector panel */}
          {showEmojiSelector && (
            <div className="absolute top-64 right-4 bg-white shadow-lg rounded-md p-4 z-20 w-64">
              <div className="text-lg font-medium mb-2 border-b pb-2">Select Emoji</div>
              <div className="grid grid-cols-4 gap-2 p-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    className="w-full h-10 rounded-lg border border-gray-200 flex items-center justify-center text-xl hover:bg-gray-100 hover:border-blue-500 transition-colors"
                    onClick={() => changeChatEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainContent>
  );
};

const ElearningDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <PageContainer>
      <HeaderWrapper>
        <LgNavbar />
      </HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <CourseDashboard />
      </ContentContainer>
    </PageContainer>
  );
};

export default ElearningDashboard;
   