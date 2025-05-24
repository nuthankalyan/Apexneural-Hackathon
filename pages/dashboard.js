import React from 'react';
import History from './History'; // Adjust the import based on your file structure

const Dashboard = ({ user, currentWorkspace }) => {
  return (
    <div>
      {/* ...other components... */}
      
      <History 
        userId={user?.id || user?._id} 
        workspaceName={currentWorkspace?.name || 'Default'}
      />
      
      {/* ...other components... */}
    </div>
  );
};

export default Dashboard;