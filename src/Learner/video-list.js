"use client"

import { useState, useEffect, useRef } from "react"
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db, auth } from "../firebase.config"
import styled from "styled-components"
import {
  Video,
  Trash2,
  Calendar,
  AlertCircle,
  RefreshCw,
  Grid,
  List,
  X,
  MessageSquare,
  AlertTriangle,
} from "lucide-react"

const VideoListContainer = styled.div`
  margin-top: 30px;
`

const ViewToggleContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
`

const ViewToggleButton = styled.button`
  background-color: ${(props) => (props.active ? "#3b82f6" : "#e5e7eb")};
  color: ${(props) => (props.active ? "white" : "#4b5563")};
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 8px;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => (props.active ? "#2563eb" : "#d1d5db")};
  }
`

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`

const VideoListView = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const VideoCard = styled.div`
  background: white;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`

const ThumbnailContainer = styled.div`
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 aspect ratio */
  background-color: #000;
  overflow: hidden;
`

const Thumbnail = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-color: #000;
`

const Duration = styled.div`
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`

const VideoInfo = styled.div`
  padding: 12px;
`

const VideoTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`

const VideoStats = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
`

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  position: relative;
  width: 90%;
  max-width: 1000px;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
`

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }
`

const VideoPlayer = styled.video`
  width: 100%;
  max-height: 80vh;
  background-color: #000;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 30px;
  background-color: white;
  border-radius: 8px;
  border: 1px dashed #e5e7eb;
`

const DeleteButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #ef4444;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 5;

  ${VideoCard}:hover & {
    opacity: 1;
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }
`

const VideoComment = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #f9fafb;
  border-radius: 6px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.4;
  font-style: italic;
`

// New styled components for the custom delete confirmation modal
const DeleteConfirmationModal = styled.div`
  background-color: #1e293b;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const DeleteModalHeader = styled.div`
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const DeleteModalTitle = styled.h3`
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`

const DeleteModalBody = styled.div`
  padding: 20px;
  color: #cbd5e1;
  font-size: 15px;
  line-height: 1.5;
`

const DeleteModalFooter = styled.div`
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: rgba(0, 0, 0, 0.2);
`

const CancelButton = styled.button`
  background-color: #334155;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #475569;
  }
`

const DeleteConfirmButton = styled.button`
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #dc2626;
  }
`

