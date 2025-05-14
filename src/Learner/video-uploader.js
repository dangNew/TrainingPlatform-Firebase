"use client"

import { useState, useRef } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase.config"
import styled from "styled-components"
import { Camera, Upload, X, AlertCircle, CheckCircle } from "lucide-react"
import { getAuth } from "firebase/auth"

// Import the Cloudinary upload function at the top of the file
import uploadToCloudinary from "../uploadToCloudinary"

const UploaderContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const UploadArea = styled.div`
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 15px;

  &:hover {
    border-color: #3b82f6;
    background-color: #f8fafc;
  }
`

const VideoPreview = styled.div`
  margin-top: 15px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #000;
  position: relative;
`

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }
`

const ProgressContainer = styled.div`
  margin-top: 15px;
`

const ProgressBar = styled.div`
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  margin-top: 5px;
  overflow: hidden;
`

const ProgressFill = styled.div`
  height: 100%;
  background-color: #3b82f6;
  border-radius: 4px;
  transition: width 0.3s ease;
`

const CommentInput = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 15px;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
`

const UploadButton = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 15px;

  &:hover {
    background-color: #2563eb;
  }

  &:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
`

const ErrorMessage = styled.div`
  color: #ef4444;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
`

const VideoUploader = ({ courseId, userType, onVideoUploaded }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const fileInputRef = useRef(null)
  const auth = getAuth()
  const [successMessage, setSuccessMessage] = useState("")

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check if file is a video
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file")
      return
    }

    // Check file size (limit to 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError("File size should be less than 100MB")
      return
    }

    setError("")
    setSelectedFile(file)

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    // Check if file is a video
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file")
      return
    }

    // Check file size (limit to 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError("File size should be less than 100MB")
      return
    }

    setError("")
    setSelectedFile(file)

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Replace the handleUpload function with this updated version that uses Cloudinary
  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setProgress(0)
    setError("")

    try {
      // Set initial progress
      setProgress(10)

      // Upload to Cloudinary instead of Firebase Storage
      const cloudinaryResponse = await uploadToCloudinary(selectedFile)

      if (!cloudinaryResponse || !cloudinaryResponse.url) {
        throw new Error("Failed to upload video to Cloudinary: Invalid response")
      }

      console.log("Cloudinary upload successful:", cloudinaryResponse) // Add this log

      // Update progress after successful upload
      setProgress(90)

      // Create a JavaScript Date object for the current time
      const now = new Date()

      // Save video metadata to Firestore
      const videoData = {
        courseId,
        videoUrl: cloudinaryResponse.url,
        publicId: cloudinaryResponse.publicId, // Store Cloudinary public ID for potential future management
        comment: comment.trim(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        // Use both serverTimestamp for Firestore and a JS Date for immediate access
        uploadedAt: serverTimestamp(),
        // Add a JavaScript Date version of the timestamp that can be used immediately
        uploadedAtJS: now.toISOString(),
      }

      // Add to the Videos collection in the user's collection
      const docRef = await addDoc(collection(db, userType, auth.currentUser.uid, "Videos"), videoData)
      console.log("Video metadata saved to Firestore with ID:", docRef.id) // Add this log

      // Update progress to complete
      setProgress(100)

      // Reset form
      setSelectedFile(null)
      setPreview(null)
      setComment("")
      setUploading(false)
      setProgress(0)

      // Show success message
      setSuccessMessage("Video uploaded successfully!")
      setTimeout(() => setSuccessMessage(""), 5000) // Clear message after 5 seconds

      // Trigger refresh of videos list
      if (typeof onVideoUploaded === "function") {
        onVideoUploaded()
      }
    } catch (error) {
      console.error("Error in upload process:", error)
      setError(`Upload failed: ${error.message}`)
      setUploading(false)
    }
  }

  return (
    <UploaderContainer>
      <h3 className="text-lg font-semibold mb-3">Share Your Video Comment</h3>

      {!selectedFile ? (
        <UploadArea onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => fileInputRef.current.click()}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/*"
            style={{ display: "none" }}
          />
          <Camera size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 mb-2">Drag and drop a video file here, or click to select</p>
          <p className="text-gray-400 text-sm">Maximum file size: 100MB</p>
        </UploadArea>
      ) : (
        <VideoPreview>
          <video
            src={preview}
            controls
            style={{ width: "100%", maxHeight: "300px" }}
            onError={() => setError("Error loading video preview")}
          />
          <CloseButton onClick={clearSelection}>
            <X size={16} />
          </CloseButton>
        </VideoPreview>
      )}

      {error && (
        <ErrorMessage>
          <AlertCircle size={16} />
          {error}
        </ErrorMessage>
      )}

      {successMessage && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md flex items-center gap-2">
          <CheckCircle size={16} />
          {successMessage}
        </div>
      )}

      {selectedFile && (
        <>
          <CommentInput
            placeholder="Add a comment about your video..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={uploading}
          />

          {uploading && (
            <ProgressContainer>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <ProgressBar>
                <ProgressFill style={{ width: `${progress}%` }} />
              </ProgressBar>
            </ProgressContainer>
          )}

          <UploadButton onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Upload Video
              </>
            )}
          </UploadButton>
        </>
      )}
    </UploaderContainer>
  )
}

export default VideoUploader
