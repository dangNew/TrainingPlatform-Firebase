"use client"

import { collection, deleteDoc, doc, getDocs, query, where, getDoc, updateDoc, deleteField } from "firebase/firestore"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useEffect, useRef, useState, useContext } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import {
  FaCertificate,
  FaEye,
  FaTrash,
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaCalendarAlt,
  FaFileDownload,
  FaImage,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa"
import styled, { keyframes } from "styled-components"
import Sidebar from "../components/LSidebar"
import { auth, db } from "../firebase.config"
import { SidebarToggleContext } from "../components/LgNavbar" // Import the context

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

const PageContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f4f6f9;
`

const SidebarWrapper = styled.div`
  height: 100%;
  z-index: 5;
`

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: margin-left 0.3s ease;
  margin-left: ${({ expanded }) => (expanded ? "16rem" : "4rem")};
  width: ${({ expanded }) => (expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)")};
`

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
  background: linear-gradient(to right, #0ea5e9, #4f46e5); /* sky-500 to indigo-600 */
  color: white;
  padding: 1.5rem;
  border-radius: 1rem; /* rounded-2xl ≈ 1rem or 16px */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
              0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
  overflow: hidden;
  width: 100%;
`;


const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  margin-left: 3rem;
`

const ActionBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`

const SearchBar = styled.div`
  flex: 1;
  min-width: 250px;
  position: relative;
`

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background-color: white;
  font-size: 0.875rem;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
`

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
`

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(to right, #3b82f6, #2563eb);
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
  
  &:hover {
    background: linear-gradient(to right, #2563eb, #1d4ed8);
    transform: translateY(-1px);
    box-shadow: 0 6px 8px -1px rgba(59, 130, 246, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: linear-gradient(to right, #9ca3af, #6b7280);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`

const CertificateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  animation: ${fadeIn} 0.5s ease-out;
`

const CertificateCard = styled.div`
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(to right, #3b82f6, #2563eb);
  }
`

const CertificateImagePreview = styled.div`
  height: 160px;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5), transparent);
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;
  }
`

const CertificateIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  font-size: 2rem;
  z-index: 1;
`

const CertificateContent = styled.div`
  padding: 1.5rem;
`

const CertificateTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`

const CertificateDate = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const CertificateFooter = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background-color: #f9fafb;
  border-top: 1px solid #f3f4f6;
`

