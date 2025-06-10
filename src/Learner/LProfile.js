"use client"

import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { useEffect, useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import styled from "styled-components"
import { auth, db } from "../firebase.config"
import uploadToCloudinary from "../uploadToCloudinary"
import ProfileHistory from "./profile-history"
import ProfileProgress from "./profile-progress"

// Styled components
const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  background-color: white;
  width: 100%;
`

const ProfileHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
  }
`

const ProfileImageWrapper = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
  
  @media (min-width: 768px) {
    margin-right: 2rem;
    margin-bottom: 0;
  }
  
  &:before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: linear-gradient(to right, #9333ea, #ec4899);
    opacity: 0.75;
    filter: blur(8px);
  }
`

const ProfileImage = styled.div`
  position: relative;
  width: 128px;
  height: 128px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid white;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const ProfileInfo = styled.div`
  flex: 1;
  text-align: center;
  
  @media (min-width: 768px) {
    text-align: left;
  }
  
  h2 {
    font-size: 1.875rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }
  
  p {
    color: #64748b;
    margin-bottom: 0.25rem;
  }
  
  .username {
    font-size: 0.875rem;
    color: #94a3b8;
  }
`

const TabsContainer = styled.div`
  margin-bottom: 1.5rem;
`

const TabsList = styled.div`
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
`

const TabButton = styled.button`
  padding: 0.75rem 1rem;
  font-weight: 500;
  color: ${(props) => (props.active ? "#9333ea" : "#64748b")};
  border-bottom: 2px solid ${(props) => (props.active ? "#9333ea" : "transparent")};
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    color: ${(props) => (props.active ? "#9333ea" : "#334155")};
  }
`

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`

const CardHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  p {
    color: #64748b;
    font-size: 0.875rem;
  }
`

const CardContent = styled.div`
  padding: 1.5rem;
`

const FormGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const FormGroup = styled.div`
  margin-bottom: 1rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #334155;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    color: #1e293b;
    
    &:focus {
      outline: none;
      border-color: #9333ea;
      box-shadow: 0 0 0 1px #9333ea;
    }
  }
`

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`

const Button = styled.button`
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`

const PrimaryButton = styled(Button)`
  background-color: #9333ea;
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: #7e22ce;
  }
`

const SecondaryButton = styled(Button)`
  background-color: white;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  
  &:hover:not(:disabled) {
    background-color: #f8fafc;
    border-color: #cbd5e1;
  }
`

const EditButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(to right, #9333ea, #ec4899);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
`

const InfoGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const InfoItem = styled.div`
  margin-bottom: 1rem;
  
  h4 {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 0.25rem;
    font-weight: 500;
  }
  
  p {
    color: #1e293b;
  }
`

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const CommentCard = styled(Card)`
  margin-bottom: 1rem;
`

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  
  h4 {
    font-weight: 500;
    color: #1e293b;
    
    span {
      color: #9333ea;
    }
  }
`

const Rating = styled.div`
  display: flex;
  align-items: center;
`

const Star = styled.svg`
  width: 1rem;
  height: 1rem;
  color: ${(props) => (props.filled ? "#facc15" : "#cbd5e1")};
  fill: ${(props) => (props.filled ? "#facc15" : "none")};
`

const CommentDate = styled.p`
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
`

const CommentText = styled.p`
  color: #334155;
  font-size: 0.875rem;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 0;
  
  p {
    color: #64748b;
  }
`

const Alert = styled.div`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 50;
  max-width: 24rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-left: 4px solid ${(props) => (props.type === "success" ? "#10b981" : "#ef4444")};
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`

const AlertContent = styled.div`
  display: flex;
  align-items: flex-start;
`

const AlertIcon = styled.div`
  flex-shrink: 0;
  margin-right: 0.75rem;
  color: ${(props) => (props.type === "success" ? "#10b981" : "#ef4444")};
`

const AlertBody = styled.div`
  flex: 1;
`

const AlertTitle = styled.h4`
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
`

const AlertMessage = styled.p`
  color: #64748b;
  font-size: 0.875rem;
