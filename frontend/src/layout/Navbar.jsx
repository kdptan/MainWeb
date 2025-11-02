import React from "react";

export default function Navbar() {
	return (
		<nav className="bg-white shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16 items-center">
					{/* Left: Logo */}
					<div className="flex-shrink-0">
						{/* Replace with an <img> if you have a logo file */}
						<a href="/" className="flex items-center space-x-2">
							<div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold">
								L
							</div>
							<span className="font-semibold text-lg text-gray-800">Logo</span>
						</a>
					</div>

					{/* Right: Navigation links */}
					<div className="flex items-center space-x-6">
						<div className="hidden sm:flex space-x-4">
							<a href="#" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Home</a>
							<a href="#" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Services</a>
							<a href="#" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Products</a>
							<a href="#" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Appointment</a>
						</div>

						{/* Sign in button */}
						<div>
							<a href="/signin" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Sign in</a>
						</div>
					</div>
				</div>
			</div>
		</nav>
	);
}

