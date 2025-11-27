import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoMdClose } from 'react-icons/io';
import './VerifyCode.css';

function VerifyCode() {
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(180); // 3분
  const [popupMessage, setPopupMessage] = useState('');
  const [disabled, setDisabled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (timeLeft <= 0) {
      setDisabled(true);
      setPopupMessage('인증 시간이 초과되었습니다.');
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmit = async () => {
    if (disabled) return;
    try {
      const response = await fetch('http://localhost:8080/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      if (!response.ok || !data.verified) throw new Error('인증 번호를 확인하세요.');
      navigate('/ChangePassword', { state: { email, code } });
    } catch (err) {
      setPopupMessage(err.message);
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await fetch('http://localhost:8080/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('인증번호 재전송에 실패했습니다.');

      setPopupMessage('인증번호가 재전송되었습니다.');
      setTimeLeft(180); // 다시 3분
      setDisabled(false);

      // 팝업 자동 닫기
      setTimeout(() => setPopupMessage(''), 1200);
    } catch (err) {
      setPopupMessage(err.message);
    }
  };

  const closePopup = () => {
    setPopupMessage('');
  };

  const formatTime = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  return (
    <div className="verify-code-background">
      <div className="verify-code-box">
        <h1>인증 코드 입력</h1>
        <p>이메일로 받은 인증 코드를 입력하세요.</p>
        <input
          type="text"
          placeholder="6자리 인증 코드"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="verify-code-input"
        />
        <div className="countdown-timer">남은 시간: {formatTime(timeLeft)}</div>
        <button className="verify-submit-button" onClick={handleSubmit} disabled={disabled}>
          인증 코드 확인
        </button>
      </div>

      {popupMessage && (
        <div className="popup-overlay">
          <div className="popup-box">
            <IoMdClose size={22} className="popup-close-icon" onClick={closePopup} />
            <p>{popupMessage}</p>
            <button className="popup-resend-button" onClick={handleResendCode}>
              인증번호 재전송
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerifyCode;
