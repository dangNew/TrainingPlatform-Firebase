"use client"

import { useEffect, useState, useContext } from "react"
import { db } from "../firebase.config"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/LSidebar"
import styled from "styled-components"
import { SidebarToggleContext } from "../components/LgNavbar"
import { CalendarIcon, BellIcon, XIcon } from "lucide-react"

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f6f9;
`

const HeaderWrapper = styled.div`
  width: 100%;
  z-index: 10;
`

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
`

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #333;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 20px;
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

const AnnouncementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
`

const AnnouncementCard = styled.div`
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
`

const AnnouncementHeader = styled.div`
  background: linear-gradient(145deg, #3498db, #2980b9);
  color: white;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const AnnouncementTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`

const AnnouncementBadge = styled.span`
  background-color: ${({ type }) => (type === "All" ? "#27ae60" : type === "learner" ? "#f39c12" : "#e74c3c")};
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
`

const AnnouncementContent = styled.div`
  padding: 15px;
  flex-grow: 1;
`

const AnnouncementText = styled.div`
  margin-bottom: 15px;
  color: #555;

  p {
    margin: 0;
  }
`

const AnnouncementFooter = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-top: 1px solid #eee;
  font-size: 13px;
  color: #666;
`

const DateDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`

const NoAnnouncements = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
`

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
`

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
`

const AnnouncementPage = () => {
  const [allAnnouncements, setAllAnnouncements] = useState([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { expanded } = useContext(SidebarToggleContext)
  const navigate = useNavigate()

  // First useEffect: Fetch user role and all announcements
  useEffect(() => {
    const fetchUserAndAnnouncements = async () => {
      try {
        setLoading(true)

        // Get current user ID (assuming you have it stored somewhere)
        // This is a placeholder - replace with your actual auth logic
        const currentUserId = localStorage.getItem("userId") || "defaultUserId"

        // Check if user exists in learner collection
        const learnerDoc = await getDoc(doc(db, "learner", currentUserId))

        // Check if user exists in intern collection
        const internDoc = await getDoc(doc(db, "intern", currentUserId))

        // Set user role based on which collection the user belongs to
        let role = "unknown"
        if (learnerDoc.exists()) {
          role = "learner"
        } else if (internDoc.exists()) {
          role = "intern"
        }

        console.log("User role detected:", role)
        setUserRole(role)

        // Fetch all announcements
        const announcementsSnapshot = await getDocs(collection(db, "announcements"))
        const announcements = announcementsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        console.log("All announcements fetched:", announcements.length)
        setAllAnnouncements(announcements)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndAnnouncements()
  }, []) // Empty dependency array means this runs once on mount

  // Second useEffect: Filter announcements when userRole or allAnnouncements change
  useEffect(() => {
    if (!userRole || allAnnouncements.length === 0) return;

    const currentDate = new Date().toISOString().split("T")[0];
    console.log("Current date for filtering:", currentDate);
    console.log("Filtering announcements for role:", userRole);

    const filtered = allAnnouncements.filter((announcement) => {
      // Check if announcement is still valid (not expired)
      const isValid = announcement.expiryDate >= currentDate;

      // Ensure targetAudience is defined before calling toLowerCase
      const targetAudience = announcement.targetAudience || "";
      const isTargeted = targetAudience.toLowerCase() === "all" ||
                         targetAudience.toLowerCase() === "learner" ||
                         targetAudience.toLowerCase() === userRole.toLowerCase();

      console.log(
        `Announcement "${announcement.subject}" - Valid: ${isValid}, Targeted: ${isTargeted}, Target Audience: ${targetAudience}`,
      );

      return isValid && isTargeted;
    });

    console.log("Filtered announcements:", filtered.length);

    // Sort announcements by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredAnnouncements(filtered);
  }, [userRole, allAnnouncements]);

  // Function to parse HTML content safely
  const createMarkup = (htmlContent) => {
    return { __html: htmlContent }
  }

  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedAnnouncement(null)
  }

  return (
    <PageContainer>
      <HeaderWrapper>{/* Header component can be placed here */}</HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <MainContent expanded={expanded}>
          <Title>Announcements</Title>

          {loading ? (
            <div>Loading announcements...</div>
          ) : filteredAnnouncements.length > 0 ? (
            <AnnouncementGrid>
              {filteredAnnouncements.map((announcement) => (
                <AnnouncementCard key={announcement.id} onClick={() => handleAnnouncementClick(announcement)}>
                  <AnnouncementHeader>
                    <AnnouncementTitle>{announcement.subject}</AnnouncementTitle>
                    <AnnouncementBadge type={announcement.targetAudience}>
                      {announcement.targetAudience}
                    </AnnouncementBadge>
                  </AnnouncementHeader>

                  <AnnouncementContent>
                    <AnnouncementText dangerouslySetInnerHTML={createMarkup(announcement.content)} />
                  </AnnouncementContent>

                  <AnnouncementFooter>
                    <DateDisplay>
                      <CalendarIcon size={14} />
                      Posted: {announcement.date}
                    </DateDisplay>
                    <DateDisplay>
                      <BellIcon size={14} />
                      Expires: {announcement.expiryDate}
                    </DateDisplay>
                  </AnnouncementFooter>
                </AnnouncementCard>
              ))}
            </AnnouncementGrid>
          ) : (
            <NoAnnouncements>
              <BellIcon size={48} strokeWidth={1} className="mx-auto mb-4 text-gray-400" />
              <p>No announcements available at this time.</p>
            </NoAnnouncements>
          )}
        </MainContent>
      </ContentContainer>

      {isModalOpen && selectedAnnouncement && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={closeModal}>
              <XIcon size={20} />
            </CloseButton>
            <AnnouncementHeader>
              <AnnouncementTitle>{selectedAnnouncement.subject}</AnnouncementTitle>
              <AnnouncementBadge type={selectedAnnouncement.targetAudience}>
                {selectedAnnouncement.targetAudience}
              </AnnouncementBadge>
            </AnnouncementHeader>
            <AnnouncementContent>
              <AnnouncementText dangerouslySetInnerHTML={createMarkup(selectedAnnouncement.content)} />
            </AnnouncementContent>
            <AnnouncementFooter>
              <DateDisplay>
                <CalendarIcon size={14} />
                Posted: {selectedAnnouncement.date}
              </DateDisplay>
              <DateDisplay>
                <BellIcon size={14} />
                Expires: {selectedAnnouncement.expiryDate}
              </DateDisplay>
            </AnnouncementFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  )
}

export default AnnouncementPage
