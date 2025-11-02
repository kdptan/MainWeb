import React from 'react';
import dog from '../assets/dog.svg';
import cat from '../assets/cat.svg';
import parrot from '../assets/parrot.svg';

export default function LandingPage() {
  return (
    <div className="bg-primary-darker min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="py-16 text-center bg-primary-dark rounded-xl shadow-2xl my-8 border-2 border-primary">
          <h1 className="text-5xl font-extrabold text-accent-cream mb-4">
            Welcome to ChonkyWeb Petstore
          </h1>
          <p className="mt-4 text-xl text-accent-cream max-w-3xl mx-auto leading-relaxed">
            Your trusted partner for premium pet supplies. Find toys, food, grooming essentials, 
            and everything your furry, feathered, or scaly friends need to thrive.
          </p>
          <div className="mt-10 flex justify-center gap-4 flex-wrap">
            <a 
              href="/products" 
              className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-lg text-primary-darker bg-secondary-lighter hover:bg-secondary-light transition-colors duration-200 shadow-lg"
            >
              Shop Products
            </a>
            <a 
              href="/services" 
              className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-lg text-accent-cream bg-secondary hover:bg-primary-dark border-2 border-secondary-light transition-colors duration-200 shadow-lg"
            >
              Explore Services
            </a>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="py-12">
          <h2 className="text-4xl font-bold text-accent-cream text-center mb-10">
            Featured Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {/* Dog Supplies Card */}
            <article className="bg-primary-dark rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-200 border-2 border-primary">
              <div className="bg-accent-brown p-6">
                <img src={dog} alt="Dog Supplies" className="w-full h-48 object-contain filter drop-shadow-lg" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-accent-cream mb-3">Dog Supplies</h3>
                <p className="text-accent-cream mb-6">
                  Premium food, durable toys, grooming tools, and comfortable accessories for dogs of all breeds and sizes.
                </p>
                <a 
                  href="/products?category=dog" 
                  className="inline-block px-6 py-3 bg-secondary hover:bg-secondary-light text-accent-cream font-medium rounded-lg transition-colors duration-200 shadow-md"
                >
                  Explore Dog Items
                </a>
              </div>
            </article>

            {/* Cat Corner Card */}
            <article className="bg-primary-dark rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-200 border-2 border-primary">
              <div className="bg-accent-peach p-6">
                <img src={cat} alt="Cat Corner" className="w-full h-48 object-contain filter drop-shadow-lg" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-accent-cream mb-3">Cat Corner</h3>
                <p className="text-accent-cream mb-6">
                  Comfort items, interactive toys, scratching posts, and nutritious treats curated for your feline companions.
                </p>
                <a 
                  href="/products?category=cat" 
                  className="inline-block px-6 py-3 bg-secondary hover:bg-secondary-light text-accent-cream font-medium rounded-lg transition-colors duration-200 shadow-md"
                >
                  Explore Cat Items
                </a>
              </div>
            </article>

            {/* Bird Care Card */}
            <article className="bg-primary-dark rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-200 border-2 border-primary">
              <div className="bg-secondary-light p-6">
                <img src={parrot} alt="Bird Care" className="w-full h-48 object-contain filter drop-shadow-lg" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-accent-cream mb-3">Bird Care</h3>
                <p className="text-accent-cream mb-6">
                  Nutritional seeds, engaging toys, comfortable perches, and cage accessories for parrots, canaries, and more.
                </p>
                <a 
                  href="/products?category=bird" 
                  className="inline-block px-6 py-3 bg-secondary hover:bg-secondary-light text-accent-cream font-medium rounded-lg transition-colors duration-200 shadow-md"
                >
                  Explore Bird Items
                </a>
              </div>
            </article>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-12 bg-primary-dark rounded-xl shadow-2xl my-8 border-2 border-primary">
          <h2 className="text-4xl font-bold text-accent-cream text-center mb-10">
            Why Choose ChonkyWeb?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8">
            <div className="text-center p-6 bg-primary rounded-lg shadow-lg border-2 border-accent-brown">
              <div className="text-5xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-accent-cream mb-2">Premium Quality</h3>
              <p className="text-accent-cream">
                Hand-picked products from trusted brands that prioritize your pet's health and happiness.
              </p>
            </div>
            <div className="text-center p-6 bg-primary rounded-lg shadow-lg border-2 border-accent-brown">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold text-accent-cream mb-2">Fast Delivery</h3>
              <p className="text-accent-cream">
                Quick and reliable shipping to get your pet supplies delivered right to your doorstep.
              </p>
            </div>
            <div className="text-center p-6 bg-primary rounded-lg shadow-lg border-2 border-accent-brown">
              <div className="text-5xl mb-4">💚</div>
              <h3 className="text-xl font-semibold text-accent-cream mb-2">Expert Support</h3>
              <p className="text-accent-cream">
                Our pet care specialists are here to help you choose the best products for your pets.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
