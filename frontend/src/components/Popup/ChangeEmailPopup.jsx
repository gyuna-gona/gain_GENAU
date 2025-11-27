import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import './InvitePopup.css'; 

export default function ChangeEmailPopup({ token, onClose, onEmailChange }) {
  const [step, setStep] = useState('enter');
  const [newEmail, setNewEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const sendCode = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me/email/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });
      setStep('verify');
    } catch (err) {
      alert('인증코드 전송 실패');
    }
  };

  const verify = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me/email/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail, code: verifyCode }),
      });
      const data = await res.json();
      if (data.verified) {
        setIsVerified(true);
      } else {
        alert('코드가 일치하지 않습니다.');
      }
    } catch (err) {
      alert('코드 인증 실패');
    }
  };

  const changeEmail = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });
      onEmailChange(newEmail);
      onClose();
    } catch (err) {
      alert('이메일 변경 실패');
    }
  };

  return (
    <div className="invite-dim">
      <div className="invite-box">
        <IoClose className="invite-close" onClick={onClose} />
        {step === 'enter' && (
          <>
            <h3 className="invite-title">새 이메일 입력</h3>
            <input
              className="invite-input"
              placeholder="새 이메일"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <button className="invite-submit" onClick={sendCode}>인증코드 전송</button>
          </>
        )}
        {step === 'verify' && (
          <>
            <h3 className="invite-title">인증코드 입력</h3>
            <input
              className="invite-input"
              placeholder="인증코드"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
            />
            {!isVerified ? (
              <button className="invite-submit" onClick={verify}>코드 인증</button>
            ) : (
              <button className="invite-submit" onClick={changeEmail}>이메일 변경</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
