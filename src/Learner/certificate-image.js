"use client"

import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useRef } from "react"
import { FaAward, FaStamp } from "react-icons/fa"

const CertificateImage = ({ userName, courseTitle, moduleTitle, issueDate, certificateId, courseDescription }) => {
  const certificateRef = useRef(null)

  const downloadAsPDF = async () => {
    if (!certificateRef.current) return

    try {
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
      pdf.save(`${userName.replace(/\s+/g, "_")}_${courseTitle.replace(/\s+/g, "_")}_Certificate.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div ref={certificateRef} className="w-[800px] h-[600px] bg-white p-8 shadow-xl border border-gray-200 relative">
        {/* Decorative Border */}
        <div className="absolute inset-0 border-[12px] border-double border-blue-900 m-4 pointer-events-none"></div>

        {/* Decorative Corner Elements */}
        <div className="absolute top-6 left-6 w-20 h-20 border-t-4 border-l-4 border-gold-500 border-blue-900"></div>
        <div className="absolute top-6 right-6 w-20 h-20 border-t-4 border-r-4 border-gold-500 border-blue-900"></div>
        <div className="absolute bottom-6 left-6 w-20 h-20 border-b-4 border-l-4 border-gold-500 border-blue-900"></div>
        <div className="absolute bottom-6 right-6 w-20 h-20 border-b-4 border-r-4 border-gold-500 border-blue-900"></div>

        {/* Decorative Background */}
        <div className="absolute inset-0 m-8 bg-gradient-to-br from-blue-50 to-white opacity-50 pointer-events-none"></div>

        {/* Certificate Content */}
        <div className="relative h-full flex flex-col items-center justify-between py-10 px-12 text-center">
          {/* Header */}
          <div>
            <div className="text-blue-900 text-4xl font-bold mb-2 font-serif">Certificate of Completion</div>
            <div className="w-60 h-1 bg-gradient-to-r from-transparent via-blue-900 to-transparent mx-auto mb-6"></div>
            <div className="text-gray-500 text-lg mb-2">This certifies that</div>
            <div className="text-blue-900 text-4xl font-bold mb-4 font-serif">{userName}</div>
          </div>

          {/* Middle Content */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-gray-700 text-lg mb-2">has successfully completed</div>
            <div className="text-blue-900 text-2xl font-semibold mb-4">{courseTitle}</div>

            {courseDescription && (
              <div className="text-gray-600 text-sm max-w-md mb-4 italic">
                "{courseDescription.substring(0, 120)}
                {courseDescription.length > 120 ? "..." : ""}"
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="w-full">
            <div className="flex justify-between items-end">
              <div className="text-left">
                <div className="text-gray-500 text-sm">Issued on</div>
                <div className="text-blue-900 font-semibold">{issueDate}</div>
                <div className="text-gray-500 text-sm mt-2">Certificate ID</div>
                <div className="text-blue-900 font-mono text-sm">{certificateId}</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-20 h-20 flex items-center justify-center">
                  <FaStamp className="text-blue-900 text-4xl opacity-80" />
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
        <div className="absolute top-20 right-20">
          <FaAward className="text-blue-900 opacity-10 text-6xl" />
        </div>
      </div>

      <button
        onClick={downloadAsPDF}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        Download Certificate
      </button>
    </div>
  )
}

// Helper function to generate and download certificate as PDF
export const generateCertificatePDF = async (certificateData) => {
  // Create a temporary div to render the certificate
  const certificateContainer = document.createElement("div")
  certificateContainer.style.position = "absolute"
  certificateContainer.style.left = "-9999px"
  document.body.appendChild(certificateContainer)

  // Create a React root and render the certificate
  const root = document.createElement("div")
  certificateContainer.appendChild(root)

  // We would normally use ReactDOM.render here, but for simplicity we'll just set innerHTML
  // with a simplified version of the certificate
  root.innerHTML = `
    <div id="certificate" style="width:800px;height:600px;background:white;padding:32px;">
      <div style="border:8px solid #1e3a8a;height:100%;width:100%;padding:32px;border-radius:8px;background:linear-gradient(to bottom right, #eff6ff, #ffffff);">
        <div style="text-align:center;">
          <div style="color:#1e3a8a;font-size:28px;font-weight:bold;margin-bottom:8px;">Certificate of Completion</div>
          <div style="color:#6b7280;font-size:16px;margin-bottom:24px;">This certifies that</div>
          
          <div style="color:#1e3a8a;font-size:32px;font-weight:bold;margin-bottom:24px;">${certificateData.userName}</div>
          
          <div style="color:#4b5563;margin-bottom:8px;">has successfully completed</div>
          <div style="color:#1e3a8a;font-size:20px;font-weight:600;margin-bottom:24px;">${certificateData.courseTitle}</div>
          
          <div style="color:#6b7280;font-size:14px;">
            Issued on ${certificateData.issueDate}
          </div>
          <div style="color:#6b7280;font-size:14px;">
            Certificate ID: ${certificateData.certificateId}
          </div>
          <div style="color:#6b7280;font-size:14px;margin-top:16px;">
            Issued by: WealthFinancials
          </div>
          <div style="color:#1e3a8a;font-size:16px;font-style:italic;margin-top:8px;">
            Miss Lily Beth, Authorized Representative
          </div>
        </div>
      </div>
    </div>
  `

  try {
    // Use html2canvas to capture the certificate as an image
    const canvas = await html2canvas(document.getElementById("certificate"), {
      scale: 2,
      useCORS: true,
      logging: false,
    })

    // Create a PDF from the canvas
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

    // Clean up the temporary elements
    document.body.removeChild(certificateContainer)

    // Return the PDF as a blob
    return pdf.output("blob")
  } catch (error) {
    console.error("Error generating certificate PDF:", error)
    document.body.removeChild(certificateContainer)
    throw error
  }
}

export default CertificateImage

