import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import CertificateVerification from './pages/CertificateVerification';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

function App() {
  return (
    <AppContainer>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/verify/:refNo" element={<CertificateVerification />} />
        <Route path="/verify" element={<CertificateVerification />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppContainer>
  );
}

export default App;
