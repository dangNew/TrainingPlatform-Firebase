import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import PropTypes from "prop-types"

const CertificateTemplate = ({ userName, courseTitle, moduleTitle, issueDate, certificateId }) => {
  return (
    <div id="certificate" className="w-[800px] h-[600px] bg-white p-8">
      <div className="border-8 border-blue-900 h-full w-full p-8 rounded-lg bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="text-blue-900 text-3xl font-bold mb-2">Certificate of Completion</div>
          <div className="text-gray-500 text-sm mb-6">This certifies that</div>

          <div className="text-blue-900 text-4xl font-bold mb-6">{userName}</div>

          <div className="text-gray-700 mb-2">has successfully completed</div>
          <div className="text-blue-900 text-2xl font-semibold mb-6">{courseTitle}</div>

          <div className="text-gray-500 text-sm">Issued on {issueDate}</div>
          <div className="text-gray-500 text-sm">Certificate ID: {certificateId}</div>
        </div>
      </div>
    </div>
  )
}

CertificateTemplate.propTypes = {
  userName: PropTypes.string.isRequired,
  courseTitle: PropTypes.string.isRequired,
  moduleTitle: PropTypes.string.isRequired,
  issueDate: PropTypes.string.isRequired,
  certificateId: PropTypes.string.isRequired,
}

export const generateCertificatePDF = async (certificateData) => {
  // Create a temporary div to render the certificate
  const certificateContainer = document.createElement("div")
  certificateContainer.style.position = "absolute"
  certificateContainer.style.left = "-9999px"
  document.body.appendChild(certificateContainer)

  // Render the certificate component to the temporary div
  const root = document.createElement("div")
  certificateContainer.appendChild(root)

  // We would normally use ReactDOM.render here, but for simplicity we'll just set innerHTML
  root.innerHTML = `
    <div id="certificate" style="width:800px;height:600px;background:white;padding:32px;">
      <div style="border:8px solid #1e3a8a;height:100%;width:100%;padding:32px;border-radius:8px;background:linear-gradient(to bottom right, #eff6ff, #ffffff);">
        <div style="text-align:center;">
          <div style="color:#1e3a8a;font-size:24px;font-weight:bold;margin-bottom:8px;">Certificate of Completion</div>
          <div style="color:#6b7280;font-size:14px;margin-bottom:24px;">This certifies that</div>
          
          <div style="color:#1e3a8a;font-size:32px;font-weight:bold;margin-bottom:24px;">${certificateData.userName}</div>
          
          <div style="color:#4b5563;margin-bottom:8px;">has successfully completed</div>
          <div style="color:#1e3a8a;font-size:24px;font-weight:bold;margin-bottom:8px;">${certificateData.moduleTitle}</div>
          <div style="color:#4b5563;margin-bottom:24px;">from the course</div>
          <div style="color:#1e3a8a;font-size:20px;font-weight:600;margin-bottom:24px;">${certificateData.courseTitle}</div>
          
          <div style="color:#6b7280;font-size:14px;">
            Issued on ${certificateData.issueDate}
          </div>
          <div style="color:#6b7280;font-size:14px;">
            Certificate ID: ${certificateData.certificateId}
          </div>
        </div>
      </div>
    </div>
  `

  // Use html2canvas to capture the certificate as an image
  const canvas = await html2canvas(document.getElementById("certificate"))

  // Create a PDF from the canvas
  const imgData = canvas.toDataURL("image/png")
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [canvas.width, canvas.height],
  })

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)

  // Clean up the temporary elements
  document.body.removeChild(certificateContainer)

  // Return the PDF as a blob
  return pdf.output("blob")
}

export default CertificateTemplate

