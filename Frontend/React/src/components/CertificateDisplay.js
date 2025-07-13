import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { certificateAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
`;

const Modal = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: ${props => props.fullscreen ? '95vw' : '90vw'};
  max-height: ${props => props.fullscreen ? '95vh' : '90vh'};
  width: 100%;
  position: relative;
  overflow: auto;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #334155;
`;

const Controls = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e2e8f0;
    color: #334155;
  }
`;

const CertificateContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8fafc;
  border-radius: 12px;
  padding: 2rem;
  position: relative;
  min-height: 400px;
`;

const CertificatePreview = styled.iframe`
  width: 100%;
  height: 600px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  color: #dc2626;
  font-weight: 500;
  padding: 2rem;
`;

const CertificateInfo = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 2rem;
  border-left: 4px solid #667eea;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.span`
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 1rem;
  color: #334155;
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 2px solid #f1f5f9;
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

function CertificateDisplay({ certificateData, onClose }) {
  const [certificateImage, setCertificateImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    loadCertificateImage();
  }, [certificateData]);

  const loadCertificateImage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load PDF for preview
      const blob = await certificateAPI.getCertificateFile(
        certificateData.referenceNumber
      );
      
      // For PDF preview, we'll create an object URL
      // Note: Modern browsers can display PDFs directly
      const pdfUrl = URL.createObjectURL(blob);
      setCertificateImage(pdfUrl);
      
    } catch (err) {
      console.error('Failed to load certificate:', err);
      setError('Failed to load certificate');
      
      // Create a mock certificate display as fallback
      createMockCertificate();
    } finally {
      setLoading(false);
    }
  };

  const createMockCertificate = () => {
    // Create a canvas element to generate a mock certificate
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 760, 560);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF COMPLETION', 400, 120);

    // Subtitle
    ctx.font = '24px Arial';
    ctx.fillText('SURE Trust', 400, 160);

    // Name
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`This is to certify that`, 400, 220);
    ctx.font = 'bold 32px Arial';
    ctx.fillText(certificateData.holderName, 400, 270);

    // Course
    ctx.font = '20px Arial';
    ctx.fillText(`has successfully completed the course`, 400, 320);
    ctx.font = 'bold 24px Arial';
    ctx.fillText(certificateData.course, 400, 360);

    // Dates
    ctx.font = '18px Arial';
    const startDate = new Date(certificateData.startDate).toLocaleDateString();
    const endDate = new Date(certificateData.endDate).toLocaleDateString();
    ctx.fillText(`From ${startDate} to ${endDate}`, 400, 420);

    // Reference number
    ctx.font = '14px Arial';
    ctx.fillText(`Reference: ${certificateData.referenceNumber}`, 400, 520);

    // Convert to image
    canvas.toBlob((blob) => {
      const imageUrl = URL.createObjectURL(blob);
      setCertificateImage(imageUrl);
    });
  };

  const handleDownload = async () => {
    try {
      // Download PDF certificate
      const blob = await certificateAPI.getCertificateFile(
        certificateData.referenceNumber
      );
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateData.referenceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download certificate. Please try again.');
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
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <Modal
          fullscreen={fullscreen}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Header>
            <Title>Certificate Preview</Title>
            <Controls>
              <ControlButton onClick={() => setFullscreen(!fullscreen)}>
                {fullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
              </ControlButton>
              <ControlButton onClick={onClose}>
                <FiX />
              </ControlButton>
            </Controls>
          </Header>

          <CertificateContainer>
            {loading && <LoadingSpinner />}
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {certificateImage && (
              <CertificatePreview src={certificateImage} title="Certificate Preview" />
            )}
          </CertificateContainer>

          <CertificateInfo>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Certificate Holder</InfoLabel>
                <InfoValue>{certificateData.holderName}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Email</InfoLabel>
                <InfoValue>{certificateData.email}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Course</InfoLabel>
                <InfoValue>{certificateData.course}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Batch</InfoLabel>
                <InfoValue>{certificateData.batch}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Start Date</InfoLabel>
                <InfoValue>{formatDate(certificateData.startDate)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>End Date</InfoLabel>
                <InfoValue>{formatDate(certificateData.endDate)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Reference Number</InfoLabel>
                <InfoValue>{certificateData.referenceNumber}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Status</InfoLabel>
                <InfoValue style={{ color: '#10b981' }}>✓ VERIFIED</InfoValue>
              </InfoItem>
            </InfoGrid>
          </CertificateInfo>

          <ActionButtons>
            <ActionButton primary onClick={handleDownload} disabled={!certificateImage}>
              <FiDownload />
              Download Certificate
            </ActionButton>
            <ActionButton onClick={onClose}>
              Close
            </ActionButton>
          </ActionButtons>
        </Modal>
      </Overlay>
    </AnimatePresence>
  );
}

export default CertificateDisplay;
