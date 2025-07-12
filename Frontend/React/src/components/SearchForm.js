import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';

const SearchContainer = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  margin-bottom: 2rem;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 16px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #94a3b8;
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SearchButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const HelpText = styled.div`
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
`;

const ExampleText = styled.div`
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #94a3b8;
  text-align: center;
  font-family: monospace;
`;

function SearchForm({ onSearch, initialValue = '' }) {
  const [refNo, setRefNo] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (refNo.trim()) {
      onSearch(refNo.trim());
    }
  };

  const isValidRefNo = refNo.length >= 10; // Basic validation

  return (
    <SearchContainer
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <SearchForm onSubmit={handleSubmit}>
        <SearchInput
          type="text"
          placeholder="Enter certificate reference number"
          value={refNo}
          onChange={(e) => setRefNo(e.target.value)}
          maxLength={50}
        />
        <SearchButton type="submit" disabled={!isValidRefNo}>
          <FiSearch />
          Verify
        </SearchButton>
      </SearchForm>
      
      <HelpText>
        Enter the complete reference number found on your certificate
      </HelpText>
      <ExampleText>
        Example: STUDENT-G28-2025-000001
      </ExampleText>
    </SearchContainer>
  );
}

export default SearchForm;
