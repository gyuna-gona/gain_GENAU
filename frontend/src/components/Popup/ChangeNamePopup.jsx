import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import './ChangePopup.css';

export default function ChangeNamePopup({ userId, onClose, onNameChange }) {
  const [name, setName] = useState('');
  const [nameValid, setNameValid] = useState(true);

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    const trimmedLength = value.trim().length;
    setNameValid(trimmedLength > 0 && value.length <= 8);
  };

  const handleSubmit = () => {
    if (!nameValid) return;

    const token = localStorage.getItem('token'); // JWT 토큰 가져오기

    fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me/name?userId=${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // 토큰 포함
      },
      body: JSON.stringify({ name }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('이름 변경 실패');
        return res.json();
      })
      .then(() => {
        alert('이름 변경 완료');
        onNameChange(name); // 상태 반영
        onClose();
      })
      .catch(() => alert('변경 실패'));
  };

  return (
    <div className="popup-dim">
      <div className="popup-box">
        <IoClose className="popup-close" onClick={onClose} />
        <h3>이름 변경</h3>

        <input
          type="text"
          value={name}
          placeholder="새 이름"
          onChange={handleNameChange}
        />
        {!nameValid && name.length > 0 && (
          <div className="errorMessageWrap">이름은 공백 포함 8자 이하로 입력해주세요.</div>
        )}

        <button onClick={handleSubmit} disabled={!nameValid}>
          변경
        </button>
      </div>
    </div>
  );
}


