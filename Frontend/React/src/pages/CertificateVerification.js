import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { 
  FiShield, 
  FiCheck, 
  FiX, 
  FiSearch, 
  FiDownload, 
  FiEye,
  FiCalendar,
  FiUser,
  FiMail,
  FiBook,
  FiAward,
  FiHome
} from 'react-icons/fi';
import { certificateAPI } from '../utils/api';
import CertificateDisplay from '../components/CertificateDisplay';
import SearchForm from '../components/SearchForm';

const Container = styled.div`
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Header = styled.div`
  text-align: center;
  color: white;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 800px;
  margin-bottom: 2rem;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  
  ${props => props.valid ? `
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  ` : `
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  `}
`;

const CertificateInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  border-left: 4px solid #667eea;
`;

const InfoIcon = styled.div`
  color: #667eea;
  font-size: 1.2rem;
  margin-top: 0.1rem;
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  font-size: 1rem;
  color: #334155;
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.primary ? `
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }
  ` : `
    background: #f1f5f9;
    color: #334155;
    
    &:hover {
      background: #e2e8f0;
    }
  `}
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 2rem auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #dc2626;
  font-weight: 500;
`;

const BackButton = styled.button`
  position: fixed;
  top: 2rem;
  left: 2rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  @media (max-width: 768px) {
    position: static;
    margin-bottom: 1rem;
    width: auto;
    align-self: flex-start;
  }
`;

