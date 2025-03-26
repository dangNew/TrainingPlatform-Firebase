import { useEffect, useState, useRef } from "react";
import { db, auth } from "../firebase.config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import Sidebar from "../components/LSidebar";
import styled from "styled-components";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const PageContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f4f6f9;
`;

const SidebarWrapper = styled.div`
  height: 100%;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  margin-left: 10px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #333;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const CertificateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const CertificateCard = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  padding: 15px;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const CertificateImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-bottom: 2px solid #ddd;
`;

const CertificateTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 10px 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 20px;
`;

const CertificatePage = () => {
  const [user, loading] = useAuthState(auth);
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const certificateRef = useRef(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // Create a query that only gets certificates for the current user
        const certificatesQuery = query(
          collection(db, "certificates"),
          where("userId", "==", user.uid)
        );

        const querySnapshot = await getDocs(certificatesQuery);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCertificates(data);
      } catch (error) {
        console.error("Error fetching certificates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading) {
      fetchCertificates();
    }
  }, [user, loading]);

  const downloadCertificate = (certId) => {
    const certificate = certificates.find((cert) => cert.id === certId);
    if (!certificate) return;

    html2canvas(certificateRef.current).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10);
      pdf.save(`certificate_${certificate.certificateId}.pdf`);
    });
  };

  if (loading || isLoading) {
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
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <MainContent>
          <Title>Certificates</Title>
          <EmptyState>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Please log in
            </h3>
            <p className="text-gray-500">
              You need to be logged in to view your certificates.
            </p>
          </EmptyState>
        </MainContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>
      <MainContent>
        <Title>Your Certificates</Title>

        {certificates.length === 0 ? (
          <EmptyState>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No certificates yet
            </h3>
            <p className="text-gray-500">
              Complete courses to earn certificates that will appear here.
            </p>
          </EmptyState>
        ) : (
          <CertificateGrid>
            {certificates.map((cert) => (
              <CertificateCard key={cert.id} ref={certificateRef}>
                <CertificateImage
                  src={cert.imageUrl || "/placeholder.svg?height=200&width=300"}
                  alt={cert.moduleTitle || cert.title}
                />
                <CertificateTitle>{cert.moduleTitle || cert.title}</CertificateTitle>
                <p className="text-gray-600 text-sm">{cert.courseTitle}</p>
                <p className="text-gray-500 text-xs mt-2">
                  Issued: {cert.formattedDate}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Certificate ID: {cert.certificateId}
                </p>
                <button
                  onClick={() => downloadCertificate(cert.id)}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Download
                </button>
              </CertificateCard>
            ))}
          </CertificateGrid>
        )}
      </MainContent>
    </PageContainer>
  );
};

export default CertificatePage;
