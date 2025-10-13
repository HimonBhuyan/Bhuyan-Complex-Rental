import React, { useState, useEffect } from 'react';

const PenaltyManagement = ({ token, apiBase = '' }) => {
  const [penalties, setPenalties] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch penalty statistics
  const fetchPenaltyStats = async () => {
    try {
      const response = await fetch(`${apiBase}/api/penalties/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics);
        setPenalties(data.billsWithPenalties);
      }
    } catch (error) {
      console.error('Error fetching penalty stats:', error);
    }
  };

  // Apply monthly penalties manually
  const applyMonthlyPenalties = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${apiBase}/api/penalties/apply-monthly`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Applied penalties to ${data.penaltiesApplied} bills. Total amount: ₹${data.totalPenaltyAmount}`);
        await fetchPenaltyStats(); // Refresh data
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Adjust penalty for specific bill
  const adjustPenalty = async (billId, adjustment, reason) => {
    try {
      const response = await fetch(`${apiBase}/api/penalties/adjust/${billId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adjustment, reason })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Penalty adjusted by ₹${adjustment} for bill ${data.bill.billNumber}`);
        await fetchPenaltyStats(); // Refresh data
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPenaltyStats();
    }
  }, [token]);

  return (
    <div className="penalty-management p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Penalty Management
        </h2>
        <button
          onClick={applyMonthlyPenalties}
          disabled={loading}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? 'Applying...' : 'Apply Monthly Penalties'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
        }`}>
          {message}
        </div>
      )}

      {/* Penalty Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
            Total Penalty Amount
          </h3>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
            ₹{stats.totalPenaltyAmount || 0}
          </p>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
            Bills with Penalties
          </h3>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {stats.billsWithPenaltyCount || 0}
          </p>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
            Overdue Bills
          </h3>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {stats.overdueBillsCount || 0}
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
            Avg Penalty/Bill
          </h3>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            ₹{stats.averagePenaltyPerBill || 0}
          </p>
        </div>
      </div>

      {/* Bills with Penalties Table */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Bills with Applied Penalties
        </h3>
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Bill Number
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Tenant
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Month/Year
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Bill Amount
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Penalty
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {penalties.length > 0 ? penalties.map((penalty) => (
              <tr key={penalty.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                  {penalty.billNumber}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                  {penalty.tenantName}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                  {penalty.month}/{penalty.year}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                  ₹{penalty.totalAmount - penalty.penaltyAmount}
                </td>
                <td className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400">
                  ₹{penalty.penaltyAmount}
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    penalty.status === 'paid' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : penalty.status === 'overdue'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {penalty.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  <button
                    onClick={() => {
                      const adjustment = prompt('Enter adjustment amount (negative to reduce, positive to add):');
                      if (adjustment && !isNaN(adjustment)) {
                        const reason = prompt('Enter reason for adjustment:') || 'Admin adjustment';
                        adjustPenalty(penalty.id, parseFloat(adjustment), reason);
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    Adjust
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove penalty of ₹${penalty.penaltyAmount} from ${penalty.billNumber}?`)) {
                        adjustPenalty(penalty.id, -penalty.penaltyAmount, 'Penalty removed by admin');
                      }
                    }}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No bills with penalties found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Penalty Settings */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-2">
          Current Penalty Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
          <div>
            <strong>Rate:</strong> ₹50 per month
          </div>
          <div>
            <strong>Application Day:</strong> 10th of every month
          </div>
          <div>
            <strong>Auto-Application:</strong> Enabled
          </div>
        </div>
      </div>
    </div>
  );
};

export default PenaltyManagement;