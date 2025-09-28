import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Donate() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-wingman-pink to-wingman-orange px-6 py-8 text-white text-center">
          <Heart className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Support Wing Week Portland</h1>
          <p className="text-white text-opacity-90">
            Help us keep this community resource free and accessible to everyone
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Impact Statement */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Impact</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• $1 makes me smile</p>
              <p>• $5 helps cover bandwidth costs</p>
              <p>• $10 let's me eat wings. Hell yeah.</p>
            </div>
          </div>

          <div className="p-6 flex flex-col items-center">
            <img src="./venmo.png" alt="Venmo profile" className="mx-auto mb-4 w-50 h-50" />
            <Link
              to="https://venmo.com/u/Cameron-Hermens-1"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-md text-sm font-medium bg-wingman-pink text-white"
            >
              Donate via Venmo
            </Link>
          </div>

          {/* Thank You Message */}
          <div className="text-center">
            <p className="text-gray-600">
              Thank you for supporting the Portland wing community! 🍗❤️
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}