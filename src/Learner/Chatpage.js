import ChatRoom from "../components/ChatRoom"
import Sidebar from "../components/Sidebar"

function ChatPage() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-16 md:ml-64 h-screen">
        <div className="p-4 h-full">
          <ChatRoom />
        </div>
      </div>
    </div>
  )
}

export default ChatPage