`

const AlertCloseButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: #94a3b8;
  background: none;
  border: none;
  cursor: pointer;
  
  &:hover {
    color: #64748b;
  }
`

function Profile() {
  const [user] = useAuthState(auth)
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    username: "",
    photoURL: {
      publicId: "",
      url: "",
    },
  })
  const [editing, setEditing] = useState(false)
  const [newProfileImage, setNewProfileImage] = useState(null)
  const [activeTab, setActiveTab] = useState("personal")
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: "", type: "" })
  const [comments, setComments] = useState([])
  const [userType, setUserType] = useState(null)

  const fetchUserData = async () => {
    if (user) {
      // First try to get user from users collection
      const usersRef = doc(db, "users", user.uid)
      const usersDoc = await getDoc(usersRef)

      if (usersDoc.exists()) {
        setUserData(usersDoc.data())
        setUserType("users")
      } else {
        // If not found in users collection, try learner collection
        const learnerRef = doc(db, "learner", user.uid)
        const learnerDoc = await getDoc(learnerRef)

        if (learnerDoc.exists()) {
          setUserData(learnerDoc.data())
          setUserType("learner")
        } else {
          // If not found in learner collection, try intern collection
          const internRef = doc(db, "intern", user.uid)
          const internDoc = await getDoc(internRef)

          if (internDoc.exists()) {
            setUserData(internDoc.data())
            setUserType("intern")
          }
        }
      }
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [user])

  useEffect(() => {
    const fetchComments = async () => {
      if (user && activeTab === "comments" && userType !== "users") {
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
  }, [user, activeTab, userType])

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
        // Determine which collection to update based on userType
        const userRef = doc(db, userType, user.uid)

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
            await updateDoc(userRef, {
              photoURL: {
                publicId: `modules/module_file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
                url: photoURL,
              },
            })
            setUserData((prevData) => ({
              ...prevData,
              photoURL: {
                publicId: `modules/module_file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
                url: photoURL,
              },
            }))
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

  // Auto-hide alert after 5 seconds
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert({ show: false, message: "", type: "" })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [alert.show])

  return (
    <MainContent>
      {/* Background decorations */}
      <div
        style={{
          position: "fixed",
          left: "-4rem",
          top: "-4rem",
          height: "8rem",
          width: "8rem",
          borderRadius: "9999px",
          background: "radial-gradient(circle, rgba(147, 51, 234, 0.2) 0%, rgba(236, 72, 153, 0) 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          right: "-4rem",
          bottom: "-4rem",
          height: "8rem",
          width: "8rem",
          borderRadius: "9999px",
          background: "radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, rgba(147, 51, 234, 0) 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Profile header */}
      <ProfileHeader>
        <ProfileImageWrapper>
          <ProfileImage>
            <img
              src={userData.photoURL?.url || "https://via.placeholder.com/128"}
              alt={userData.fullName || "Profile"}
            />
          </ProfileImage>
        </ProfileImageWrapper>
        <ProfileInfo>
          <h2>{userData.fullName || "User Name"}</h2>
          <p>{userData.email || "email@example.com"}</p>
          <p className="username">@{userData.username || "username"}</p>
          {userType && (
            <p className="mt-2 inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
              {userType === "learner" ? "Learner" : userType === "intern" ? "Intern" : "User"}
            </p>
          )}
        </ProfileInfo>
      </ProfileHeader>

      {/* Tabs */}
      <TabsContainer>
        <TabsList>
          <TabButton active={activeTab === "personal"} onClick={() => setActiveTab("personal")}>
            Personal Info
          </TabButton>
          {userType !== "users" && (
            <>
              <TabButton active={activeTab === "progress"} onClick={() => setActiveTab("progress")}>
                Progress
              </TabButton>
              <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")}>
                Completed Courses
              </TabButton>
              <TabButton active={activeTab === "comments"} onClick={() => setActiveTab("comments")}>
                Comments
              </TabButton>
            </>
          )}
        </TabsList>

        {/* Personal Info Tab */}
        {activeTab === "personal" && (
          <Card>
            <CardHeader>
              <h3>
                Personal Information
                {!editing && (
                  <EditButton onClick={() => setEditing(true)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit Profile
                  </EditButton>
                )}
              </h3>
              <p>Manage your personal information and contact details</p>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div>
                  <FormGrid>
                    <FormGroup>
                      <label htmlFor="fullName">Full Name</label>
                      <input
                        id="fullName"
                        name="fullName"
                        value={userData.fullName || ""}
                        onChange={handleInputChange}
                      />
                    </FormGroup>
                    <FormGroup>
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={userData.email || ""}
                        onChange={handleInputChange}
                      />
                    </FormGroup>
                    <FormGroup>
                      <label htmlFor="phoneNumber">Phone Number</label>
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        value={userData.phoneNumber || ""}
                        onChange={handleInputChange}
                      />
                    </FormGroup>
                    <FormGroup>
                      <label htmlFor="address">Address</label>
                      <input id="address" name="address" value={userData.address || ""} onChange={handleInputChange} />
                    </FormGroup>
                    <FormGroup>
                      <label htmlFor="username">Username</label>
                      <input
                        id="username"
                        name="username"
                        value={userData.username || ""}
                        onChange={handleInputChange}
                      />
                    </FormGroup>
                    <FormGroup>
                      <label htmlFor="profileImage">Profile Image</label>
                      <input id="profileImage" type="file" onChange={handleImageChange} style={{ cursor: "pointer" }} />
                    </FormGroup>
                  </FormGrid>
                  <ButtonGroup>
                    <SecondaryButton onClick={handleCancel} disabled={loading}>
                      Cancel
                    </SecondaryButton>
                    <PrimaryButton onClick={handleSave} disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </PrimaryButton>
                  </ButtonGroup>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">
                    Click the Edit Profile button to view and update your personal information.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Progress Tab */}
        {activeTab === "progress" && userType !== "users" && (
          <Card>
            <CardHeader>
              <h3>Your Progress</h3>
              <p>Track your learning journey and course progress</p>
            </CardHeader>
            <CardContent>
              <ProfileProgress />
            </CardContent>
          </Card>
        )}

        {/* History Tab */}
        {activeTab === "history" && userType !== "users" && (
          <Card>
            <CardHeader>
              <h3>Completed Courses</h3>
              <p>View your learning achievements and completed courses</p>
            </CardHeader>
            <CardContent>
              <ProfileHistory />
            </CardContent>
          </Card>
        )}

        {/* Comments Tab */}
        {activeTab === "comments" && userType !== "users" && (
          <Card>
            <CardHeader>
              <h3>Your Comments</h3>
              <p>Review your course comments and feedback</p>
            </CardHeader>
            <CardContent>
              {comments.length > 0 ? (
                <CommentsList>
                  {comments.map((comment, index) => (
                    <CommentCard key={index}>
                      <CardContent>
                        <CommentHeader>
                          <h4>
                            Course: <span>{comment.courseTitle || "Unknown Course"}</span>
                          </h4>
                          {comment.rating && (
                            <Rating>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  filled={i < comment.rating}
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                  />
                                </Star>
                              ))}
                            </Rating>
                          )}
                        </CommentHeader>
                        <CommentDate>
                          {comment.createdAt?.toDate ? new Date(comment.createdAt?.toDate()).toLocaleString() : ""}
                        </CommentDate>
                        <CommentText>{comment.comment}</CommentText>
                      </CardContent>
                    </CommentCard>
                  ))}
                </CommentsList>
              ) : (
                <EmptyState>
                  <p>No comments available.</p>
                </EmptyState>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContainer>

      {/* Alert notification */}
      {alert.show && (
        <Alert type={alert.type}>
          <AlertContent>
            <AlertIcon type={alert.type}>
              {alert.type === "success" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
            </AlertIcon>
            <AlertBody>
              <AlertTitle>{alert.type === "success" ? "Success" : "Error"}</AlertTitle>
              <AlertMessage>{alert.message}</AlertMessage>
            </AlertBody>
          </AlertContent>
          <AlertCloseButton onClick={() => setAlert({ show: false, message: "", type: "" })}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </AlertCloseButton>
        </Alert>
      )}
    </MainContent>
  )
}

export default Profile
