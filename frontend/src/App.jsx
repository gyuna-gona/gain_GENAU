import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login';
import ServiceIntro from './pages/ServiceIntro/ServiceIntro';
import Signup from './pages/Signup/Signup';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import VerifyCode from './pages/VerifyCode/VerifyCode';
import Main from './pages/Main/Main';
import ChangePassword from './pages/ChangePassword/ChangePassword';
import TeamSpace from './components/TeamSpace/TeamSpace';
import AcceptInvitation from './components/AcceptInvitation/AcceptInvitation'; 
import MyPage from './pages/MyPage/MyPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ServiceIntro />} />
        <Route path="/login" element={<Login />} /> 
        <Route path="/signup" element={<Signup />} />
        <Route path="/resetpassword" element={<ResetPassword />} /> 
        <Route path="/verifycode" element={<VerifyCode />} />
        <Route path="/main" element={<Main />} />
        <Route path="/changepassword" element={<ChangePassword />} />
        <Route path="/team/:teamId" element={<TeamSpace />} />
        <Route path="/invitations/accept" element={<AcceptInvitation />} />
        <Route path="/invitations/validate" element={<AcceptInvitation />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
