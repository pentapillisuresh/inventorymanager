// src/pages/Outlets.jsx
import React from 'react';
import OutletList from '../components/Outlets/OutletList';
import { localStorageManager } from '../utils/localStorage';

const Outlets = () => {
  const outlets = localStorageManager.getOutlets();

  const handleViewOutlet = (outlet) => {
    // Implement view outlet details
    console.log('View outlet:', outlet);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Outlet Management</h1>
        <p className="text-gray-600">Manage and monitor your outlets</p>
      </div>

      <OutletList outlets={outlets} onView={handleViewOutlet} />
    </div>
  );
};

export default Outlets;