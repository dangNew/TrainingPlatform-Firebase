import { Workflow } from 'lucide-react';
import FeatureSection from '../components/FeatureSection';
import HeroSection from '../components/HeroSection';
import Categories from '../components/Categories';
import Navbar from '../components/Navbar';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';

const Landing = () => {
  const gradientStyle = {
    background: '#e2e0e0',
    color: 'white',
    minHeight: '100vh',
    position: 'relative',
  };

  return (
    <div style={gradientStyle}>
      <Navbar />
      <div className="max-w-7xl mx-auto pt-20 px-6">
        <HeroSection />
        <FeatureSection />
        <Categories />
        <Testimonials />
        <Footer />
      </div>
    </div>
  );
};

export default Landing;
