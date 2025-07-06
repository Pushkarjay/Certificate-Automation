import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import GenerateCertificate from './pages/GenerateCertificate';
import VerifyCertificate from './pages/VerifyCertificate';
import CertificateView from './pages/CertificateView';
import CertificateList from './pages/CertificateList';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/generate" element={<GenerateCertificate />} />
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/verify/:dofNo" element={<VerifyCertificate />} />
            <Route path="/certificate/:id" element={<CertificateView />} />
            <Route path="/certificates" element={<CertificateList />} />
          </Routes>
        </main>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;
