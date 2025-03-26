import React, { useState } from "react";
import { Document, Page } from "react-pdf";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const PdfSlideshow = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState(null);

  return (
    <div className="pdf-slideshow">
      <Document
        file={pdfUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      >
        <Slider dots={true} infinite={false}>
          {Array.from(new Array(numPages), (_, index) => (
            <div key={index}>
              <Page pageNumber={index + 1} />
            </div>
          ))}
        </Slider>
      </Document>
    </div>
  );
};

export default PdfSlideshow;