function CertificateVerification() {
  const { refNo } = useParams();
  const navigate = useNavigate();
  const [searchRefNo, setSearchRefNo] = useState(refNo || '');
  const [showCertificate, setShowCertificate] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    course: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  const { data: certificateData, isLoading, error, refetch } = useQuery(
    ['certificate', searchRefNo],
    () => certificateAPI.verify(searchRefNo),
    {
      enabled: !!searchRefNo,
      retry: false,
      onSuccess: (data) => {
        if (data.valid) {
          toast.success('Certificate verified successfully!');
        } else {
          toast.error(data.message || 'Certificate verification failed');
        }
      },
      onError: (error) => {
        toast.error('Failed to verify certificate');
      }
    }
  );

  useEffect(() => {
    if (refNo && refNo !== searchRefNo) {
      setSearchRefNo(refNo);
    }
  }, [refNo, searchRefNo]);

  const handleSearch = (newRefNo) => {
    setSearchRefNo(newRefNo);
    navigate(`/verify/${newRefNo}`);
  };

  const handleViewCertificate = () => {
    setShowCertificate(true);
  };

  const handleDownloadCertificate = async () => {
    try {
      if (certificateData?.certificateData) {
        const blob = await certificateAPI.getCertificateFile(
          certificateData.certificateData.referenceNumber
        );
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${certificateData.certificateData.referenceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success('Certificate downloaded successfully!');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download certificate');
    }
  };

  const handleManualVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await certificateAPI.manualVerify({
        holderName: manualForm.name,
        course: manualForm.course,
        email: manualForm.email
      });
      
      if (response.valid) {
        toast.success('Certificate verified successfully!');
        // Update the search to show the found certificate
        setSearchRefNo(response.certificateData.referenceNumber);
        navigate(`/verify/${response.certificateData.referenceNumber}`);
      } else {
        toast.error(response.message || 'Certificate verification failed');
      }
    } catch (error) {
      toast.error('Failed to verify certificate manually');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container>
      <BackButton onClick={() => navigate('/')}>
        <FiHome size={20} />
      </BackButton>

      <Header>
        <Title>Certificate Verification</Title>
        <Subtitle>Enter a certificate reference number to verify its authenticity</Subtitle>
      </Header>

      <SearchForm onSearch={handleSearch} initialValue={searchRefNo} />

      <AnimatePresence mode="wait">
        {isLoading && (
          <Card
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <LoadingSpinner />
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              Verifying certificate...
            </div>
          </Card>
        )}

        {error && (
          <Card
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <ErrorMessage>
              <FiX size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
              Failed to verify certificate. Please check the reference number and try again.
            </ErrorMessage>
          </Card>
        )}

        {certificateData && (
          <Card
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <StatusBadge valid={certificateData.valid}>
              {certificateData.valid ? <FiCheck size={20} /> : <FiX size={20} />}
              {certificateData.valid ? 'CERTIFICATE VERIFIED' : 'VERIFICATION FAILED'}
            </StatusBadge>

            <div style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#334155' }}>
              {certificateData.message}
            </div>

            {certificateData.valid && certificateData.certificateData && (
              <>
                <CertificateInfo>
                  <InfoItem>
                    <InfoIcon><FiUser /></InfoIcon>
                    <InfoContent>
                      <InfoLabel>Certificate Holder</InfoLabel>
                      <InfoValue>{certificateData.certificateData.holderName}</InfoValue>
                    </InfoContent>
                  </InfoItem>

                  <InfoItem>
                    <InfoIcon><FiMail /></InfoIcon>
                    <InfoContent>
                      <InfoLabel>Email</InfoLabel>
                      <InfoValue>{certificateData.certificateData.email}</InfoValue>
                    </InfoContent>
                  </InfoItem>

                  <InfoItem>
                    <InfoIcon><FiBook /></InfoIcon>
                    <InfoContent>
                      <InfoLabel>Course</InfoLabel>
                      <InfoValue>{certificateData.certificateData.course}</InfoValue>
                    </InfoContent>
                  </InfoItem>

                  <InfoItem>
                    <InfoIcon><FiAward /></InfoIcon>
                    <InfoContent>
                      <InfoLabel>Batch</InfoLabel>
                      <InfoValue>{certificateData.certificateData.batch}</InfoValue>
                    </InfoContent>
                  </InfoItem>

                  <InfoItem>
                    <InfoIcon><FiCalendar /></InfoIcon>
                    <InfoContent>
                      <InfoLabel>Duration</InfoLabel>
                      <InfoValue>
                        {formatDate(certificateData.certificateData.startDate)} - {formatDate(certificateData.certificateData.endDate)}
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>

                  <InfoItem>
                    <InfoIcon><FiShield /></InfoIcon>
                    <InfoContent>
                      <InfoLabel>Reference Number</InfoLabel>
                      <InfoValue>{certificateData.certificateData.referenceNumber}</InfoValue>
                    </InfoContent>
                  </InfoItem>
                </CertificateInfo>

                <ActionButtons>
                  <ActionButton primary onClick={handleViewCertificate}>
                    <FiEye />
                    View Certificate
                  </ActionButton>
                  <ActionButton onClick={handleDownloadCertificate}>
                    <FiDownload />
                    Download
                  </ActionButton>
                </ActionButtons>
              </>
            )}
          </Card>
        )}

        {/* Manual Verification Form */}
        <Card
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 style={{ marginBottom: '1rem', color: '#334155' }}>Manual Certificate Check</h3>
          <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
            You can also manually verify certificates by entering the certificate details below:
          </p>
          
          <form onSubmit={handleManualVerification}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Certificate Holder Name:
              </label>
              <input
                type="text"
                value={manualForm.name}
                onChange={(e) => setManualForm({...manualForm, name: e.target.value})}
                placeholder="Enter full name"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Course Name:
              </label>
              <input
                type="text"
                value={manualForm.course}
                onChange={(e) => setManualForm({...manualForm, course: e.target.value})}
                placeholder="Enter course name"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Email Address:
              </label>
              <input
                type="email"
                value={manualForm.email}
                onChange={(e) => setManualForm({...manualForm, email: e.target.value})}
                placeholder="Enter email address"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Manual Verification
            </button>
          </form>
        </Card>

        {/* How to Verify Instructions */}
        <Card
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 style={{ marginBottom: '1rem', color: '#334155' }}>How to Verify</h3>
          <ol style={{ paddingLeft: '1.5rem', color: '#64748b', lineHeight: '1.6' }}>
            <li>Enter your certificate reference number in the field above</li>
            <li>Click "Verify Certificate" button</li>
            <li>View your certificate details and verification status</li>
          </ol>
          
          <h3 style={{ margin: '2rem 0 1rem', color: '#334155' }}>QR Code Verification</h3>
          <p style={{ color: '#64748b', lineHeight: '1.6' }}>
            You can also verify certificates by scanning the QR code on your certificate using your mobile device.
          </p>
          
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: '#f8fafc', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0', color: '#64748b', fontSize: '0.9rem' }}>
              © 2025 SURE Trust. All rights reserved.<br />
              For support, contact: support@suretrust.org
            </p>
          </div>
        </Card>
      </AnimatePresence>

      {showCertificate && certificateData?.certificateData && (
        <CertificateDisplay
          certificateData={certificateData.certificateData}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </Container>
  );
}

export default CertificateVerification;
