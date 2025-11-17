import React, { useRef } from 'react';
import dog1 from '../assets/DOG1.png';
import dog2 from '../assets/DOG2.png';
import aboutUsImage from '../assets/home_aboutus.jpg';
import dog3 from '../assets/DOG3.png';
import shop1 from '../assets/home_shop.png';
import services1 from '../assets/home_services.png';
import DecorativeBackground from '../components/DecorativeBackground';

export default function LandingPage() {
  const aboutSectionRef = useRef(null);

  const handleScrollToAbout = () => {
    aboutSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <DecorativeBackground variant="default">
      <div className="bg-chonky-white min-h-screen">
        {/* Hero Section - Full Width */}
        <section className="bg-chonky-brown pt-16 pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left Side: Title and Tagline */}
              <div className="text-left">
                <h1 className="hero-title mb-4">
                  Chonky Boi Pet Store and Grooming Salon
                </h1>
                <p className="text-body-lg text-accent-cream leading-relaxed mb-6">
                  Your FURiendly neighborhood Pet Store and Grooming Salon!
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="/products" 
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-3xl bg-secondary text-chonky-white hover:bg-btn-yellow hover:text-chonky-brown transition-colors duration-200 shadow-lg"
                  >
                    Shop Products
                  </a>
                  <a 
                    href="/services" 
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-3xl bg-secondary text-chonky-white hover:bg-btn-yellow hover:text-chonky-brown transition-colors duration-200 shadow-lg"
                  >
                    Explore Services
                  </a>
                </div>
              </div>
              
              {/* Center: Dog Image */}
              <div className="flex justify-center items-center">
                <img 
                  src={dog1} 
                  alt="Happy Golden Retriever" 
                  className="max-w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-chonky-khaki">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-chonky-white shadow-md">
            <div className="py-12">
              {/* Featured Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Home Card */}
                <div>
                  <h3 className="text-chonky-brown font-heading font-extrabold text-3xl mb-4 text-center">Home</h3>
                  <article className="bg-chonky-white rounded-t-3xl rounded-b-xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-200">
                    <div className="bg-chonky-brown h-48 overflow-hidden">
                      <img src={dog2} alt="Home" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 bg-chonky-white">
                      <p className="text-body text-chonky-brown mb-4 text-center">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      </p>
                      <div className="flex justify-center">
                        <a 
                          href="/home" 
                          className="inline-block px-6 py-3 bg-chonky-brown hover:bg-chonky-poop text-chonky-white font-bold rounded-3xl transition-colors duration-200 border-chonky-brown"
                        >
                          Back to Top
                        </a>
                      </div>
                    </div>
                  </article>
                </div>

                {/* Shop Card */}
                <div>
                  <h3 className="text-chonky-brown font-heading font-extrabold text-3xl mb-4 text-center">Shop</h3>
                  <article className="bg-chonky-white rounded-t-3xl rounded-b-xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-200">
                    <div className="bg-accent-peach h-48 overflow-hidden">
                      <img src={shop1} alt="Shop" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 bg-chonky-white">
                      <p className="text-body text-chonky-brown mb-4 text-center">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      </p>
                      <div className="flex justify-center">
                        <a 
                          href="/products" 
                          className="inline-block px-6 py-3 bg-accent-peach hover:bg-accent-tan text-chonky-white font-bold rounded-3xl transition-colors duration-200 border-chonky-brown"
                        >
                          Shop Now
                        </a>
                      </div>
                    </div>
                  </article>
                </div>

                {/* Services Card */}
                <div>
                  <h3 className="text-chonky-brown font-heading font-extrabold text-3xl mb-4 text-center">Services</h3>
                  <article className="bg-chonky-white rounded-t-3xl rounded-b-xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-200">
                    <div className="bg-btn-yellow h-48 overflow-hidden">
                      <img src={services1} alt="Services" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 bg-chonky-white">
                      <p className="text-body text-chonky-brown mb-4 text-center">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      </p>
                      <div className="flex justify-center">
                        <a 
                          href="/services" 
                          className="inline-block px-6 py-3 bg-nav-orange hover:bg-chonky-poop text-chonky-white font-bold rounded-3xl transition-colors duration-200 border-chonky-brown"
                        >
                          View Deals
                        </a>
                      </div>
                    </div>
                  </article>
                </div>

                {/* About Us Card */}
                <div>
                  <h3 className="text-chonky-brown font-heading font-extrabold text-3xl mb-4 text-center">About Us</h3>
                  <article className="bg-chonky-white rounded-t-3xl rounded-b-xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-200">
                    <div className="bg-chonky-poop h-48 overflow-hidden">
                      <img src={dog3} alt="About Us" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 bg-chonky-white">
                      <p className="text-body text-chonky-brown mb-4 text-center">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      </p>
                      <div className="flex justify-center">
                        <button 
                          onClick={handleScrollToAbout}
                          className="inline-block px-6 py-3 bg-chonky-poop hover:bg-chonky-brown text-chonky-white font-bold rounded-3xl transition-colors duration-200 border-chonky-brown"
                        >
                          Learn More
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              </div>

              {/* Why Choose Us Section with Divider */}
              <div ref={aboutSectionRef} className="mt-24 pt-16 border-t-4 border-chonky-khaki">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Left: Image */}
                  <div className="flex justify-center">
                    <img 
                      src={aboutUsImage} 
                      alt="Happy pet owner with dog" 
                      className="rounded-3xl shadow-2xl object-cover w-full h-full max-h-[500px]"
                    />
                  </div>

                  {/* Right: Content */}
                  <div>
                    <h2 className="display-md text-chonky-brown mb-8">
                      Why Choose Chonky Boi?
                    </h2>
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 bg-secondary text-chonky-white rounded-full p-3 shadow-md">🏆</div>
                        <div>
                          <h3 className="heading-card text-chonky-brown mb-1">Premium Quality</h3>
                          <p className="text-body text-chonky-poop">Hand-picked products from trusted brands that prioritize your pet's health and happiness.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 bg-secondary text-chonky-white rounded-full p-3 shadow-md">🚚</div>
                        <div>
                          <h3 className="heading-card text-chonky-brown mb-1">Fast Delivery & Pickup</h3>
                          <p className="text-body text-chonky-poop">Quick and reliable shipping to your doorstep, or convenient in-store pickup at our branches.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 bg-secondary text-chonky-white rounded-full p-3 shadow-md">💚</div>
                        <div>
                          <h3 className="heading-card text-chonky-brown mb-1">Expert Support</h3>
                          <p className="text-body text-chonky-poop">Our pet care specialists are here to help you choose the best products and services for your furry friends.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DecorativeBackground>
  );
}
