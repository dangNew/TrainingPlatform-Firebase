"use client"

import React, { useEffect, useState } from 'react'
import { db, auth } from '../firebase.config'
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import Sidebar from '../components/LSidebar'
import styled from 'styled-components'
import { FaCertificate, FaDownload, FaShare, FaEye, FaTrash } from 'react-icons/fa'

const PageContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f4f6f9;
`

const SidebarWrapper = styled.div`
  height: 100%;
`

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  margin-left: 10px;
`

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
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        
        // Clear any existing certificates data
        setCertificates([])
        
        // Fetch fresh data from Firestore
        const certificatesQuery = query(
          collection(db, 'certificates'),
          where('userId', '==', user.uid)
        )
        
        const querySnapshot = await getDocs(certificatesQuery)
        
        if (querySnapshot.empty) {
          setCertificates([])
          return
        }
        
        const data = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          // Ensure formattedDate exists
          formattedDate: doc.data().formattedDate || new Date(doc.data().issueDate?.toDate()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        }))
        
        setCertificates(data)
      } catch (error) {
        console.error('Error fetching certificates:', error)
        setAlert({
          show: true,
          message: 'Failed to load certificates. Please try again.',
          type: 'error'
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

  const downloadCertificate = (certificate) => {
    // In a real implementation, this would generate a PDF and download it
    alert(`Downloading certificate for ${certificate.moduleTitle}`)
  }

  const shareCertificate = (certificate) => {
    // In a real implementation, this would open a share dialog
    alert(`Sharing certificate for ${certificate.moduleTitle}`)
  }

  const deleteCertificate = async (certificateId) => {
    if (!confirm('Are you sure you want to delete this certificate? This action cannot be undone.')) {
      return
    }
    
    try {
      setDeleteLoading(true)
      
      // Delete the certificate from Firestore
      await deleteDoc(doc(db, 'certificates', certificateId))
      
      // Show success message
      setAlert({
        show: true,
        message: 'Certificate deleted successfully',
        type: 'success'
      })
      
      // Refresh the certificates list
      setRefreshTrigger(prev => prev + 1)
      
      // Close the certificate viewer if open
      if (selectedCertificate && selectedCertificate.id === certificateId) {
        setSelectedCertificate(null)
      }
    } catch (error) {
      console.error('Error deleting certificate:', error)
      setAlert({
        show: true,
        message: 'Failed to delete certificate. Please try again.',
        type: 'error'
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const closeCertificateView = () => {
    setSelectedCertificate(null)
  }
  
  const closeAlert = () => {
    setAlert({ show: false, message: '', type: '' })
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
        <MainContent>
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
      <MainContent>
        <Title>Certificates</Title>
        
        {/* Refresh button */}
        <div className="mb-4 flex justify-end">
          <button 
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {certificates.length > 0 ? (
          <CertificateGrid>
            {certificates.map(cert => (
              <CertificateCard key={cert.id}>
                <CertificateHeader>
                  <CertificateTitle>{cert.moduleTitle}</CertificateTitle>
                  <CertificateDate>Issued on {cert.formattedDate}</CertificateDate>
                </CertificateHeader>
                
                {/* Certificate Preview - Render directly instead of using an image */}
                <div className="w-full h-[200px] bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
                  <div className="bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg p-4 w-full h-full flex flex-col items-center justify-center">
                    <FaCertificate className="text-yellow-400 text-4xl mb-2" />
                    <div className="text-white text-center">
                      <div className="text-sm font-semibold mb-1">{cert.courseTitle}</div>
                      <div className="text-xs opacity-80">{cert.moduleTitle}</div>
                      <div className="text-xs mt-2 opacity-70">Awarded to: {cert.userName}</div>
                    </div>
                  </div>
                </div>
                
                <CertificateContent>
                  <p className="text-gray-600 mb-2">Course: {cert.courseTitle}</p>
                  <p className="text-gray-600 mb-2">Certificate ID: {cert.certificateId}</p>
                </CertificateContent>
                
                <CertificateFooter>
                  <CertificateButton onClick={() => viewCertificate(cert)}>
                    <FaEye /> View
                  </CertificateButton>
                  <CertificateButton onClick={() => downloadCertificate(cert)}>
                    <FaDownload /> Download
                  </CertificateButton>
                  <CertificateButton onClick={() => deleteCertificate(cert.id)}>
                    <FaTrash className="text-red-500" /> Delete
                  </CertificateButton>
                </CertificateFooter>
              </CertificateCard>
            ))}
          </CertificateGrid>
        ) : (
          <EmptyState>
            <FaCertificate className="text-gray-400 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No certificates yet</h3>
            <p className="text-gray-500">Complete modules to earn certificates.</p>
          </EmptyState>
        )}
        
        {/* Certificate Viewer Modal */}
        {selectedCertificate && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
              <div className="p-4 bg-blue-900 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold">Certificate of Completion</h3>
                <button 
                  onClick={closeCertificateView}
                  className="text-white hover:text-gray-300"
                >
                  &times;
                </button>
              </div>
              
              <div className="p-8">
                <div className="border-8 border-blue-900 p-8 rounded-lg bg-gradient-to-br from-blue-50 to-white">
                  <div className="text-center">
                    <div className="text-blue-900 text-2xl font-bold mb-2">Certificate of Completion</div>
                    <div className="text-gray-500 text-sm mb-6">This certifies that</div>
                    
                    <div className="text-blue-900 text-3xl font-bold mb-6">{selectedCertificate.userName}</div>
                    
                    <div className="text-gray-700 mb-2">has successfully completed</div>
                    <div className="text-blue-900 text-2xl font-bold mb-2">{selectedCertificate.moduleTitle}</div>
                    <div className="text-gray-700 mb-6">from the course</div>
                    <div className="text-blue-900 text-xl font-semibold mb-6">{selectedCertificate.courseTitle}</div>
                    
                    <div className="text-gray-500 text-sm">
                      Issued on {selectedCertificate.formattedDate}
                    </div>
                    <div className="text-gray-500 text-sm">
                      Certificate ID: {selectedCertificate.certificateId}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-100 p-4 flex justify-between">
                <button 
                  onClick={() => deleteCertificate(selectedCertificate.id)}
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
                    onClick={() => downloadCertificate(selectedCertificate)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                  >
                    <FaDownload className="mr-2" /> Download
                  </button>
                  <button 
                    onClick={() => shareCertificate(selectedCertificate)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
                  >
                    <FaShare className="mr-2" /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Alert message */}
        {alert.show && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
            alert.type === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-700' : 
            'bg-red-100 border-l-4 border-red-500 text-red-700'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {alert.type === 'success' ? (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm">{alert.message}</p>
              </div>
              <button 
                onClick={closeAlert}
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </MainContent>
    </PageContainer>
  )
}

export default CertificatePage
