import React from 'react';

const PenaltyBadge = ({ 
  bill, 
  showAmount = true, 
  showDays = false, 
  className = '',
  variant = 'default' // 'default', 'compact', 'detailed'
}) => {
  const penaltyAmount = bill?.penalty?.amount || 0;
  const penaltyDays = bill?.penalty?.days || 0;
  const isOverdue = bill?.status === 'overdue' || penaltyAmount > 0;

  if (!isOverdue || penaltyAmount <= 0) {
    return null;
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'px-2 py-1 text-xs';
      case 'detailed':
        return 'px-3 py-2 text-sm';
      default:
        return 'px-2 py-1 text-xs';
    }
  };

  const baseStyles = `inline-flex items-center rounded-full font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 ${getVariantStyles()}`;

  return (
    <div className={`${baseStyles} ${className}`}>
      <svg 
        className="w-3 h-3 mr-1" 
        fill="currentColor" 
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          fillRule="evenodd" 
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
          clipRule="evenodd"
        />
      </svg>
      
      {variant === 'detailed' ? (
        <div className="flex flex-col">
          {showAmount && (
            <span className="font-semibold">
              ₹{penaltyAmount} penalty
            </span>
          )}
          {showDays && penaltyDays > 0 && (
            <span className="text-xs opacity-75">
              {Math.ceil(penaltyDays / 30)} month(s) late
            </span>
          )}
        </div>
      ) : (
        <>
          {showAmount && <span>₹{penaltyAmount}</span>}
          {showDays && penaltyDays > 0 && (
            <span className="ml-1">({Math.ceil(penaltyDays / 30)}m)</span>
          )}
        </>
      )}
    </div>
  );
};

// Enhanced Bill Total component that includes penalties
export const BillTotalWithPenalty = ({ 
  bill, 
  showBreakdown = false,
  className = '' 
}) => {
  const originalAmount = bill?.totalAmount || 0;
  const penaltyAmount = bill?.penalty?.amount || 0;
  const totalWithPenalty = originalAmount + penaltyAmount;

  return (
    <div className={`bill-total-with-penalty ${className}`}>
      {showBreakdown ? (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Bill Amount:</span>
            <span className="font-medium">₹{originalAmount}</span>
          </div>
          {penaltyAmount > 0 && (
            <div className="flex justify-between text-red-600 dark:text-red-400">
              <span>Late Fee:</span>
              <span className="font-medium">₹{penaltyAmount}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1 border-gray-200 dark:border-gray-600">
            <span className="font-semibold text-gray-800 dark:text-gray-200">Total:</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">
              ₹{totalWithPenalty}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ₹{totalWithPenalty}
          </span>
          {penaltyAmount > 0 && (
            <PenaltyBadge bill={bill} variant="compact" />
          )}
        </div>
      )}
    </div>
  );
};

// Status badge that includes penalty information
export const BillStatusWithPenalty = ({ 
  bill, 
  className = '' 
}) => {
  const penaltyAmount = bill?.penalty?.amount || 0;
  const status = bill?.status || 'pending';
  
  const getStatusConfig = () => {
    if (penaltyAmount > 0 && status !== 'paid') {
      return {
        label: 'Overdue',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: '⚠️'
      };
    }
    
    switch (status) {
      case 'paid':
        return {
          label: 'Paid',
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          icon: '✅'
        };
      case 'partially_paid':
        return {
          label: 'Partial',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          icon: '⚠️'
        };
      case 'pending':
        return {
          label: 'Pending',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          icon: '⏳'
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          icon: '❓'
        };
    }
  };

  const { label, color, icon } = getStatusConfig();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <span className="mr-1">{icon}</span>
        {label}
      </span>
      {penaltyAmount > 0 && status !== 'paid' && (
        <PenaltyBadge bill={bill} variant="compact" />
      )}
    </div>
  );
};

export default PenaltyBadge;