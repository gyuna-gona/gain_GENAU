import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Signup.css';

const API_BASE = "http://localhost:8080";

export default function Signup() {
  const [name, setName] = useState('');
  const [nameValid, setNameValid] = useState(false); // 사용자명 유효성 추가

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const [emailValid, setEmailValid] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [passwordValid, setPwValid] = useState(false);
  const [pwMatchValid, setPwMatchValid] = useState(false);
  const [notAllow, setNotAllow] = useState(true);
  const [toastShown, setToastShown] = useState(false);

  const navigate = useNavigate();

  const handleName = (e) => {
    const value = e.target.value;
    setName(value);
    const trimmedLength = value.trim().length;
    setNameValid(trimmedLength > 0 && value.length <= 8); // 8자 이하 검사
  };

  const handleEmail = (e) => {
    const value = e.target.value;
    setEmail(value);
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = regex.test(value);
    setEmailValid(isValid);
    setEmailAvailable(false);
    setCodeSent(false);
    setCodeVerified(false);
    setToastShown(false);
  };

  const handleSendCode = async () => {
    if (!emailValid) {
      if (!toastShown) {
        toast.error('유효한 이메일 형식이 아닙니다.', { toastId: 'invalid-email' });
        setToastShown(true);
      }
      return;
    }

    try {
      const checkResponse = await fetch(`${API_BASE}/auth/check-email?email=${encodeURIComponent(email)}`);
      const text = await checkResponse.text();
      const data = JSON.parse(text);

      if (data.exists) {
        if (!toastShown) {
          toast.error('이미 사용 중인 이메일입니다.', { toastId: 'email-exists' });
          setToastShown(true);
        }
        return;
      } else {
        setEmailAvailable(true);
      }
    } catch (error) {
      if (!toastShown) {
        toast.error('이메일 중복 확인 중 오류가 발생했습니다.', { toastId: 'check-fail' });
        setToastShown(true);
      }
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const text = await response.text();

      if (!response.ok) throw new Error(`전송 실패: ${response.status}`);

      const data = JSON.parse(text);
      setCodeSent(true);
      toast.success(data.message || '인증번호가 전송되었습니다.', { toastId: 'code-sent' });
      setToastShown(true);
    } catch (error) {
      toast.error('인증번호 전송 중 오류', { toastId: 'code-fail' });
      console.error(error);
    }
  };

  const handleCode = (e) => setCode(e.target.value);

  const handleVerifyCode = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();

      if (response.ok && data.verified) {
        setCodeVerified(true);
        toast.success('인증이 완료되었습니다.', { toastId: 'code-ok' });
      } else {
        toast.error(data.error || '인증번호가 올바르지 않습니다.', { toastId: 'code-wrong' });
      }
    } catch (error) {
      toast.error('인증번호 확인 중 오류', { toastId: 'code-verify-fail' });
      console.error(error);
    }
  };

  const handlePw = (e) => {
    const value = e.target.value;
    setPassword(value);
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+]).{8,20}$/;
    setPwValid(regex.test(value));
  };

  const handleConfirmPw = (e) => {
    const value = e.target.value;
    setConfirmPw(value);
    setPwMatchValid(password === value);
  };

  const onClickConfirmButton = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, code, password }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success('회원가입이 완료되었습니다.', { toastId: 'signup-ok' });
        navigate('/login');
      } else {
        toast.error(data.error || '회원가입 실패', { toastId: 'signup-fail' });
      }
    } catch (error) {
      toast.error('회원가입 중 네트워크 오류', { toastId: 'signup-network' });
      console.error(error);
    }
  };

  useEffect(() => {
    if (emailValid && emailAvailable && codeVerified && passwordValid && pwMatchValid && nameValid) {
      setNotAllow(false);
    } else {
      setNotAllow(true);
    }
  }, [emailValid, emailAvailable, codeVerified, passwordValid, pwMatchValid, nameValid]);

  return (
    <div className="background">
      <div className="page">
        <div className="titleWrap">이메일과 비밀번호를 입력해주세요</div>

        <div className="contentWrap">
          <div className="inputTitle">이메일 주소</div>
          <div className="inputWrap emailWithButton">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleEmail}
              required
            />
            <button
              className="authSendButton"
              onClick={handleSendCode}
              disabled={!emailValid}
            >
              인증번호 전송
            </button>
          </div>

          {codeSent && (
            <>
              <div className="inputTitle">인증코드</div>
              <div className="inputWrap">
                <input
                  type="text"
                  placeholder="이메일로 받은 인증코드를 입력하세요."
                  value={code}
                  onChange={handleCode}
                  required
                />
                <button className="authButton" onClick={handleVerifyCode}>확인</button>
              </div>
            </>
          )}

          <div className="inputTitle">사용자명</div>
          <div className="inputWrap">
            <input
              type="text"
              placeholder="이름 또는 닉네임"
              value={name}
              onChange={handleName}
              required
            />
          </div>
          {!nameValid && name.length > 0 && (
            <div className="errorMessageWrap">사용자명은 공백 포함 8자 이하로 입력해주세요.</div>
          )}

          <div className="inputTitle">비밀번호</div>
          <div className="inputWrap">
            <input
              type="password"
              placeholder="영문, 숫자, 특수문자 포함 8자 이상"
              value={password}
              onChange={handlePw}
              required
            />
          </div>
          {!passwordValid && password.length > 0 && (
            <div className="errorMessageWrap">
              영문, 숫자, 특수문자 포함 8자 이상 입력해주세요.
            </div>
          )}

          <div className="inputTitle">비밀번호 확인</div>
          <div className="inputWrap">
            <input
              type="password"
              placeholder="위에서 설정한 비밀번호를 입력하세요."
              value={confirmPw}
              onChange={handleConfirmPw}
              required
            />
          </div>
          {!pwMatchValid && confirmPw.length > 0 && (
            <div className="errorMessageWrap">비밀번호가 일치하지 않습니다.</div>
          )}
        </div>

        <div className="buttonWrap">
          <button onClick={onClickConfirmButton} disabled={notAllow} className="bottomButton">
            가입
          </button>
        </div>

        <div className="registerWrap">
          <div className="registerTitle">
            계정이 있으신가요? <Link to="/Login">로그인하기</Link>
          </div>
        </div>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}



