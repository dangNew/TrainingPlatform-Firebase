"use client"

import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { useEffect, useState, useContext } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import styled from "styled-components"
import { auth, db } from "../firebase.config"
import uploadToCloudinary from "../uploadToCloudinary"
import ProfileHistory from "./profile-history"
import ProfileProgress from "./profile-progress"
import { SidebarToggleContext } from "../components/LgNavbar"; // Import the context
import Sidebar from "../components/LSidebar"


const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: margin-left 0.3s ease;
  margin-left: ${({ expanded }) => (expanded ? "16rem" : "4rem")};
  width: ${({ expanded }) => (expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)")};
`;

const SidebarWrapper = styled.div`
  height: 100%;
  z-index: 5;
`

function Profile() {
  const [user] = useAuthState(auth)
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    username: "",
    photoURL: "",
  })
  const [editing, setEditing] = useState(false)
  const [newProfileImage, setNewProfileImage] = useState(null)
  const [activeTab, setActiveTab] = useState("Personal Info")
  const [loading, setLoading] = useState(false)
    const { expanded } = useContext(SidebarToggleContext);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" })
  const [comments, setComments] = useState([])

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = doc(db, "learner", user.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          setUserData(userDoc.data())
        }
      }
    }

    fetchUserData()
  }, [user])

  useEffect(() => {
    const fetchComments = async () => {
      if (user && activeTab === "Comments") {
        const commentsRef = collection(db, "courseComments")
        const q = query(commentsRef, where("userId", "==", user.uid))
        const querySnapshot = await getDocs(q)
        const commentsData = []
        querySnapshot.forEach((doc) => {
          commentsData.push({
            id: doc.id,
            ...doc.data(),
          })
        })
        setComments(commentsData)
      }
    }

    fetchComments()
  }, [user, activeTab])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    setNewProfileImage(e.target.files[0])
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (user) {
        const userRef = doc(db, "learner", user.uid)
        await updateDoc(userRef, {
          fullName: userData.fullName,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          address: userData.address,
          username: userData.username,
        })

        if (newProfileImage) {
          const photoURL = await uploadToCloudinary(newProfileImage)
          if (photoURL) {
            await updateDoc(userRef, { photoURL })
            setUserData((prevData) => ({ ...prevData, photoURL }))
          }
        }

        setAlert({ show: true, message: "Profile updated successfully!", type: "success" })
        setEditing(false)
      }
    } catch (error) {
      setAlert({ show: true, message: "Failed to update profile.", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setNewProfileImage(null)
  }

  return (
    <div className="flex h-screen">
      <SidebarWrapper>
                              <Sidebar />
                            </SidebarWrapper>
      <MainContent expanded={expanded}>
        <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full from-indigo-500/20 to-purple-500/0 blur-2xl" />
        <div className="absolute -right-16 -bottom-16 h-32 w-32 rounded-full from-purple-500/20 to-indigo-500/0 blur-2xl" />

        <div className="relative flex flex-col items-center md:flex-row md:items-start mb-6">
          <div className="group/avatar relative mb-4 md:mb-0 md:mr-6">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-75 blur transition-all duration-300 group-hover/avatar:opacity-100" />
            <div className="relative h-32 w-32 rounded-full bg-blue-950 ring-2">
              <img
                src={userData.photoURL || "default-profile-image.jpg"}
                alt="Profile"
                className="h-32 w-32 rounded-full"
              />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-semibold text-blue-950">{userData.fullName}</h2>
            <p className="text-gray-800">{userData.email}</p>
          </div>
        </div>

        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab("Personal Info")}
            className={`text-blue-950 ${activeTab === "Personal Info" ? "underline" : ""}`}
          >
            Personal Info
          </button>
          <button
            onClick={() => setActiveTab("Progress")}
            className={`text-blue-950 ${activeTab === "Progress" ? "underline" : ""}`}
          >
            Progress
          </button>
          <button
            onClick={() => setActiveTab("History")}
            className={`text-blue-950 ${activeTab === "History" ? "underline" : ""}`}
          >
            Completed Courses
          </button>
          <button
            onClick={() => setActiveTab("Comments")}
            className={`text-blue-950 ${activeTab === "Comments" ? "underline" : ""}`}
          >
            Comments
          </button>
        </div>

        {activeTab === "Personal Info" && (
          <div className="bg p-4 rounded-lg shadow-inner">
            <h3 className="text-lg font-semibold mb-2 text-blue-950">Personal Info</h3>
            {editing ? (
              <div>
                <div className="mb-4">
                  <label className="block text-gray-700">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={userData.fullName}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-lg text-black"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-lg text-gray-800"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={userData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-lg text-gray-800"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={userData.address}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-lg text-gray-800"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={userData.username}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-lg text-gray-800"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Profile Image</label>
                  <input type="file" onChange={handleImageChange} className="w-full" />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-blue-500 text-white p-2 rounded-lg"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 bg-red-500 text-white p-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-500">
                  <strong>Phone Number:</strong> <span className="text-blue-500 text-sm"> {userData.phoneNumber}</span>
                </p>
                <p className="text-gray-500">
                  <strong>Address:</strong> <span className="text-blue-500 text-sm">{userData.address}</span>
                </p>
                <p className="text-gray-500">
                  <strong>Username:</strong> <span className="text-blue-500 text-sm">{userData.username}</span>
                </p>
                <button
                  onClick={() => setEditing(true)}
                  className="relative mt-4 overflow-hidden text-white bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg group"
                >
                  <span className="flex items-center px-4 py-2 transition-transform duration-300 transform group-hover:translate-x-1">
                    Edit Profile
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 ml-2"
                    >
                      <path d="M24 12l-5.657 5.657-1.414-1.414L21.172 12l-4.243-4.243 1.414-1.414L24 12zM2.828 12l4.243 4.243-1.414 1.414L0 12l5.657-5.657L7.07 7.757 2.828 12zm6.96 9H7.66l6.552-18h2.128L9.788 21z" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "Progress" && (
          <div className="bg p-4 rounded-lg shadow-inner">
            <ProfileProgress />
          </div>
        )}

        {activeTab === "History" && (
          <div className="bg p-4 rounded-lg shadow-inner">
            <ProfileHistory />
          </div>
        )}

        {activeTab === "Comments" && (
          <div className="bg p-4 rounded-lg shadow-inner">
            <h3 className="text-lg font-semibold mb-2 text-blue-950">Comments</h3>
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-blue-950">
                        Course: <span className="text-indigo-600">{comment.courseTitle || "Unknown Course"}</span>
                      </h4>
                      {comment.rating && (
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill={i < comment.rating ? "currentColor" : "none"}
                              stroke="currentColor"
                              className={`w-4 h-4 ${i < comment.rating ? "text-yellow-500" : "text-gray-300"}`}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                              />
                            </svg>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700">{comment.comment}</p>
                    <p className="text-gray-500 text-sm mt-2">
                      {comment.createdAt?.toDate ? new Date(comment.createdAt?.toDate()).toLocaleString() : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No comments available.</p>
            )}
          </div>
        )}

        {alert.show && (
          <div
            className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg bg-white border-l-4 ${alert.type === "success" ? "border-green-500" : "border-red-500"}`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  strokeWidth={0}
                  fill="currentColor"
                  stroke="currentColor"
                  className={`w-6 h-6 ${alert.type === "success" ? "text-green-500" : "text-red-500"}`}
                >
                  <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">{alert.message}</p>
              </div>
              <button
                onClick={() => setAlert({ show: false, message: "", type: "" })}
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 15 15"
                  strokeWidth={0}
                  fill="none"
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fill="currentColor"
                    d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                    clipRule="evenodd"
                    fillRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </MainContent>
    </div>
  )
}

export default Profile

