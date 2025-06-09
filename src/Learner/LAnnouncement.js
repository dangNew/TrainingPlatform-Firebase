import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase.config";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/LSidebar";
import styled, { keyframes } from "styled-components";
import { SidebarToggleContext } from "../components/LgNavbar";
import {
  Bell,
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  Info,
  X,
} from "lucide-react";

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled Components
const PageContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f4f6f9;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
`;

const SidebarWrapper = styled.div`
  height: 100%;
  z-index: 5;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  border-radius: 8px;
  overflow-y: auto;
  transition: margin-left 0.3s ease;
  margin-left: ${({ expanded }) => (expanded ? "16rem" : "4rem")};
  width: ${({ expanded }) => (expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)")};
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
  background: linear-gradient(to right, #0ea5e9, #4f46e5); /* sky-500 to indigo-600 */
  color: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
`;

const ActionBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchBar = styled.div`
  flex: 1;
  min-width: 250px;
  position: relative;
`;

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
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
`;

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
`;

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
`;

const AnnouncementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const AnnouncementCard = styled.div`
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, #3b82f6, #2563eb);
    border-radius: 0 2px 2px 0;
  }
`;

const AnnouncementHeader = styled.div`
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f3f4f6;
`;

const AnnouncementTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  padding-right: 1rem;
  line-height: 1.4;
`;

const AnnouncementBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background-color: ${({ type }) =>
    type === "All"
      ? "rgba(16, 185, 129, 0.1)"
      : type === "learner"
      ? "rgba(245, 158, 11, 0.1)"
      : "rgba(239, 68, 68, 0.1)"};
  color: ${({ type }) => (type === "All" ? "#10b981" : type === "learner" ? "#f59e0b" : "#ef4444")};
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const AnnouncementContent = styled.div`
  padding: 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const AnnouncementText = styled.div`
  color: #4b5563;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  margin-bottom: 1rem;

  p {
    margin: 0 0 0.75rem 0;

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const AnnouncementFooter = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background-color: #f9fafb;
  border-top: 1px solid #f3f4f6;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: auto;
`;

const DateDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const ReadMoreLink = styled.div`
  display: inline-flex;
  align-items: center;
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: auto;

  svg {
    transition: transform 0.2s;
  }

  &:hover svg {
    transform: translateX(2px);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  animation: ${fadeIn} 0.5s ease-out;
`;

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
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const EmptyStateText = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
`;

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
`;

const LoadingText = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  position: relative;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  padding-right: 2rem;
`;

const ModalCloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  transition: all 0.2s;

  &:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  color: #4b5563;
  font-size: 0.875rem;
  line-height: 1.6;

  p {
    margin: 0 0 1rem 0;

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background-color: #f9fafb;
  border-top: 1px solid #f3f4f6;
`;

const InfoCard = styled.div`
  background-color: rgba(59, 130, 246, 0.05);
  border-left: 4px solid #3b82f6;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
`;

const InfoIcon = styled.div`
  color: #3b82f6;
  margin-right: 0.75rem;
  margin-top: 0.125rem;
  flex-shrink: 0;
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: #4b5563;
  margin: 0;
  line-height: 1.5;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background-color: ${({ active }) => (active ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)")};
  color: ${({ active }) => (active ? "#10b981" : "#ef4444")};
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  margin-left: 1rem;
`;

const AnnouncementPage = () => {
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { expanded } = useContext(SidebarToggleContext);
  const navigate = useNavigate();
  const { announcementId } = useParams();

  useEffect(() => {
    const fetchUserAndAnnouncements = async () => {
      try {
        setLoading(true);

        const currentUserId = localStorage.getItem("userId") || "defaultUserId";

        const learnerDoc = await getDoc(doc(db, "learner", currentUserId));
        const internDoc = await getDoc(doc(db, "intern", currentUserId));

        let role = "unknown";
        if (learnerDoc.exists()) {
          role = "learner";
        } else if (internDoc.exists()) {
          role = "intern";
        }

        setUserRole(role);

        const announcementsSnapshot = await getDocs(collection(db, "announcements"));
        const announcements = announcementsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAllAnnouncements(announcements);

        if (announcementId) {
          const selectedAnnouncement = announcements.find((announcement) => announcement.id === announcementId);
          if (selectedAnnouncement) {
            setSelectedAnnouncement(selectedAnnouncement);
            setIsModalOpen(true);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndAnnouncements();
  }, [announcementId]);

  useEffect(() => {
    if (!userRole || allAnnouncements.length === 0) return;

    const currentDate = new Date().toISOString().split("T")[0];

    const filtered = allAnnouncements.filter((announcement) => {
      const isValid = announcement.expiryDate >= currentDate;
      const targetAudience = announcement.targetAudience || "";
      const isTargeted =
        targetAudience.toLowerCase() === "all" ||
        targetAudience.toLowerCase() === "learner" ||
        targetAudience.toLowerCase() === userRole.toLowerCase();

      return isValid && isTargeted;
    });

    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredAnnouncements(filtered);
  }, [userRole, allAnnouncements]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      return;
    }

    const searchFiltered = filteredAnnouncements.filter(
      (announcement) =>
        announcement.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (announcement.content && announcement.content.toLowerCase().includes(searchTerm.toLowerCase())),
    );

    setFilteredAnnouncements(searchFiltered);
  }, [searchTerm]);

  const createMarkup = (htmlContent) => {
    return { __html: htmlContent };
  };

  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const refreshAnnouncements = async () => {
    try {
      setLoading(true);

      const announcementsSnapshot = await getDocs(collection(db, "announcements"));
      const announcements = announcementsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAllAnnouncements(announcements);
      setSearchTerm("");
    } catch (error) {
      console.error("Error refreshing announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const isAnnouncementActive = (expiryDate) => {
    const currentDate = new Date().toISOString().split("T")[0];
    return expiryDate >= currentDate;
  };

  return (
    <PageContainer>
      <ContentContainer>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <MainContent expanded={expanded}>
          <PageHeader>
            <HeaderContent>
              <Title>
                <Bell /> Announcements
                <StatusBadge active={true}>
                  <CheckCircle size={12} /> {filteredAnnouncements.length} Active
                </StatusBadge>
              </Title>
              <Subtitle>Stay updated with the latest news and information</Subtitle>
            </HeaderContent>
          </PageHeader>

          <InfoCard>
            <InfoIcon>
              <Info size={18} />
            </InfoIcon>
            <InfoText>
              Announcements are filtered based on your role and expiration dates. You'll only see announcements that are
              relevant to you and still active.
            </InfoText>
          </InfoCard>

          <ActionBar>
            <SearchBar>
              <SearchIcon>
                <Search size={18} />
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchBar>

            <FilterButton>
              <Filter size={16} />
              Filter
            </FilterButton>

            <RefreshButton onClick={refreshAnnouncements} disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh"}
            </RefreshButton>
          </ActionBar>

          {loading ? (
            <LoadingContainer>
              <LoadingSpinner />
              <LoadingText>Loading announcements...</LoadingText>
            </LoadingContainer>
          ) : filteredAnnouncements.length > 0 ? (
            <AnnouncementGrid>
              {filteredAnnouncements.map((announcement) => (
                <AnnouncementCard key={announcement.id} onClick={() => handleAnnouncementClick(announcement)}>
                  <AnnouncementHeader>
                    <AnnouncementTitle>{announcement.subject}</AnnouncementTitle>
                    <AnnouncementBadge type={announcement.targetAudience}>
                      <Users size={12} />
                      {announcement.targetAudience}
                    </AnnouncementBadge>
                  </AnnouncementHeader>

                  <AnnouncementContent>
                    <AnnouncementText dangerouslySetInnerHTML={createMarkup(announcement.content)} />
                    <ReadMoreLink>
                      Read more <ChevronRight size={16} />
                    </ReadMoreLink>
                  </AnnouncementContent>

                  <AnnouncementFooter>
                    <DateDisplay>
                      <Calendar size={14} />
                      Posted: {announcement.date}
                    </DateDisplay>
                    <DateDisplay>
                      <Clock size={14} />
                      Expires: {announcement.expiryDate}
                    </DateDisplay>
                  </AnnouncementFooter>
                </AnnouncementCard>
              ))}
            </AnnouncementGrid>
          ) : (
            <EmptyState>
              <EmptyStateIcon>
                <Bell size={32} />
              </EmptyStateIcon>
              <EmptyStateTitle>No announcements available</EmptyStateTitle>
              <EmptyStateText>
                There are no active announcements for you at this time. Check back later for updates.
              </EmptyStateText>
            </EmptyState>
          )}

          {isModalOpen && selectedAnnouncement && (
            <ModalOverlay onClick={closeModal}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                  <ModalTitle>{selectedAnnouncement.subject}</ModalTitle>
                  <AnnouncementBadge type={selectedAnnouncement.targetAudience}>
                    <Users size={12} />
                    {selectedAnnouncement.targetAudience}
                  </AnnouncementBadge>
                  <ModalCloseButton onClick={closeModal}>
                    <X size={20} />
                  </ModalCloseButton>
                </ModalHeader>
                <ModalBody dangerouslySetInnerHTML={createMarkup(selectedAnnouncement.content)} />
                <ModalFooter>
                  <DateDisplay>
                    <Calendar size={14} />
                    Posted: {selectedAnnouncement.date}
                  </DateDisplay>
                  <DateDisplay>
                    <Clock size={14} />
                    Expires: {selectedAnnouncement.expiryDate}
                  </DateDisplay>
                </ModalFooter>
              </ModalContent>
            </ModalOverlay>
          )}
        </MainContent>
      </ContentContainer>
    </PageContainer>
  );
};

export default AnnouncementPage;
