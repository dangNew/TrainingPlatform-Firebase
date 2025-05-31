import React, { useRef } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeatureSection from '../components/FeatureSection';
import Categories from '../components/Categories';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';

const Landing = () => {
  const heroRef = useRef(null);
  const aboutRef = useRef(null);
  const programsRef = useRef(null);
  const contactRef = useRef(null);

  const scrollToRef = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Navbar
        onHomeClick={() => scrollToRef(heroRef)}
        onAboutClick={() => scrollToRef(aboutRef)}
        onProgramsClick={() => scrollToRef(programsRef)}
        onContactClick={() => scrollToRef(contactRef)}
      />
      <div ref={heroRef}>
        <HeroSection />
      </div>
      <div ref={aboutRef}>
        <FeatureSection />
      </div>
      <div ref={programsRef}>
        <Categories />
      </div>
      <Testimonials />
      <div ref={contactRef}>
        <Footer />
      </div>
    </>
  );
};

export default Landing;
