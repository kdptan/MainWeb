import React from 'react';
import dog1 from '../assets/DOG1.png';
import dog2 from '../assets/DOG2.png';
import dog3 from '../assets/DOG3.png';
import shop1 from '../assets/home_shop.png';
import services1 from '../assets/home_services.png';
import DecorativeBackground from '../components/DecorativeBackground';

export default function LandingPage() {
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

        {/* Featured Categories */}
        <section className="py-12 bg-chonky-khaki">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    <a 
                      href="/about" 
                      className="inline-block px-6 py-3 bg-chonky-poop hover:bg-chonky-brown text-chonky-white font-bold rounded-3xl transition-colors duration-200 border-chonky-brown"
                    >
                      Learn More
                    </a>
                  </div>
                </div>
              </article>
            </div>
          </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-12 bg-chonky-khaki">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="display-md text-accent-cream text-center mb-10">
            Why Choose ChonkyWeb?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8">
            <div className="text-center p-6 bg-primary rounded-lg shadow-lg border-2 border-accent-brown">
              <div className="text-5xl mb-4">🏆</div>
              <h3 className="heading-card text-accent-cream mb-2">Premium Quality</h3>
              <p className="text-body text-accent-cream">
                Hand-picked products from trusted brands that prioritize your pet's health and happiness.
              </p>
            </div>
            <div className="text-center p-6 bg-primary rounded-lg shadow-lg border-2 border-accent-brown">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="heading-card text-accent-cream mb-2">Fast Delivery</h3>
              <p className="text-body text-accent-cream">
                Quick and reliable shipping to get your pet supplies delivered right to your doorstep.
              </p>
            </div>
            <div className="text-center p-6 bg-primary rounded-lg shadow-lg border-2 border-accent-brown">
              <div className="text-5xl mb-4">💚</div>
              <h3 className="heading-card text-accent-cream mb-2">Expert Support</h3>
              <p className="text-body text-accent-cream">
                Our pet care specialists are here to help you choose the best products for your pets.
              </p>
            </div>
          </div>
          </div>
        </section>
      </div>
    </DecorativeBackground>
  );
}
