import React, { useState, useEffect } from 'react';
import './Popup.css';
import { useNavigate } from 'react-router-dom';
import { IoClose } from 'react-icons/io5';

function Popup({ onClose, onTeamCreated }) {
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [userId, setUserId] = useState(null);
  const [nameError, setNameError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    if (storedId && !isNaN(storedId)) {
      setUserId(Number(storedId));
    } else {
      alert('로그인이 필요합니다.');
    }
  }, []);

  const handleNameChange = (e) => {
    const value = e.target.value;
    setTeamName(value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!userId || !teamName.trim()) {
      alert('팀 이름과 사용자 정보가 필요합니다.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          teamName: teamName.trim(),
          teamDesc: teamDescription.trim(),
          teamProfileImg: ''
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (onTeamCreated) onTeamCreated(data);
        onClose();
        navigate(`/team/${data.teamId}`);
      } else {
        alert(data.message || data.error || '팀 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('팀 생성 중 예외 발생:', err);
      alert('서버 오류가 발생했습니다.');
    }
  };

  return (
    <div className="popup-dim">
      <div className="popup-wrapper">
        <div className="popup-container">
          <button className="close-icon-btn" onClick={onClose}>
            <IoClose />
          </button>
          <div className="popup-header">
            <h2>팀 스페이스 생성</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="popup-content">
              <div className="input-group">
                <label htmlFor="teamName">팀 이름:</label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={handleNameChange}
                  required
                />
                {nameError && <div className="error-msg">{nameError}</div>}
              </div>
              <div className="input-group">
                <label htmlFor="teamDescription">상세 설명:</label>
                <textarea
                  id="teamDescription"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="submit-btn">팀 생성</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Popup;

