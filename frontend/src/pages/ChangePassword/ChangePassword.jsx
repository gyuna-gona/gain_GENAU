import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ChangePassword.css';

function ChangePassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formatError, setFormatError] = useState('');
  const [matchError, setMatchError] = useState('');
  const navigate = useNavigate();
  const { email, code } = useLocation().state || {};

  //  비밀번호 형식 검사 함수
  const validatePassword = (value) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+]).{8,20}$/;
    if (!regex.test(value)) {
      setFormatError('비밀번호는 영문, 숫자, 특수문자 포함 8자 이상이어야 합니다.');
    } else {
      setFormatError('');
    }
  };

  const handleChangePassword = async () => {
    //  비밀번호 형식 재검사 (직접 검사해야 사용자가 검사 안 한 경우 대비)
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+]).{8,20}$/;
    const isValid = regex.test(password);
    if (!isValid) {
      setFormatError('비밀번호는 영문, 숫자, 특수문자 포함 8자 이상이어야 합니다.');
      return;
    }
  
    if (password !== confirm) {
      setMatchError('비밀번호가 일치하지 않습니다.');
      return;
    }
  
    // 에러 초기화
    setFormatError('');
    setMatchError('');
  
    try {
      const response = await fetch('http://localhost:8080/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password, code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert('비밀번호가 성공적으로 변경되었습니다.');
      navigate('/Login');
    } catch (err) {
      setMatchError(err.message); // 서버 오류 메시지는 matchError에 표시
    }
  };
  

  return (
    <div className="reset-password-background">
      <div className="reset-password-box">
        <h1>비밀번호 변경</h1>

        <div className="input-wrapper">
          <input
            type="password"
            placeholder="새 비밀번호"
            className="reset-pw-input"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              validatePassword(e.target.value); //  실시간 검사
            }}
          />
          {formatError && (
            <div className="error-wrapper">
              <p className="error-under-input">{formatError}</p>
            </div>
          )}
        </div>

        <div className="input-wrapper">
          <input
            type="password"
            placeholder="비밀번호 확인"
            className="reset-pw-input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {matchError && (
            <div className="error-wrapper">
              <p className="error-under-input">{matchError}</p>
            </div>
          )}
        </div>

        <button
          className="reset-submit-button"
          onClick={handleChangePassword}
          disabled={!!formatError} // 형식 오류 있으면 비활성화도 가능
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default ChangePassword;
