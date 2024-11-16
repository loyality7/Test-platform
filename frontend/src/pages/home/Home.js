import React from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import HeroSection from '../../components/layout/hero';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <HeroSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
