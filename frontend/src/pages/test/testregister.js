import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function TestRegister() {
  const { uuid } = useParams();
  const [registrationStatus, setRegistrationStatus] = useState(null);

  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const response = await axios.post(`/api/tests/${uuid}/check-registration`);
        setRegistrationStatus(response.data);
      } catch (error) {
        console.error('Registration check failed:', error);
      }
    };

    checkRegistration();
  }, [uuid]);

  return (
    <div>
      {registrationStatus && (
        <div>
          <h2>{registrationStatus.test.title}</h2>
          <p>Status: {registrationStatus.registration?.status || 'Not registered'}</p>
          {registrationStatus.canRegister && (
            <button onClick={() => handleRegister()}>Register for Test</button>
          )}
        </div>
      )}
    </div>
  );
}