const CertificateButton = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(59, 130, 246, 0.1);
  }
  
  &.delete {
    color: #ef4444;
    
    &:hover {
      background-color: rgba(239, 68, 68, 0.1);
    }
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  animation: ${fadeIn} 0.5s ease-out;
`

const EmptyStateIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: #9ca3af;
  font-size: 2rem;
`

const EmptyStateTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`

const EmptyStateText = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
`

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

const LoadingText = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
`

const Modal = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
  animation: ${fadeIn} 0.3s ease-out;
`

const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(to right, #3b82f6, #2563eb);
  color: white;
`

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`

const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
`

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
`

const ModalButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  
  &.primary {
    background: linear-gradient(to right, #3b82f6, #2563eb);
    color: white;
    border: none;
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
    
    &:hover {
      background: linear-gradient(to right, #2563eb, #1d4ed8);
      transform: translateY(-1px);
      box-shadow: 0 6px 8px -1px rgba(59, 130, 246, 0.4);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  &.secondary {
    background-color: white;
    color: #4b5563;
    border: 1px solid #e5e7eb;
    
    &:hover {
      background-color: #f9fafb;
      border-color: #d1d5db;
    }
  }
  
  &.danger {
    background: linear-gradient(to right, #ef4444, #dc2626);
    color: white;
    border: none;
    box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
    
    &:hover {
      background: linear-gradient(to right, #dc2626, #b91c1c);
      transform: translateY(-1px);
      box-shadow: 0 6px 8px -1px rgba(239, 68, 68, 0.4);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
`

const CertificatePreview = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`

const Alert = styled.div`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  animation: ${fadeIn} 0.3s ease-out;
  max-width: 400px;
  z-index: 100;
  
  &.success {
    background: linear-gradient(to right, #dcfce7, #f0fdf4);
    border-left: 4px solid #16a34a;
  }
  
  &.error {
    background: linear-gradient(to right, #fee2e2, #fef2f2);
    border-left: 4px solid #dc2626;
  }
`

const AlertIcon = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &.success {
    background-color: rgba(22, 163, 74, 0.2);
    color: #16a34a;
  }
  
  &.error {
    background-color: rgba(220, 38, 38, 0.2);
    color: #dc2626;
  }
`

const AlertContent = styled.div`
  flex: 1;
`

const AlertTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  
  &.success {
    color: #166534;
  }
  
  &.error {
    color: #991b1b;
  }
`

const AlertMessage = styled.p`
  font-size: 0.75rem;
  margin: 0;
  
  &.success {
    color: #14532d;
  }
  
  &.error {
    color: #7f1d1d;
  }
`

const AlertCloseButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;
  
  &.success {
    color: #16a34a;
    
    &:hover {
      background-color: rgba(22, 163, 74, 0.1);
    }
  }
  
  &.error {
    color: #dc2626;
    
    &:hover {
      background-color: rgba(220, 38, 38, 0.1);
    }
  }
`

const ConfirmDialog = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
  animation: ${fadeIn} 0.3s ease-out;
`

const ConfirmDialogContent = styled.div`
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`

const ConfirmDialogHeader = styled.div`
  padding: 1.5rem 1.5rem 0.5rem;
  text-align: center;
`

const ConfirmDialogIcon = styled.div`
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto 1rem;
`

const ConfirmDialogTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`

const ConfirmDialogMessage = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
`

const ConfirmDialogFooter = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 1.5rem 1.5rem;
`

const AddCourseButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(to right, #8b5cf6, #7c3aed);
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3);

  &:hover {
    background: linear-gradient(to right, #7c3aed, #6d28d9);
    transform: translateY(-1px);
    box-shadow: 0 6px 8px -1px rgba(139, 92, 246, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`

const CertificatePage = () => {
  const [user] = useAuthState(auth)
  const { expanded } = useContext(SidebarToggleContext)
  const [certificates, setCertificates] = useState([])
  const [filteredCertificates, setFilteredCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: "", type: "" })
  const certificateRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [certificateToDelete, setCertificateToDelete] = useState(null)

  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showSortModal, setShowSortModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [sortOption, setSortOption] = useState("Date")

  const confirmDeleteCertificate = (certificateId) => {
    setCertificateToDelete(certificateId)
    setShowDeleteConfirm(true)
  }

  const deleteCertificate = async () => {
    if (!certificateToDelete) return

    try {
      setDeleteLoading(true)

      const certificateToRemove = certificates.find((cert) => cert.id === certificateToDelete)

      if (certificateToRemove?.isLegacy) {
        // Delete from old certificates collection
        await deleteDoc(doc(db, "certificates", certificateToDelete))
      } else {
        // Delete from progress collection
        // Determine user type
        let userType = null
        const learnerRef = doc(db, "learner", user.uid)
        const learnerSnap = await getDoc(learnerRef)

        if (learnerSnap.exists()) {
          userType = "learner"
        } else {
          userType = "intern"
        }

        if (certificateToRemove?.courseId) {
          // Remove certificate field from progress document
          const progressRef = doc(db, userType, user.uid, "progress", certificateToRemove.courseId)
          await updateDoc(progressRef, {
            certificate: deleteField(),
          })
        }
      }

      // Show success message
      setAlert({
        show: true,
        message: "Certificate deleted successfully",
        type: "success",
      })

      // Refresh the certificates list
      setRefreshTrigger((prev) => prev + 1)

      // Close the certificate viewer if open
      if (selectedCertificate && selectedCertificate.id === certificateToDelete) {
        setSelectedCertificate(null)
      }
    } catch (error) {
      console.error("Error deleting certificate:", error)
      setAlert({
        show: true,
        message: "Failed to delete certificate. Please try again.",
        type: "error",
      })
    } finally {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
      setCertificateToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setCertificateToDelete(null)
  }

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Clear any existing certificates data
        setCertificates([])

        // Determine user type first
        let userType = null

        // Check if user exists in learner collection
        const learnerRef = doc(db, "learner", user.uid)
        const learnerSnap = await getDoc(learnerRef)

        // Check if user exists in intern collection
        const internRef = doc(db, "intern", user.uid)
        const internSnap = await getDoc(internRef)

        if (learnerSnap.exists()) {
          userType = "learner"
        } else if (internSnap.exists()) {
          userType = "intern"
        } else {
          console.warn("User document not found in 'learner' or 'intern' collection")
          setCertificates([])
          setFilteredCertificates([])
          return
        }

        // Fetch all progress documents for the user
        const progressCollection = collection(db, userType, user.uid, "progress")
        const progressSnapshot = await getDocs(progressCollection)

        const certificatesData = []

        // Check each progress document for certificates
        for (const progressDoc of progressSnapshot.docs) {
          const progressData = progressDoc.data()

          // Check if this progress document has a certificate
          if (progressData.certificate) {
            const certificate = {
              id: `${progressDoc.id}_${progressData.certificate.certificateId}`, // Create unique ID
              courseId: progressDoc.id, // The document ID is the courseId
              ...progressData.certificate,
              // Ensure formattedDate exists
              formattedDate:
                progressData.certificate.formattedDate ||
                (progressData.certificate.issueDate?.toDate
                  ? progressData.certificate.issueDate.toDate().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })),
            }

            certificatesData.push(certificate)
          }
        }

        // Add this inside the fetchCertificates function, after getting certificates from progress collection
        for (const certificate of certificatesData) {
          try {
            // Fetch course data to get title and image
            if (certificate.courseId) {
              const courseRef = doc(db, userType === "intern" ? "Intern_Course" : "courses", certificate.courseId)
              const courseSnap = await getDoc(courseRef)

              if (courseSnap.exists()) {
                const courseData = courseSnap.data()

                // Update certificate with course data
                certificate.courseImage = courseData.fileUrl?.url || null

                // Only update courseTitle if it's not already set
                if (!certificate.courseTitle || certificate.courseTitle === "Complete Course") {
                  certificate.courseTitle = courseData.title || "Unknown Course"
                }

                // Add course description if available
                if (courseData.description) {
                  certificate.courseDescription = courseData.description
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching course data for certificate ${certificate.id}:`, error)
          }
        }

        // Fallback: Also check the old certificates collection for backward compatibility
        try {
          const oldCertificatesQuery = query(collection(db, "certificates"), where("userId", "==", user.uid))
          const oldCertificatesSnapshot = await getDocs(oldCertificatesQuery)

          const oldCertificatesData = oldCertificatesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isLegacy: true, // Mark as legacy certificate
            formattedDate:
              doc.data().formattedDate ||
              (doc.data().issueDate?.toDate
                ? doc.data().issueDate.toDate().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })),
          }))

          // Combine new and old certificates, avoiding duplicates
          const allCertificates = [...certificatesData]
          oldCertificatesData.forEach((oldCert) => {
            const isDuplicate = certificatesData.some((newCert) => newCert.certificateId === oldCert.certificateId)
            if (!isDuplicate) {
              allCertificates.push(oldCert)
            }
          })

          setCertificates(allCertificates)
          setFilteredCertificates(allCertificates)
        } catch (error) {
          console.error("Error fetching legacy certificates:", error)
          // If legacy fetch fails, just use the new certificates
          setCertificates(certificatesData)
          setFilteredCertificates(certificatesData)
        }
      } catch (error) {
        console.error("Error fetching certificates:", error)
        setAlert({
          show: true,
          message: "Failed to load certificates. Please try again.",
          type: "error",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCertificates()
  }, [user, refreshTrigger])

  // Filter certificates when search term changes
  useEffect(() => {
    let filtered = certificates

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (cert) =>
          cert.moduleTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cert.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter((cert) => cert.category === selectedCategory)
    }

    if (sortOption === "Date") {
      filtered.sort((a, b) => new Date(b.formattedDate) - new Date(a.formattedDate))
    } else if (sortOption === "Title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title))
    }

    setFilteredCertificates(filtered)
  }, [searchTerm, certificates, selectedCategory, sortOption])

  const viewCertificate = (certificate) => {
    setSelectedCertificate(certificate)
  }

  const downloadAsPDF = async (certificate) => {
    try {
      if (!certificateRef.current) return

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)

      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 10

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      pdf.save(
        `${certificate.userName.replace(/\s+/g, "_")}_${certificate.courseTitle.replace(/\s+/g, "_")}_Certificate.pdf`,
      )

      setAlert({
        show: true,
        message: "Certificate downloaded as PDF successfully",
        type: "success",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      setAlert({
        show: true,
        message: "Failed to download PDF. Please try again.",
        type: "error",
      })
    }
  }

  const downloadAsImage = async (certificate) => {
    try {
      if (!certificateRef.current) return

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      const imgData = canvas.toDataURL("image/png")

      // Create a download link
      const link = document.createElement("a")
      link.href = imgData
      link.download = `${certificate.userName.replace(/\s+/g, "_")}_${certificate.courseTitle.replace(/\s+/g, "_")}_Certificate.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setAlert({
        show: true,
        message: "Certificate downloaded as image successfully",
        type: "success",
      })
    } catch (error) {
      console.error("Error downloading image:", error)
      setAlert({
        show: true,
        message: "Failed to download image. Please try again.",
        type: "error",
      })
    }
  }

  const closeCertificateView = () => {
    setSelectedCertificate(null)
  }

  const closeAlert = () => {
    setAlert({ show: false, message: "", type: "" })
  }

  // Auto-close alerts after 5 seconds
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        closeAlert()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [alert.show])

  if (loading) {
    return (
      <PageContainer>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <MainContent expanded={expanded}>
          <PageHeader>
            <HeaderContent>
              <Title>
                <FaCertificate /> Certificates
              </Title>
              <Subtitle>View and manage your earned certificates</Subtitle>
            </HeaderContent>
          </PageHeader>

          <LoadingContainer>
            <LoadingSpinner />
            <LoadingText>Loading your certificates...</LoadingText>
          </LoadingContainer>
        </MainContent>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>
      <MainContent expanded={expanded}>
        <PageHeader>
          <HeaderContent>
            <Title>
              <FaCertificate /> Certificates
            </Title>
            <Subtitle>View and manage your earned certificates</Subtitle>
          </HeaderContent>
          <ActionBar>
            <SearchBar>
              <SearchIcon>
                <FaSearch />
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder="Search courses by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchBar>
            {/* <FilterButton onClick={() => setShowFilterModal(true)}>
              <FaFilter />
              {selectedCategory}
            </FilterButton>
            <FilterButton onClick={() => setShowSortModal(true)}>
              <FaSortAmountDown />
              Sort by {sortOption}
            </FilterButton>
            <AddCourseButton onClick={() => setShowAddCourseModal(true)}>
              <FaCertificate />
              Add New Course
            </AddCourseButton> */}
          </ActionBar>
        </PageHeader>

        {filteredCertificates.length > 0 ? (
          <CertificateGrid>
            {filteredCertificates.map((cert) => (
              <CertificateCard key={cert.id}>
                <CertificateImagePreview>
                  {cert.courseImage ? (
                    <img
                      src={cert.courseImage || "/placeholder.svg"}
                      alt={cert.courseTitle || "Certificate"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <CertificateIcon>
                      <FaCertificate />
                    </CertificateIcon>
                  )}
                </CertificateImagePreview>

                <CertificateContent>
                  <CertificateTitle>
                    {cert.courseTitle || cert.moduleTitle || cert.title || "Certificate"}
                  </CertificateTitle>
                  <CertificateDate>
                    <FaCalendarAlt />
                    Issued on {cert.formattedDate}
                  </CertificateDate>
                </CertificateContent>

                <CertificateFooter>
                  <CertificateButton onClick={() => viewCertificate(cert)}>
                    <FaEye />
                    View
                  </CertificateButton>

                  <CertificateButton onClick={() => downloadAsPDF(cert)}>
                    <FaFileDownload />
                    PDF
                  </CertificateButton>

                  <CertificateButton className="delete" onClick={() => confirmDeleteCertificate(cert.id)}>
                    <FaTrash />
                    Delete
                  </CertificateButton>
                </CertificateFooter>
              </CertificateCard>
            ))}
          </CertificateGrid>
        ) : (
          <EmptyState>
            <EmptyStateIcon>
              <FaCertificate />
            </EmptyStateIcon>
            <EmptyStateTitle>No certificates yet</EmptyStateTitle>
            <EmptyStateText>
              Complete courses and modules to earn certificates. They will appear here once you've earned them.
            </EmptyStateText>
          </EmptyState>
        )}

        {/* Add Course Modal */}
        {showAddCourseModal && (
          <Modal>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Add New Course</ModalTitle>
                <ModalCloseButton onClick={() => setShowAddCourseModal(false)}>
                  <FaTimes />
                </ModalCloseButton>
              </ModalHeader>
              <ModalBody>
                <p>Add course form goes here.</p>
              </ModalBody>
              <ModalFooter>
                <ModalButton className="secondary" onClick={() => setShowAddCourseModal(false)}>
                  Cancel
                </ModalButton>
                <ModalButton className="primary" onClick={() => setShowAddCourseModal(false)}>
                  Add Course
                </ModalButton>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}

        {/* Filter Modal */}
        {showFilterModal && (
          <Modal>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Filter by Category</ModalTitle>
                <ModalCloseButton onClick={() => setShowFilterModal(false)}>
                  <FaTimes />
                </ModalCloseButton>
              </ModalHeader>
              <ModalBody>
                <p>Filter options go here.</p>
              </ModalBody>
              <ModalFooter>
                <ModalButton className="secondary" onClick={() => setShowFilterModal(false)}>
                  Cancel
                </ModalButton>
                <ModalButton className="primary" onClick={() => setShowFilterModal(false)}>
                  Apply
                </ModalButton>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}

        {/* Sort Modal */}
        {showSortModal && (
          <Modal>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Sort by</ModalTitle>
                <ModalCloseButton onClick={() => setShowSortModal(false)}>
                  <FaTimes />
                </ModalCloseButton>
              </ModalHeader>
              <ModalBody>
                <p>Sort options go here.</p>
              </ModalBody>
              <ModalFooter>
                <ModalButton className="secondary" onClick={() => setShowSortModal(false)}>
                  Cancel
                </ModalButton>
                <ModalButton className="primary" onClick={() => setShowSortModal(false)}>
                  Apply
                </ModalButton>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}

        {/* Certificate Viewer Modal */}
        {selectedCertificate && (
          <Modal>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Certificate of Completion</ModalTitle>
                <ModalCloseButton onClick={closeCertificateView}>
                  <FaTimes />
                </ModalCloseButton>
              </ModalHeader>

              <ModalBody>
                <CertificatePreview ref={certificateRef}>
                  <div className="w-[800px] h-[600px] bg-white p-8 relative mx-auto">
                    {/* Decorative Border */}
                    <div className="absolute inset-0 border-[12px] border-double border-blue-900 m-4 pointer-events-none"></div>

                    {/* Decorative Corner Elements */}
                    <div className="absolute top-6 left-6 w-20 h-20 border-t-4 border-l-4 border-blue-900"></div>
                    <div className="absolute top-6 right-6 w-20 h-20 border-t-4 border-r-4 border-blue-900"></div>
                    <div className="absolute bottom-6 left-6 w-20 h-20 border-b-4 border-l-4 border-blue-900"></div>
                    <div className="absolute bottom-6 right-6 w-20 h-20 border-b-4 border-r-4 border-blue-900"></div>

                    {/* Decorative Background */}
                    <div className="absolute inset-0 m-8 bg-gradient-to-br from-blue-50 to-white opacity-50 pointer-events-none"></div>

                    {/* Certificate Content */}
                    <div className="relative h-full flex flex-col items-center justify-between py-10 px-12 text-center">
                      {/* Header */}
                      <div>
                        <div className="text-blue-900 text-4xl font-bold mb-2 font-serif">
                          Certificate of Completion
                        </div>
                        <div className="w-60 h-1 bg-gradient-to-r from-transparent via-blue-900 to-transparent mx-auto mb-6"></div>
                        <div className="text-gray-500 text-lg mb-2">This certifies that</div>
                        <div className="text-blue-900 text-4xl font-bold mb-4 font-serif">
                          {selectedCertificate.userName}
                        </div>
                      </div>

                      {/* Middle Content */}
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="text-gray-700 text-lg mb-2">has successfully completed</div>
                        <div className="text-blue-900 text-2xl font-semibold mb-4">
                          {selectedCertificate.courseTitle || "Complete Course"}
                        </div>

                        {selectedCertificate.courseDescription && (
                          <div className="text-gray-600 text-sm max-w-md mb-4 italic">
                            "{selectedCertificate.courseDescription.substring(0, 120)}
                            {selectedCertificate.courseDescription.length > 120 ? "..." : ""}"
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="w-full">
                        <div className="flex justify-between items-end">
                          <div className="text-left">
                            <div className="text-gray-500 text-sm">Issued on</div>
                            <div className="text-blue-900 font-semibold">{selectedCertificate.formattedDate}</div>
                            <div className="text-gray-500 text-sm mt-2">Certificate ID</div>
                            <div className="text-blue-900 font-mono text-sm">{selectedCertificate.certificateId}</div>
                          </div>

                          <div className="flex flex-col items-center">
                            <div className="w-20 h-20 flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-blue-900 h-16 w-16 opacity-80"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div className="w-16 h-1 bg-blue-900 mb-1"></div>
                            <div className="text-sm text-gray-600">Official Seal</div>
                          </div>

                          <div className="text-right">
                            <div className="italic text-blue-800 text-xl mb-1 font-script">Miss Lily Beth</div>
                            <div className="w-32 h-1 bg-blue-900 ml-auto mb-1"></div>
                            <div className="text-sm text-gray-600">Authorized Representative</div>
                            <div className="text-sm text-gray-600 font-semibold mt-2">WealthFinancials</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border-4 border-blue-100 rounded-full opacity-10 pointer-events-none"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-4 border-blue-100 rounded-full opacity-10 pointer-events-none"></div>
                  </div>
                </CertificatePreview>
              </ModalBody>

              <ModalFooter>
                <ModalButton
                  className="danger"
                  onClick={() => confirmDeleteCertificate(selectedCertificate.id)}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash /> Delete
                    </>
                  )}
                </ModalButton>

                <ButtonGroup>
                  <ModalButton className="secondary" onClick={() => downloadAsImage(selectedCertificate)}>
                    <FaImage /> Download Image
                  </ModalButton>

                  <ModalButton className="primary" onClick={() => downloadAsPDF(selectedCertificate)}>
                    <FaFileDownload /> Download PDF
                  </ModalButton>
                </ButtonGroup>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}

        {/* Alert message */}
        {alert.show && (
          <Alert className={alert.type}>
            <AlertIcon className={alert.type}>
              {alert.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
            </AlertIcon>

            <AlertContent>
              <AlertTitle className={alert.type}>{alert.type === "success" ? "Success" : "Error"}</AlertTitle>
              <AlertMessage className={alert.type}>{alert.message}</AlertMessage>
            </AlertContent>

            <AlertCloseButton className={alert.type} onClick={closeAlert} aria-label="Close alert">
              <FaTimes />
            </AlertCloseButton>
          </Alert>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <ConfirmDialog>
            <ConfirmDialogContent>
              <ConfirmDialogHeader>
                <ConfirmDialogIcon>
                  <FaExclamationTriangle />
                </ConfirmDialogIcon>
                <ConfirmDialogTitle>Confirm Deletion</ConfirmDialogTitle>
                <ConfirmDialogMessage>
                  Are you sure you want to delete this certificate? This action cannot be undone.
                </ConfirmDialogMessage>
              </ConfirmDialogHeader>

              <ConfirmDialogFooter>
                <ModalButton className="secondary" onClick={cancelDelete}>
                  Cancel
                </ModalButton>

                <ModalButton className="danger" onClick={deleteCertificate} disabled={deleteLoading}>
                  {deleteLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Certificate"
                  )}
                </ModalButton>
              </ConfirmDialogFooter>
            </ConfirmDialogContent>
          </ConfirmDialog>
        )}
      </MainContent>
    </PageContainer>
  )
}

export default CertificatePage
