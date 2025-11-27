import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResetPassword.css';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const navigate = useNavigate();

  const handleSendCode = async () => {
    try {
      //  유효한 이메일인지 검사
      if (!email || !email.includes('@')) {
        setPopupMessage('유효한 이메일을 입력해주세요.');
        return;
      }

      //  이메일 중복 확인 요청 로그 출력
      const checkUrl = `http://localhost:8080/auth/check-email?email=${encodeURIComponent(email)}`;
      console.log('[CHECK EMAIL] GET', checkUrl);

      const checkRes = await fetch(checkUrl);
      const checkData = await checkRes.json();

      console.log('[CHECK EMAIL RESPONSE]', checkData);

      if (!checkRes.ok || !checkData.exists) {
        throw new Error('가입되지 않은 이메일입니다.');
      }

      //  인증코드 전송 요청 로그 출력
      const sendCodeUrl = 'http://localhost:8080/auth/send-code';
      const requestBody = { email };
      const requestHeaders = { 'Content-Type': 'application/json' };

      console.log('[SEND CODE] POST', sendCodeUrl);
      console.log('[SEND CODE] Headers:', requestHeaders);
      console.log('[SEND CODE] Body:', JSON.stringify(requestBody));

      const sendRes = await fetch(sendCodeUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });

      const sendData = await sendRes.json();
      console.log('[SEND CODE RESPONSE]', sendData);

      if (!sendRes.ok) throw new Error(sendData.error || '인증코드 전송 실패');

      navigate('/VerifyCode', { state: { email } });
    } catch (err) {
      console.error('[ERROR]', err);
      setPopupMessage(err.message);
    }
  };

  return (
    <div className="reset-password-background">
      <div className="reset-password-box">
        <h1>비밀번호 재설정</h1>
        <p>이메일로 인증 번호를 보내드립니다.</p>
        <input
          type="email"
          placeholder="이메일을 입력하세요"
          className="reset-email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="reset-submit-button" onClick={handleSendCode}>
          인증 번호 보내기
        </button>
      </div>

      {popupMessage && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>{popupMessage}</p>
            <button onClick={() => setPopupMessage('')}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResetPassword;


