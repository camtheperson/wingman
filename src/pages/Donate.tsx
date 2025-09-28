import { useState } from 'react';
import { Heart, CreditCard, Smartphone } from 'lucide-react';

export default function Donate() {
  const [amount, setAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const presetAmounts = [10, 25, 50, 100];

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setIsCustom(true);
    if (value && !isNaN(Number(value))) {
      setAmount(Number(value));
    }
  };

  const handleDonate = async (paymentMethod: 'card' | 'apple_pay' | 'google_pay') => {
    setLoading(true);
    try {
      // Here you would integrate with your payment processor
      // For example: Stripe, PayPal, etc.
      console.log('Donation:', {
        amount: isCustom ? Number(customAmount) : amount,
        paymentMethod,
        donorName: isAnonymous ? null : donorName,
        donorEmail: isAnonymous ? null : donorEmail,
        isAnonymous,
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Thank you for your donation!');
    } catch (error) {
      console.error('Donation failed:', error);
      alert('Donation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const finalAmount = isCustom ? Number(customAmount) || 0 : amount;

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
              <p>• $10 helps cover hosting costs for one month</p>
              <p>• $25 supports ongoing development and improvements</p>
              <p>• $50 enables new features and better user experience</p>
              <p>• $100+ makes you a Wing Week champion!</p>
            </div>
          </div>

          {/* Amount Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Amount
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {presetAmounts.map((presetAmount) => (
                <button
                  key={presetAmount}
                  onClick={() => handleAmountSelect(presetAmount)}
                  className={`p-3 text-center border rounded-lg font-medium transition-colors ${
                    amount === presetAmount && !isCustom
                      ? 'border-wingman-orange bg-wingman-orange bg-opacity-10 text-wingman-orange'
                      : 'border-gray-300 text-gray-700 hover:border-wingman-orange hover:border-opacity-50'
                  }`}
                >
                  ${presetAmount}
                </button>
              ))}
            </div>
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => handleCustomAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wingman-purple focus:border-transparent"
                min="1"
              />
            </div>
          </div>

          {/* Donor Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Donor Information</h3>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mr-3 rounded border-gray-300 text-wingman-purple focus:ring-wingman-purple"
              />
              <span className="text-sm text-gray-700">Make this donation anonymous</span>
            </label>

            {!isAnonymous && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wingman-purple focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Email address (optional)"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wingman-purple focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Payment Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => handleDonate('card')}
                disabled={loading || finalAmount <= 0}
                className="w-full flex items-center justify-center px-6 py-3 bg-wingman-orange text-white rounded-lg hover:bg-wingman-orange-light focus:ring-2 focus:ring-wingman-orange focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CreditCard className="w-5 h-5 mr-3" />
                <span className="font-medium">
                  {loading ? 'Processing...' : `Donate $${finalAmount} with Card`}
                </span>
              </button>

              <button
                onClick={() => handleDonate('apple_pay')}
                disabled={loading || finalAmount <= 0}
                className="w-full flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Smartphone className="w-5 h-5 mr-3" />
                <span className="font-medium">Apple Pay</span>
              </button>

              <button
                onClick={() => handleDonate('google_pay')}
                disabled={loading || finalAmount <= 0}
                className="w-full flex items-center justify-center px-6 py-3 border-2 border-wingman-teal text-wingman-teal rounded-lg hover:border-wingman-teal-light hover:bg-wingman-teal hover:bg-opacity-10 focus:ring-2 focus:ring-wingman-teal disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Smartphone className="w-5 h-5 mr-3" />
                <span className="font-medium">Google Pay</span>
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-wingman-teal bg-opacity-10 border border-wingman-teal border-opacity-30 rounded-lg p-4">
            <p className="text-sm text-wingman-teal">
              🔒 Your payment is processed securely. We don't store any payment information on our servers.
            </p>
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