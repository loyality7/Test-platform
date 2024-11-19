import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function Proctoring() {
  const { testId } = useParams();
  const [proctorData, setProctorData] = useState({
    tabSwitches: 0,
    browserSwitches: 0,
    warnings: []
  });

  useEffect(() => {
    // Add event listeners for proctoring
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setProctorData(prev => ({
          ...prev,
          tabSwitches: prev.tabSwitches + 1,
          warnings: [...prev.warnings, {
            type: 'tab_switch',
            timestamp: new Date()
          }]
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Test Proctoring</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Proctoring Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Tab Switches:</p>
              <p className="text-gray-600">{proctorData.tabSwitches}</p>
            </div>
            <div>
              <p className="font-medium">Browser Switches:</p>
              <p className="text-gray-600">{proctorData.browserSwitches}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-medium mb-2">Warnings:</h3>
          <div className="space-y-2">
            {proctorData.warnings.map((warning, index) => (
              <div key={index} className="bg-red-50 p-3 rounded">
                <p className="text-red-700">
                  {warning.type === 'tab_switch' ? 'Tab Switch Detected' : 'Browser Switch Detected'}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(warning.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}