const VideoList = ({ courseId, userType, onVideoDeleted }) => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState("grid") // 'grid' or 'list'
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [videoToDelete, setVideoToDelete] = useState(null) // Track which video to delete
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false) // Control delete confirmation modal
  const videoPlayerRef = useRef(null)

  useEffect(() => {
    fetchVideos()
  }, [courseId, userType, auth.currentUser])

  const fetchVideos = async () => {
    if (!courseId || !userType || !auth.currentUser) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Query videos for this course from the user's Videos collection
      const videosRef = collection(db, userType, auth.currentUser.uid, "Videos")

      // First check if there are any videos for this course without ordering
      const countQuery = query(videosRef, where("courseId", "==", courseId))
      const countSnapshot = await getDocs(countQuery)

      // If no videos exist yet, return early to avoid the index error
      if (countSnapshot.empty) {
        setVideos([])
        return
      }

      // Only use ordering if videos exist (which would require the index)
      const q = query(videosRef, where("courseId", "==", courseId), orderBy("uploadedAt", "desc"))

      try {
        const querySnapshot = await getDocs(q)

        const videosList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
        }))

        // Just add duration placeholder, we'll update it when metadata loads
        const enhancedVideos = videosList.map((video) => ({
          ...video,
          duration: "0:00", // This will be updated when the video metadata loads
        }))

        setVideos(enhancedVideos)
        setError(null) // Clear any previous errors
      } catch (indexError) {
        // If we get an index error, fall back to unordered results
        console.warn("Index error, falling back to unordered results:", indexError)

        const videosList = countSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
          duration: "0:00", // Placeholder
        }))

        // Sort the results in memory instead
        videosList.sort((a, b) => b.uploadedAt - a.uploadedAt)

        setVideos(videosList)

        // Show a more user-friendly error that doesn't mention indexes
        setError(null)
      }
    } catch (err) {
      console.error("Error fetching videos:", err)
      // Provide a more user-friendly error message
      setError("Unable to load videos. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // Updated to show custom confirmation modal instead of browser confirm
  const handleDeleteButtonClick = (e, video) => {
    e.stopPropagation() // Prevent opening the video when clicking delete
    setVideoToDelete(video)
    setShowDeleteConfirmation(true)
  }

  const confirmDelete = async () => {
    if (!videoToDelete) return

    try {
      // Delete the video document from Firestore
      await deleteDoc(doc(db, userType, auth.currentUser.uid, "Videos", videoToDelete.id))

      // Update the local state
      setVideos((prevVideos) => prevVideos.filter((video) => video.id !== videoToDelete.id))

      // If the deleted video is currently selected, close the modal
      if (selectedVideo && selectedVideo.id === videoToDelete.id) {
        setSelectedVideo(null)
      }

      // Notify parent component
      if (typeof onVideoDeleted === "function") {
        onVideoDeleted()
      }

      // Reset state
      setVideoToDelete(null)
      setShowDeleteConfirmation(false)
    } catch (err) {
      console.error("Error deleting video:", err)
      alert("Failed to delete video. Please try again.")
    }
  }

  const cancelDelete = () => {
    setVideoToDelete(null)
    setShowDeleteConfirmation(false)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  const handleVideoClick = (video) => {
    setSelectedVideo(video)
  }

  const closeModal = () => {
    setSelectedVideo(null)
  }

  const handleVideoMetadataLoaded = (e, videoId) => {
    const duration = e.target.duration
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    const formattedDuration = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`

    setVideos((prevVideos) =>
      prevVideos.map((video) => (video.id === videoId ? { ...video, duration: formattedDuration } : video)),
    )
  }

  if (loading) {
    return <div className="text-center py-4">Loading videos...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
        <div className="flex items-center">
          <AlertCircle size={20} className="mr-2" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchVideos}
          className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm flex items-center"
        >
          <RefreshCw size={14} className="mr-1" /> Retry
        </button>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <EmptyState>
        <Video size={40} className="mx-auto mb-3 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Videos Yet</h3>
        <p className="text-gray-500">
          You haven't uploaded any videos for this course. Share your thoughts in video format!
        </p>
      </EmptyState>
    )
  }

  return (
    <VideoListContainer>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">All Videos</h3>
        <ViewToggleContainer>
          <ViewToggleButton active={viewMode === "list"} onClick={() => setViewMode("list")} title="List view">
            <List size={20} />
          </ViewToggleButton>
          <ViewToggleButton active={viewMode === "grid"} onClick={() => setViewMode("grid")} title="Grid view">
            <Grid size={20} />
          </ViewToggleButton>
        </ViewToggleContainer>
      </div>

      {viewMode === "grid" ? (
        <VideoGrid>
          {videos.map((video) => (
            <VideoCard key={video.id} onClick={() => handleVideoClick(video)}>
              <ThumbnailContainer>
                <Thumbnail
                  style={{ backgroundImage: `url(${video.thumbnailUrl || "/placeholder.svg?height=180&width=320"})` }}
                >
                  {/* Hidden video element to load metadata */}
                  <video
                    src={video.videoUrl}
                    style={{ display: "none" }}
                    onLoadedMetadata={(e) => handleVideoMetadataLoaded(e, video.id)}
                  />
                </Thumbnail>
                <Duration>{video.duration}</Duration>
                <DeleteButton onClick={(e) => handleDeleteButtonClick(e, video)} title="Delete video">
                  <Trash2 size={16} />
                </DeleteButton>
              </ThumbnailContainer>
              <VideoInfo>
                <VideoTitle>{video.fileName}</VideoTitle>
                <VideoStats>
                  <StatItem>
                    <Calendar size={14} />
                    {formatDate(video.uploadedAt)}
                  </StatItem>
                </VideoStats>
                {video.comment && (
                  <VideoComment>
                    <MessageSquare size={14} className="inline mr-2 mb-1" />"{video.comment}"
                  </VideoComment>
                )}
              </VideoInfo>
            </VideoCard>
          ))}
        </VideoGrid>
      ) : (
        <VideoListView>
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              onClick={() => handleVideoClick(video)}
              style={{ display: "flex", height: "auto", minHeight: "120px" }}
            >
              <div style={{ position: "relative", width: "213px", minWidth: "213px", height: "120px" }}>
                <Thumbnail
                  style={{ backgroundImage: `url(${video.thumbnailUrl || "/placeholder.svg?height=120&width=213"})` }}
                >
                  {/* Hidden video element to load metadata */}
                  <video
                    src={video.videoUrl}
                    style={{ display: "none" }}
                    onLoadedMetadata={(e) => handleVideoMetadataLoaded(e, video.id)}
                  />
                </Thumbnail>
                <Duration>{video.duration}</Duration>
                <DeleteButton
                  onClick={(e) => handleDeleteButtonClick(e, video)}
                  title="Delete video"
                  style={{ top: "4px", right: "4px" }}
                >
                  <Trash2 size={14} />
                </DeleteButton>
              </div>
              <VideoInfo style={{ flex: 1 }}>
                <VideoTitle>{video.fileName}</VideoTitle>
                <VideoStats>
                  <StatItem>
                    <Calendar size={14} />
                    {formatDate(video.uploadedAt)}
                  </StatItem>
                </VideoStats>
                {video.comment && (
                  <VideoComment>
                    <MessageSquare size={14} className="inline mr-2 mb-1" />"{video.comment}"
                  </VideoComment>
                )}
              </VideoInfo>
            </VideoCard>
          ))}
        </VideoListView>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={closeModal}>
              <X size={20} />
            </CloseButton>
            <VideoPlayer
              ref={videoPlayerRef}
              src={selectedVideo.videoUrl}
              controls
              autoPlay
              onError={(e) => console.error("Video playback error:", e)}
            />
            {selectedVideo.comment && (
              <div className="p-4 bg-white">
                <h4 className="text-lg font-medium mb-2">Comment:</h4>
                <p className="text-gray-700">"{selectedVideo.comment}"</p>
              </div>
            )}
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <ModalOverlay onClick={cancelDelete}>
          <DeleteConfirmationModal onClick={(e) => e.stopPropagation()}>
            <DeleteModalHeader>
              <AlertTriangle size={24} color="#ef4444" />
              <DeleteModalTitle>Delete Video</DeleteModalTitle>
            </DeleteModalHeader>
            <DeleteModalBody>
              <p>Are you sure you want to delete this video?</p>
              <p className="mt-2 text-sm opacity-80">This action cannot be undone.</p>
            </DeleteModalBody>
            <DeleteModalFooter>
              <CancelButton onClick={cancelDelete}>Cancel</CancelButton>
              <DeleteConfirmButton onClick={confirmDelete}>Delete</DeleteConfirmButton>
            </DeleteModalFooter>
          </DeleteConfirmationModal>
        </ModalOverlay>
      )}
    </VideoListContainer>
  )
}

export default VideoList
