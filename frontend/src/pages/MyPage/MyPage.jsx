import React, { useEffect, useState } from 'react';
import './MyPage.css';
import { IoClose } from 'react-icons/io5';
import { getColorForName } from '../../utils/colorUtils';
import ChangeProfileImagePopup from '../../components/Popup/ChangeProfileImagePopup';
import ChangeNamePopup from '../../components/Popup/ChangeNamePopup';
import ChangeEmailPopup from '../../components/Popup/ChangeEmailPopup';
import ChangePasswordPopup from '../../components/Popup/ChangePasswordPopup';

function MyPage() {
  const [user, setUser] = useState({ userName: '', email: '', profileImg: '' });
  const [popupType, setPopupType] = useState(null);
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!userId) return;
    fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setUser({
          userName: data.userName || '이름없음',
          email: data.email || '이메일없음',
          profileImg: data.profileImg || '',
        });
      })
      .catch(err => console.error('사용자 정보 로딩 실패:', err));
  }, [userId, token]);

  const handleLogout = () => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || '로그아웃 완료');
        localStorage.clear();
        window.location.href = '/login';
      })
      .catch(err => console.error('로그아웃 실패:', err));
  };

  const handleWithdraw = () => {
    if (!window.confirm('정말로 탈퇴하시겠습니까?')) return;
    fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/withdraw`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || '회원탈퇴 완료');
        localStorage.clear();
        window.location.href = '/signup';
      })
      .catch(err => console.error('회원탈퇴 실패:', err));
  };

  const handleDeleteProfileImage = () => {
    if (!window.confirm('프로필 이미지를 삭제하시겠습니까?')) return;
    fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me/image`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('프로필 이미지 삭제 실패');
        return res.json();
      })
      .then(() => {
        setUser(prev => ({ ...prev, profileImg: '' }));
      })
      .catch(err => {
        alert('프로필 이미지 삭제 실패');
        console.error(err);
      });
  };

  return (
    <div className="mypage-root">
      <div className="mypage-card">
        <div className="mypage-header">
          <strong className="mypage-title">내 계정</strong>
          <button className="mypage-close" onClick={() => window.history.back()}>
            <IoClose className="close-icon" />
          </button>
        </div>
        <div className="mypage-profile-row">
          <div className="mypage-profile-img-wrap">
            {user.profileImg ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}${user.profileImg}?t=${Date.now()}`}
                alt="profile"
                className="mypage-profile-img"
              />
            ) : (
              <div
                className="mypage-profile-img"
                style={{ backgroundColor: getColorForName(user.userName) }}
              >
                {user.userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="mypage-profile-maininfo">
            <div className="mypage-profile-name">{user.userName}</div>
            <div className="mypage-profile-email">{user.email}</div>
            <div className="mypage-profile-btns">
              <button className="mypage-profile-edit" onClick={() => setPopupType('image')}>
                프로필 이미지 변경
              </button>
              {user.profileImg && (
                <button
                  className="mypage-profile-edit delete"
                  onClick={handleDeleteProfileImage}
                >
                  프로필 이미지 삭제
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mypage-info-section">
          <div className="mypage-info-row">
            <span className="mypage-info-label">이름</span>
            <span className="mypage-info-value">{user.userName}</span>
            <button className="mypage-edit-btn" onClick={() => setPopupType('name')}>
              변경
            </button>
          </div>
          <div className="mypage-info-row">
            <span className="mypage-info-label">이메일</span>
            <span className="mypage-info-value">{user.email}</span>
            <button className="mypage-edit-btn" onClick={() => setPopupType('email')}>
              변경
            </button>
          </div>
          <div className="mypage-info-row">
            <span className="mypage-info-label">비밀번호</span>
            <span className="mypage-info-value">********</span>
            <button className="mypage-edit-btn" onClick={() => setPopupType('password')}>
              변경
            </button>
          </div>
        </div>

        <div className="mypage-manage-section">
          <button className="mypage-logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
          <button className="mypage-withdraw-btn" onClick={handleWithdraw}>
            회원탈퇴
          </button>
        </div>

        {popupType === 'image' && (
          <ChangeProfileImagePopup
            userId={userId}
            token={token}
            onClose={() => setPopupType(null)}
            onImageChange={(newUrl) =>
              setUser((prev) => ({
                ...prev,
                profileImg: newUrl,
              }))
            }
          />
        )}
        {popupType === 'name' && (
          <ChangeNamePopup
            userId={userId}
            token={token}
            onClose={() => setPopupType(null)}
            onNameChange={(newName) => setUser(prev => ({ ...prev, userName: newName }))}
          />
        )}
        {popupType === 'email' && (
          <ChangeEmailPopup
            userId={userId}
            token={token}
            onClose={() => setPopupType(null)}
            onEmailChange={(newEmail) => setUser(prev => ({ ...prev, email: newEmail }))}
          />
        )}
        {popupType === 'password' && (
          <ChangePasswordPopup
            userEmail={user.email}
            token={token}
            onClose={() => setPopupType(null)}
          />
        )}
      </div>
    </div>
  );
}

export default MyPage;
