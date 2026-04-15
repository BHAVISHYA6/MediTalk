import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { canUseMessaging, getDefaultRouteForRole } from '../utils/navigation.js';

const Home = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dashboardPath = getDefaultRouteForRole(user?.role);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <div className="text-center mb-20">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Your Health, <span className="text-orange-500">Our Priority</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Connect with verified healthcare professionals for trusted digital consultations
          </p>

          {!isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 border-2 border-orange-500 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors duration-200"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <div className="text-center p-8 bg-orange-50 rounded-lg inline-block min-w-[320px]">
              <p className="text-lg text-gray-700">
                Welcome back, <span className="font-semibold text-orange-600">{user?.name}</span>
              </p>
              <p className="text-gray-600 mt-2">
                Role: <span className="font-semibold capitalize text-orange-600">{user?.role}</span>
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to={dashboardPath}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  Go To Dashboard
                </Link>
                {canUseMessaging(user?.role) && (
                  <Link
                    to="/messages"
                    className="px-5 py-2 border border-orange-500 text-orange-600 font-semibold rounded-lg hover:bg-orange-100 transition-colors duration-200"
                  >
                    Open Messages
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-orange-50 p-8 rounded-lg border border-orange-100 hover:border-orange-300 transition-colors">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4 text-2xl">
              👨‍⚕️
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">For Doctors</h3>
            <p className="text-gray-600 leading-relaxed">
              Get verified and connect with patients looking for professional healthcare consultation
            </p>
          </div>

          <div className="bg-orange-50 p-8 rounded-lg border border-orange-100 hover:border-orange-300 transition-colors">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4 text-2xl">
              👤
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">For Patients</h3>
            <p className="text-gray-600 leading-relaxed">
              Find trusted doctors and get timely healthcare advice from verified professionals
            </p>
          </div>

          <div className="bg-orange-50 p-8 rounded-lg border border-orange-100 hover:border-orange-300 transition-colors">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4 text-2xl">
              🔒
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">For Admins</h3>
            <p className="text-gray-600 leading-relaxed">
              Manage platform users and verify healthcare professionals efficiently
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-6 mt-20 py-12 border-t border-b border-gray-200">
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-bold text-orange-500 mb-2">500+</p>
            <p className="text-gray-600">Verified Doctors</p>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-bold text-orange-500 mb-2">10K+</p>
            <p className="text-gray-600">Happy Patients</p>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-bold text-orange-500 mb-2">24/7</p>
            <p className="text-gray-600">Support Available</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
