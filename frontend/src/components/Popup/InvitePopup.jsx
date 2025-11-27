import React, { useState } from 'react';
import './InvitePopup.css';

function InvitePopup({ teamId, teamName, onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [alert, setAlert] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token'); // 토큰 가져오기

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setError(validateEmail(value) ? '' : '올바른 이메일 주소를 입력하세요.');
  };

  const sendInvite = async () => {
    if (!validateEmail(email)) {
      setError('올바른 이메일 주소를 입력하세요.');
      return;
    }

    setLoading(true);
    setError('');
    setAlert('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // 인증 헤더 추가
        },
        body: JSON.stringify({ teamId, email: email.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '초대 전송 실패');

      setAlert(`초대 링크가 전송되었습니다.\n(유효기간: ${new Date(data.expiresAt).toLocaleString()})`);
      setEmail('');
    } catch (err) {
      console.error('[초대 실패]', err);
      setAlert(`${err.message || '에러가 발생했습니다.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invite-dim">
      <div className="invite-box">
        <button className="invite-close" onClick={onClose}>×</button>

        <h2 className="invite-title">
          이메일로 <span className="tn">{teamName}</span> 에 초대하기
        </h2>

        <div className="invite-input-wrapper">
          <input
            type="email"
            placeholder="example@email.com"
            className="invite-input"
            value={email}
            onChange={handleEmailChange}
          />
          {error && <p className="invite-error">{error}</p>}
        </div>

        <button className="invite-submit" onClick={sendInvite} disabled={loading}>
          {loading ? '전송 중...' : '전송'}
        </button>

        {alert && <div className="invite-alert">{alert}</div>}
      </div>
    </div>
  );
}

export default InvitePopup;