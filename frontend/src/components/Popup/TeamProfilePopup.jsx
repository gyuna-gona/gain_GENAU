import React, { useState } from 'react';
import './TeamProfilePopup.css';
import { getColorForName } from '../../utils/colorUtils';
import { IoTrashOutline } from 'react-icons/io5';

function TeamProfilePopup({ teamInfo, currentUserId, onClose, onUpdatedOrDeleted }) {
  const isManager = currentUserId === teamInfo.userId;
  const [name, setName] = useState(teamInfo.teamName);
  const [desc, setDesc] = useState(teamInfo.teamDesc);
  const [img, setImg] = useState(teamInfo.teamProfileImg);
  const [isUploading, setIsUploading] = useState(false);
  const token = localStorage.getItem('token');

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teams/${teamInfo.teamId}/profile-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const imageUrl = data.teamProfileImg;
        setImg(imageUrl);
        alert('프로필 이미지가 업데이트되었습니다.');
      } else {
        const errorText = await res.text();
        alert('이미지 업로드 실패: ' + errorText);
      }
    } catch (err) {
      console.error('이미지 업로드 중 오류:', err);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProfileImage = async () => {
    if (!window.confirm('팀 프로필 이미지를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teams/${teamInfo.teamId}/profile-image`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setImg('');
        alert('프로필 이미지가 삭제되었습니다.');
      } else {
        const errorText = await res.text();
        alert('삭제 실패: ' + errorText);
      }
    } catch (err) {
      alert('프로필 이미지 삭제 중 오류가 발생했습니다.');
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      alert('팀 이름을 입력해주세요.');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teams/${teamInfo.teamId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamName: name,
          teamDesc: desc,
        }),
      });

      if (res.ok) {
        alert('팀 정보가 수정되었습니다.');
        onUpdatedOrDeleted('update', { ...teamInfo, teamName: name, teamDesc: desc, teamProfileImg: img });
        onClose();
      } else {
        const errorText = await res.text();
        alert('수정 실패: ' + errorText);
      }
    } catch (err) {
      console.error('수정 중 오류:', err);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('정말 이 팀에서 나가시겠습니까?')) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teams/${teamInfo.teamId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert('팀에서 나갔습니다.');
        onUpdatedOrDeleted('leave', teamInfo.teamId);
        onClose();
      } else {
        const errorText = await res.text();
        alert('실패: ' + errorText);
      }
    } catch (err) {
      console.error('나가기 오류:', err);
      alert('나가기 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 이 팀을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teams/${teamInfo.teamId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert('팀이 삭제되었습니다.');
        onUpdatedOrDeleted('delete', teamInfo.teamId);
        onClose();
      } else {
        const errorText = await res.text();
        alert('삭제 실패: ' + errorText);
      }
    } catch (err) {
      console.error('삭제 오류:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 프로필 이미지/이니셜 + 삭제 아이콘(프로필 오른쪽 위)
  const renderProfileImage = () => {
    const bgColor = getColorForName(name);
    const initial = name.charAt(0).toUpperCase();
    const imageUrl = img?.trim()
      ? (img.startsWith('/uploads') ? `${import.meta.env.VITE_API_BASE_URL}${img}` : img)
      : null;
    return (
      <div className="team-profile-img-wrapper">
        {img?.trim() ? (
          <img src={imageUrl} alt="profile" className="team-profile-img" />
        ) : (
          <div className="team-default-avatar" style={{ backgroundColor: bgColor }}>
            {initial}
          </div>
        )}
        {isManager && (
          <button
            className="team-profile-img-delete"
            title="프로필 삭제"
            onClick={handleDeleteProfileImage}
            disabled={isUploading}
          >
            <IoTrashOutline style={{ fontSize: '1.2rem' }} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="team-popup-dim">
      <div className="team-popup-box">
        <button className="popup-close" onClick={onClose}>×</button>
        {renderProfileImage()}
        {isManager && (
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isUploading}
            style={{ marginBottom: '1rem', display: 'block' }}
          />
        )}
        {isUploading && <p style={{ color: '#666', fontSize: '14px' }}>이미지 업로드 중...</p>}
        {isManager ? (
          <input className="team-name-input" value={name} onChange={e => setName(e.target.value)} />
        ) : (
          <div className="team-name-read">{name}</div>
        )}
        {isManager ? (
          <textarea className="team-desc-input" value={desc} onChange={e => setDesc(e.target.value)} />
        ) : (
          <div className="team-desc-read">{desc}</div>
        )}
        {isManager ? (
          <>
            <button className="team-save-btn" onClick={handleUpdate}>수정하기</button>
            <button className="team-delete-btn" onClick={handleDelete}>팀 스페이스 삭제</button>
          </>
        ) : (
          <button className="team-leave-btn" onClick={handleLeave}>팀 스페이스 나가기</button>
        )}
      </div>
    </div>
  );
}

export default TeamProfilePopup;
