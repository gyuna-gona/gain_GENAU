import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import './ChangePopup.css';

export default function ChangePasswordPopup({ userEmail, onClose }) {
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwValid, setPwValid] = useState(true);
  const [matchValid, setMatchValid] = useState(true);

  const sendCode = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      setCodeSent(true);
    } catch {
      alert('인증코드 전송 실패');
    }
  };

  const verifyCode = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, code }),
      });
      const data = await res.json();
      if (data.verified) setVerified(true);
      else alert('인증 실패');
    } catch {
      alert('인증 실패');
    }
  };

  const handlePwChange = (e) => {
    const value = e.target.value;
    setNewPw(value);
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+]).{8,20}$/;
    setPwValid(regex.test(value));
    setMatchValid(value === confirmPw);
  };

  const handleConfirmChange = (e) => {
    const value = e.target.value;
    setConfirmPw(value);
    setMatchValid(newPw === value);
  };

  const changePassword = async () => {
    if (!pwValid) {
      alert('비밀번호 형식이 올바르지 않습니다.');
      return;
    }
    if (!matchValid) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, code, newPassword: newPw }),
      });
      alert('비밀번호가 변경되었습니다.');
      onClose();
    } catch {
      alert('비밀번호 변경 실패');
    }
  };

  return (
    <div className="popup-dim">
      <div className="popup-box">
        <IoClose className="popup-close" onClick={onClose} />
        <h3>비밀번호 변경</h3>

        {!codeSent ? (
          <button onClick={sendCode}>인증코드 전송</button>
        ) : !verified ? (
          <>
            <input
              placeholder="인증코드 입력"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button onClick={verifyCode}>코드 인증</button>
          </>
        ) : (
          <>
            <input
              placeholder="새 비밀번호"
              type="password"
              value={newPw}
              onChange={handlePwChange}
            />
            {!pwValid && newPw.length > 0 && (
              <div className="errorMessageWrap2">
                영문, 숫자, 특수문자 포함 8~20자 입력해주세요.
              </div>
            )}

            <input
              placeholder="비밀번호 확인"
              type="password"
              value={confirmPw}
              onChange={handleConfirmChange}
            />
            {!matchValid && confirmPw.length > 0 && (
              <div className="errorMessageWrap2">비밀번호가 일치하지 않습니다.</div>
            )}

            <button onClick={changePassword}>비밀번호 변경</button>
          </>
        )}
      </div>
    </div>
  );
}


