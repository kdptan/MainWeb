import React from 'react';
import dog from '../assets/dog.svg';
import cat from '../assets/cat.svg';
import parrot from '../assets/parrot.svg';

export default function LandingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <section className="py-12 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Welcome to the Petstore</h2>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Find toys, food, and supplies for dogs, cats, birds and more. New customers always start here.</p>
        <div className="mt-8 flex justify-center">
          <a href="/products" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Shop products</a>
        </div>
      </section>

      <section className="py-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Featured</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <article className="bg-white shadow rounded-lg overflow-hidden">
            <img src={dog} alt="Dog placeholder" className="w-full h-40 object-cover" />
            <div className="p-4">
              <h4 className="font-medium text-gray-800">Dog Supplies</h4>
              <p className="mt-2 text-sm text-gray-600">Food, toys, and grooming essentials for dogs of all sizes.</p>
            </div>
          </article>

          <article className="bg-white shadow rounded-lg overflow-hidden">
            <img src={cat} alt="Cat placeholder" className="w-full h-40 object-cover" />
            <div className="p-4">
              <h4 className="font-medium text-gray-800">Cat Corner</h4>
              <p className="mt-2 text-sm text-gray-600">Comfort and play items curated for feline friends.</p>
            </div>
          </article>

          <article className="bg-white shadow rounded-lg overflow-hidden">
            <img src={parrot} alt="Parrot placeholder" className="w-full h-40 object-cover" />
            <div className="p-4">
              <h4 className="font-medium text-gray-800">Bird Care</h4>
              <p className="mt-2 text-sm text-gray-600">Nutritional food and toys for birds and parrots.</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
