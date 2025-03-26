"use client"

import {
  addDoc,
  collection,
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
} from "firebase/firestore"
import { MessageCircle, PlusCircle, Search, Send, Users } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import Sidebar from "../components/LSidebar"
import { auth, db } from "../firebase.config"

// Types for TypeScript (will work in JSX too)
/**
 * @typedef {Object} UserData
 * @property {string} id
 * @property {string} fullName
 * @property {string} email
 * @property {string} [photoURL]
 * @property {string} [role]
 * @property {'users'|'learner'} collection
 */

/**
 * @typedef {Object} ChatData
 * @property {string} id
 * @property {string} name
 * @property {'direct'|'group'} type
 * @property {string[]} participants
 * @property {UserData[]} participantDetails
 * @property {Object} createdAt
 * @property {Object} [lastMessage]
 * @property {string} [lastMessage.text]
 * @property {Object} [lastMessage.sentAt]
 * @property {string} [lastMessage.sentBy]
 */

/**
 * @typedef {Object} MessageData
 * @property {string} id
 * @property {string} text
 * @property {Object} createdAt
 * @property {string} senderId
 * @property {string} senderName
 * @property {string} [senderPhoto]
 * @property {string} [senderRole]
 */

function ChatRoom() {
  const [user] = useAuthState(auth)
  const [currentUser, setCurrentUser] = useState(null)
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [formValue, setFormValue] = useState("")
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState([])
  const dummy = useRef()

  // Fetch current user data
  useEffect(() => {
    if (!user) return

    const fetchUserData = async () => {
      // Check users collection
      const userQuery = query(collection(db, "users"), where("email", "==", user.email))

      let userData = await getDocs(userQuery)

      if (!userData.empty) {
        const userDoc = userData.docs[0]
        setCurrentUser({
          id: userDoc.id,
          ...userDoc.data(),
          collection: "users",
          role: "adviser",
        })
        return
      }

      // Check learner collection
      const learnerQuery = query(collection(db, "learner"), where("email", "==", user.email))

      userData = await getDocs(learnerQuery)

      if (!userData.empty) {
        const userDoc = userData.docs[0]
        setCurrentUser({
          id: userDoc.id,
          ...userDoc.data(),
          collection: "learner",
        })
      }
    }

    fetchUserData()
  }, [user])

  // Fetch user's chats
  useEffect(() => {
    if (!currentUser) return

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.id),
      orderBy("updatedAt", "desc"),
    )

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      const chatList = []

      for (const chatDoc of snapshot.docs) {
        const chatData = chatDoc.data()

        // Fetch participant details
        const participantDetails = []

        for (const participantId of chatData.participants) {
          if (participantId === currentUser.id) continue

          // Check users collection
          let participantDoc = await getDoc(doc(db, "users", participantId))

          if (participantDoc.exists()) {
            participantDetails.push({
              id: participantDoc.id,
              ...participantDoc.data(),
              collection: "users",
              role: "adviser",
            })
            continue
          }

          // Check learner collection
          participantDoc = await getDoc(doc(db, "learner", participantId))

          if (participantDoc.exists()) {
            participantDetails.push({
              id: participantDoc.id,
              ...participantDoc.data(),
              collection: "learner",
            })
          }
        }

        chatList.push({
          id: chatDoc.id,
          ...chatData,
          participantDetails,
        })
      }

      setChats(chatList)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChat) return

    const messagesQuery = query(collection(db, "chats", activeChat.id, "messages"), orderBy("createdAt"), limit(50))

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setMessages(messageList)

      // Scroll to bottom after messages load
      setTimeout(() => {
        dummy.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    })

    return () => unsubscribe()
  }, [activeChat])

  // Search users when search term changes
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2 || !currentUser) return

    const searchUsers = async () => {
      const results = []

      try {
        // Search in users collection by email
        const usersEmailQuery = query(
          collection(db, "users"),
          where("email", ">=", searchTerm),
          where("email", "<=", searchTerm + "\uf8ff"),
        )

        const usersEmailSnapshot = await getDocs(usersEmailQuery)

        usersEmailSnapshot.forEach((doc) => {
          if (doc.id !== currentUser.id) {
            results.push({
              id: doc.id,
              ...doc.data(),
              collection: "users",
              role: "adviser",
            })
          }
        })

        // Search in users collection by fullName
        const usersNameQuery = query(
          collection(db, "users"),
          where("fullName", ">=", searchTerm),
          where("fullName", "<=", searchTerm + "\uf8ff"),
        )

        const usersNameSnapshot = await getDocs(usersNameQuery)

        usersNameSnapshot.forEach((doc) => {
          if (doc.id !== currentUser.id && !results.some((user) => user.id === doc.id)) {
            results.push({
              id: doc.id,
              ...doc.data(),
              collection: "users",
              role: "adviser",
            })
          }
        })

        // Search in learners collection by email
        const learnersEmailQuery = query(
          collection(db, "learner"),
          where("email", ">=", searchTerm),
          where("email", "<=", searchTerm + "\uf8ff"),
        )

        const learnersEmailSnapshot = await getDocs(learnersEmailQuery)

        learnersEmailSnapshot.forEach((doc) => {
          if (doc.id !== currentUser.id) {
            results.push({
              id: doc.id,
              ...doc.data(),
              collection: "learner",
            })
          }
        })

        // Search in learners collection by fullName
        const learnersNameQuery = query(
          collection(db, "learner"),
          where("fullName", ">=", searchTerm),
          where("fullName", "<=", searchTerm + "\uf8ff"),
        )

        const learnersNameSnapshot = await getDocs(learnersNameQuery)

        learnersNameSnapshot.forEach((doc) => {
          if (doc.id !== currentUser.id && !results.some((user) => user.id === doc.id)) {
            results.push({
              id: doc.id,
              ...doc.data(),
              collection: "learner",
            })
          }
        })

        setSearchResults(results)
      } catch (error) {
        console.error("Error searching users:", error)
      }
    }

    const debounceTimeout = setTimeout(() => {
      searchUsers()
    }, 500)

    return () => clearTimeout(debounceTimeout)
  }, [searchTerm, currentUser])

  const sendMessage = async (e) => {
    e.preventDefault()

    if (!currentUser || !activeChat || !formValue.trim()) return

    try {
      // Add message to subcollection
      await addDoc(collection(db, "chats", activeChat.id, "messages"), {
        text: formValue,
        createdAt: serverTimestamp(),
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        senderPhoto: currentUser.photoURL || null,
        senderRole: currentUser.role || currentUser.collection,
      })

      // Update last message in chat document
      await updateDoc(doc(db, "chats", activeChat.id), {
        lastMessage: {
          text: formValue,
          sentAt: serverTimestamp(),
          sentBy: currentUser.id,
        },
        updatedAt: serverTimestamp(),
      })

      setFormValue("")
      dummy.current?.scrollIntoView({ behavior: "smooth" })
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const startChat = async (selectedUser) => {
    if (!currentUser) return

    // Check if chat already exists
    const existingChatQuery = query(
      collection(db, "chats"),
      where("type", "==", "direct"),
      where("participants", "array-contains", currentUser.id),
    )

    const existingChats = await getDocs(existingChatQuery)

    const existingChat = existingChats.docs.find((chatDoc) => {
      const participants = chatDoc.data().participants
      return participants.includes(selectedUser.id) && participants.length === 2
    })

    if (existingChat) {
      // Chat already exists, set it as active
      setActiveChat({
        id: existingChat.id,
        ...existingChat.data(),
        participantDetails: [selectedUser],
      })
    } else {
      // Create new chat
      const chatName = `${currentUser.fullName} & ${selectedUser.fullName}`

      const newChatRef = await addDoc(collection(db, "chats"), {
        name: chatName,
        type: "direct",
        participants: [currentUser.id, selectedUser.id],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.id,
      })

      setActiveChat({
        id: newChatRef.id,
        name: chatName,
        type: "direct",
        participants: [currentUser.id, selectedUser.id],
        participantDetails: [selectedUser],
        createdAt: serverTimestamp(),
      })
    }

    setShowUserSearch(false)
    setSearchTerm("")
  }

  const createGroupChat = async () => {
    if (!currentUser || selectedUsers.length === 0 || !groupName.trim()) return

    const participants = [currentUser.id, ...selectedUsers.map((user) => user.id)]

    // Create new group chat
    const newChatRef = await addDoc(collection(db, "chats"), {
      name: groupName,
      type: "group",
      participants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentUser.id,
    })

    setActiveChat({
      id: newChatRef.id,
      name: groupName,
      type: "group",
      participants,
      participantDetails: selectedUsers,
      createdAt: serverTimestamp(),
    })

    setShowCreateGroup(false)
    setGroupName("")
    setSelectedUsers([])
  }

  const handleSelectUser = (user) => {
    if (!selectedUsers.some((selected) => selected.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((user) => user.id !== userId))
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ""
    const date = timestamp.toDate()
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date)
  }

  const getChatName = (chat) => {
    if (chat.type === "group") return chat.name

    // For direct chats, show the other person's name
    const otherParticipant = chat.participantDetails[0]
    return otherParticipant?.fullName || "Unknown User"
  }

  const getUserRole = (user) => {
    return user.role || user.collection
  }

  return (
    <div className="flex h-screen">
      <Sidebar />

      {/* Chat List - Fixed to always be visible on desktop */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-300 bg-gray-100 flex flex-col h-full">
        <div className="p-4 border-b border-gray-300 bg-white">
          <h2 className="text-xl font-semibold">Messages</h2>
        </div>

        <div className="p-2 flex space-x-2">
          <button
            onClick={() => {
              setShowUserSearch(true)
              setShowCreateGroup(false)
              setActiveChat(null)
            }}
            className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-md flex items-center justify-center"
          >
            <PlusCircle size={18} className="mr-2" />
            New Chat
          </button>
          <button
            onClick={() => {
              setShowCreateGroup(true)
              setShowUserSearch(false)
              setActiveChat(null)
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
                  setActiveChat(chat)
                  setShowUserSearch(false)
                  setShowCreateGroup(false)
                }}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                    {chat.type === "group" ? (
                      <Users size={20} />
                    ) : chat.participantDetails[0]?.photoURL ? (
                      <img
                        src={chat.participantDetails[0].photoURL || "/placeholder.svg"}
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
                        <span className="text-xs text-gray-500">{formatTime(chat.lastMessage.sentAt)}</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      {chat.type !== "group" && chat.participantDetails[0] && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded mr-2">
                          {getUserRole(chat.participantDetails[0])}
                        </span>
                      )}
                      <p className="text-sm text-gray-600 truncate">{chat.lastMessage?.text || "No messages yet"}</p>
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
        {showUserSearch && (
          <div className="w-full h-full bg-white">
            <div className="p-4 border-b border-gray-300 flex justify-between items-center">
              <h2 className="text-xl font-semibold">New Message</h2>
              <button onClick={() => setShowUserSearch(false)} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>

            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
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
                    <div
                      key={user.id}
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
                    </div>
                  ))
                ) : searchTerm.length > 1 ? (
                  <p className="text-center py-4 text-gray-500">No users found</p>
                ) : (
                  <p className="text-center py-4 text-gray-500">Type at least 2 characters to search</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Group Panel */}
        {showCreateGroup && (
          <div className="w-full h-full bg-white">
            <div className="p-4 border-b border-gray-300 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Create Group Chat</h2>
              <button onClick={() => setShowCreateGroup(false)} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Group Name</label>
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
                  <label className="block text-sm font-medium mb-2">Selected Users ({selectedUsers.length})</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <div key={user.id} className="flex items-center bg-gray-200 rounded-full pl-2 pr-1 py-1">
                        <span className="text-sm">{user.fullName}</span>
                        <button
                          className="ml-1 text-gray-500 hover:text-gray-700"
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
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
                  .filter((user) => !selectedUsers.some((selected) => selected.id === user.id))
                  .map((user) => (
                    <div
                      key={user.id}
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
                    </div>
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
          </div>
        )}

        {/* Chat Messages */}
        {activeChat && !showUserSearch && !showCreateGroup && (
          <div className="w-full h-full flex flex-col bg-white">
            <div className="p-4 border-b border-gray-300 flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                {activeChat.type === "group" ? (
                  <Users size={20} />
                ) : activeChat.participantDetails[0]?.photoURL ? (
                  <img
                    src={activeChat.participantDetails[0].photoURL || "/placeholder.svg"}
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

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageCircle size={48} />
                  <p className="mt-2">No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCurrentUser = msg.senderId === currentUser?.id

                  return (
                    <div key={msg.id} className={`mb-4 flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      <div className={`flex max-w-[75%] ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                        {!isCurrentUser && (
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
                            {msg.senderPhoto ? (
                              <img
                                src={msg.senderPhoto || "/placeholder.svg"}
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
                            <span className="text-xs font-medium">{isCurrentUser ? "You" : msg.senderName}</span>
                            {!isCurrentUser && msg.senderRole && (
                              <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded ml-1">
                                {msg.senderRole}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 ml-2">
                              {msg.createdAt && formatTime(msg.createdAt)}
                            </span>
                          </div>

                          <div
                            className={`p-3 rounded-lg ${
                              isCurrentUser
                                ? "bg-blue-600 text-white rounded-tr-none"
                                : "bg-gray-200 text-gray-800 rounded-tl-none"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={dummy}></div>
            </div>

            <form onSubmit={sendMessage} className="border-t border-gray-300 p-4 bg-white">
              <div className="flex items-center">
                <input
                  type="text"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
      </div>
    </div>
  )
}

export default ChatRoom

