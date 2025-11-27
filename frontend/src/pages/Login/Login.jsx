import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Login.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = "http://localhost:8080";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onClickLogin = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // 디버깅을 위해 이 줄을 추가하세요
      console.log('서버로부터 받은 로그인 데이터:', data);

      if (!response.ok) {
        toast.error(data.error || '로그인 실패');
        return;
      }

      // JWT 토큰과 유저 정보 저장 (이메일도 반드시 저장)
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.name);
      localStorage.setItem('token', data.token);
      localStorage.setItem('email', email);

      // 추가: 오염될 수 있는 예전 토큰 키를 삭제합니다.
      localStorage.removeItem('accessToken');

      toast.success('로그인 성공!');

      setTimeout(() => {
        // 현재 location.search의 token 값을 그대로 초대 수락 페이지로 넘김
        const params = new URLSearchParams(location.search);
        const invitationToken = params.get('token');
        if (invitationToken) {
          navigate(`/invitations/accept?token=${invitationToken}`, { replace: true });
        } else {
          navigate('/Main');
        }
      }, 500);
    } catch (err) {
      toast.error('서버 오류가 발생했어요.');
      console.error('[LOGIN ERROR]', err);
    }
  };

  return (
    <div className="login-background">
      <div className="login-box">
        <h2>GENAU로 똑똑하게 관리하세요!</h2>
        <form onSubmit={(e) => { e.preventDefault(); onClickLogin(); }}>
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="forgot-password-container">
            <Link to="/ResetPassword" className="forgot-password-button">
              비밀번호 재설정
            </Link>
          </div>

          <button type="submit">
            로그인
          </button>
        </form>

        <div className="signup-container">
          <span>계정이 필요한가요?</span>
          <Link to="/Signup" className="signup-button">
            회원가입하기
          </Link>
        </div>
      </div>

      <ToastContainer
        className="toast-container"
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
  );
}

export default Login;
