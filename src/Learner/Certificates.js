"use client"

import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useEffect, useRef, useState, useContext } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { FaCertificate, FaDownload, FaEye, FaTrash } from "react-icons/fa"
import styled from "styled-components"
import Sidebar from "../components/LSidebar"
import { auth, db } from "../firebase.config"
import { SidebarToggleContext } from "../components/LgNavbar"; // Import the context


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
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #333;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 20px;
`

const CertificateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`

const CertificateCard = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`

const CertificateHeader = styled.div`
  padding: 15px;
  border-bottom: 1px solid #eaeaea;
`

const CertificateContent = styled.div`
  padding: 15px;
`

const CertificateTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 5px 0;
  color: #2c3e50;
`

const CertificateDate = styled.p`
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
`

const CertificateFooter = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: #f9f9f9;
  border-top: 1px solid #eaeaea;
`

const CertificateButton = styled.button`
  background: none;
  border: none;
  color: #3498db;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(52, 152, 219, 0.1);
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  background-color: #f8fafc;
  border-radius: 8px;
  margin-top: 20px;
`

const CertificatePage = () => {
  const [user] = useAuthState(auth)
  const { expanded } = useContext(SidebarToggleContext);
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: "", type: "" })
  const certificateRef = useRef(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [certificateToDelete, setCertificateToDelete] = useState(null)

  const confirmDeleteCertificate = (certificateId) => {
    setCertificateToDelete(certificateId)
    setShowDeleteConfirm(true)
  }

  const deleteCertificate = async () => {
    if (!certificateToDelete) return

    try {
      setDeleteLoading(true)

      // Delete the certificate from Firestore
      await deleteDoc(doc(db, "certificates", certificateToDelete))

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

        // Fetch fresh data from Firestore
        const certificatesQuery = query(collection(db, "certificates"), where("userId", "==", user.uid))

        const querySnapshot = await getDocs(certificatesQuery)

        if (querySnapshot.empty) {
          setCertificates([])
          return
        }

        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Ensure formattedDate exists
          formattedDate:
            doc.data().formattedDate ||
            new Date(doc.data().issueDate?.toDate()).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
        }))

        setCertificates(data)
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
          <Title>Certificates</Title>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
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
        <Title>Certificates</Title>

        {/* Refresh button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {certificates.length > 0 ? (
          <CertificateGrid>
            {certificates.map((cert) => (
              <CertificateCard key={cert.id}>
                <CertificateContent>
                  <CertificateTitle>{cert.moduleTitle || cert.title}</CertificateTitle>
                  <CertificateDate>Issued on {cert.formattedDate}</CertificateDate>
                </CertificateContent>
                <CertificateFooter>
                  <CertificateButton onClick={() => viewCertificate(cert)}>
                    <FaEye /> View
                  </CertificateButton>
                  <CertificateButton onClick={() => downloadAsPDF(cert)}>
                    <FaDownload /> PDF
                  </CertificateButton>
                  <CertificateButton onClick={() => confirmDeleteCertificate(cert.id)}>
                    <FaTrash className="text-red-500" /> Delete
                  </CertificateButton>
                </CertificateFooter>
              </CertificateCard>
            ))}
          </CertificateGrid>
        ) : (
          <EmptyState>
            <FaCertificate className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No certificates yet</h3>
            <p className="text-gray-500">Complete modules to earn certificates.</p>
          </EmptyState>
        )}

        {/* Certificate Viewer Modal */}
        {selectedCertificate && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 overflow-hidden">
              <div className="p-4 bg-blue-900 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold">Certificate of Completion</h3>
                <button onClick={closeCertificateView} className="text-white hover:text-gray-300">
                  &times;
                </button>
              </div>

              <div className="p-4 overflow-auto max-h-[80vh]">
                <div ref={certificateRef}>
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
                          {selectedCertificate.courseTitle}
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
                </div>
              </div>

              <div className="bg-gray-100 p-4 flex justify-between">
                <button
                  onClick={() => confirmDeleteCertificate(selectedCertificate.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash className="mr-2" /> Delete
                    </>
                  )}
                </button>

                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadAsImage(selectedCertificate)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Download Image
                  </button>

                  <button
                    onClick={() => downloadAsPDF(selectedCertificate)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert message */}
        {alert.show && (
          <div
            className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
              alert.type === "success"
                ? "bg-green-100 border-l-4 border-green-500 text-green-700"
                : "bg-red-100 border-l-4 border-red-500 text-red-700"
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {alert.type === "success" ? (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm">{alert.message}</p>
              </div>
              <button onClick={closeAlert} className="ml-auto text-gray-500 hover:text-gray-700">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this certificate? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteCertificate}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors flex items-center"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Certificate"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </MainContent>
    </PageContainer>
  )
}

export default CertificatePage
