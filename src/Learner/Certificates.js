import React, { useEffect, useState } from 'react';
import { db } from '../firebase.config';
import { collection, getDocs } from 'firebase/firestore';
import Sidebar from '../components/LSidebar';
import styled from 'styled-components';

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

const CertificatePage = () => {
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    const fetchCertificates = async () => {
      const querySnapshot = await getDocs(collection(db, 'certificates'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCertificates(data);
    };
    fetchCertificates();
  }, []);

  return (
    <PageContainer>
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>
      <MainContent>
        <Title>Certificates</Title>
        <CertificateGrid>
          {certificates.map(cert => (
            <CertificateCard key={cert.id}>
              <CertificateImage src={cert.imageUrl} alt={cert.title} />
              <CertificateTitle>{cert.title}</CertificateTitle>
            </CertificateCard>
          ))}
        </CertificateGrid>
      </MainContent>
    </PageContainer>
  );
};

export default CertificatePage;
