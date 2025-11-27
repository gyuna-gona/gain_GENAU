import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoPlus } from 'react-icons/go';
import { LuMenu } from 'react-icons/lu';
import { LuBell } from 'react-icons/lu';
import { FiSettings } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getColorForName } from '../../utils/colorUtils';
import NotificationPanel from '../Notification/NotificationPanel';
import './SidebarProfile.css';

export default function SidebarProfile({
  userName,
  userProfileImg,
  teams,
  onTeamClick,
  onMainClick,
  onPlusClick,
  onContextMenu,
  activeTeamId,
  children
}) {
  const [showNotification, setShowNotification] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teamSpaceOpen, setTeamSpaceOpen] = useState(true);
  const [realTimeCount, setRealTimeCount] = useState(0);
  const socketRef = useRef(null);
  const nav = useNavigate();

  // 안 읽은 알림 개수 가져오기 (초기값)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) return 0;
      return await res.json();
    },
    refetchOnWindowFocus: true,
    onSuccess: (count) => {
      setRealTimeCount(count);
    }
  });

  // 실시간 알림 개수 웹소켓 최신화 (UI 구조/클래스/props 등은 100% 동일)
  useEffect(() => {
    const userId = Number(localStorage.getItem('userId')) || 0;
    if (!userId) return;
    let socket;
    let reconnectTimer;
    const connect = () => {
      socket = new window.WebSocket('ws://localhost:8080/ws/notifications');
      socketRef.current = socket;
      socket.onopen = () => {};
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (
            message.type === 'NOTIFICATION_COUNT_UPDATED' &&
            message.userId === userId
          ) {
            setRealTimeCount(message.unreadCount);
          }
        } catch (e) {}
      };
      socket.onerror = () => {
        if (socket.readyState !== 1) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
      socket.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };
    };
    connect();
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  useEffect(() => {
    setRealTimeCount(unreadCount);
  }, [unreadCount]);

  return (
    <div className="sidebar-profile-layout">
      {/* 상단 바 */}
      <header className="top-bar">
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen((prev) => !prev)}
        >
          <LuMenu className="menu-icon"/>
        </button>
        <div className="top-bar-title"></div>
        <div className="top-bar-icons">
          <div style={{ position: 'relative', display: 'inline-block' }}>
          <div className="notification-icon-wrap" style={{ position: 'relative', display: 'inline-block' }}>
            <LuBell
              className="top-bar-icon"
              onClick={() => setShowNotification((p) => !p)}
            />
            {realTimeCount > 0 && (
              <span className="notification-badge">{realTimeCount}</span>
            )}
          </div>
            <FiSettings className="top-bar-icon" onClick={() => nav('/mypage')} />
          </div>
        </div>
      </header>

      <div className="sidebar-main-row">
        {/* 사이드바: 토글로 보임/숨김 */}
        {sidebarOpen && (
          <aside className="sidebar-bar">
            <div className="sidebar-bar-title">내 계정</div>
            <div
              className={`sidebar-bar-item${activeTeamId === null ? ' active' : ''}`}
              onClick={onMainClick}
            >
              <div className="sidebar-bar-icon-col">
                {userProfileImg ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}${userProfileImg}`}
                    alt="user profile"
                    className="sidebar-bar-profile-icon"
                  />
                ) : (
                  <div
                    className="sidebar-bar-profile-icon"
                    style={{ backgroundColor: getColorForName(userName) }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="sidebar-bar-label">{userName}</span>
            </div>

            <div
              className="sidebar-bar-section"
              onClick={() => setTeamSpaceOpen((prev) => !prev)}
            >
              <span className="sidebar-bar-section-label">팀스페이스</span>
              <span className={`sidebar-bar-toggle-arrow${teamSpaceOpen ? ' open' : ''}`}>▼</span>
            </div>

            {teamSpaceOpen && (
              <>
                <div className="sidebar-bar-item plus" onClick={onPlusClick}>
                  <div className="sidebar-bar-icon-col">
                    <div className="sidebar-bar-plus-icon">
                      <GoPlus />
                    </div>
                  </div>
                  <span className="sidebar-bar-label">팀 추가</span>
                </div>
                <div className="profile-scroll-outer">
                  <div className="profile-scroll">
                    {teams.map((t) => (
                      <div
                        className={`sidebar-bar-item${activeTeamId === t.teamId ? ' active' : ''}`}
                        key={t.teamId}
                        onClick={() => onTeamClick(t.teamId)}
                        onContextMenu={(e) => onContextMenu(e, t.teamId)}
                      >
                        <div className="sidebar-bar-icon-col">
                          {t.teamProfileImg ? (
                            <img
                              src={`${import.meta.env.VITE_API_BASE_URL}${t.teamProfileImg}`}
                              alt="team profile"
                              className="sidebar-bar-profile-icon"
                            />
                          ) : (
                            <div
                              className="sidebar-bar-profile-icon"
                              style={{ backgroundColor: getColorForName(t.teamName) }}
                            >
                              {t.teamName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="sidebar-bar-label">{t.teamName}</span>
                        {activeTeamId === t.teamId && (
                          <div className="bookmark-shape" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </aside>
        )}

        {/* 메인 작업 영역: 항상 사이드바 "옆"에 보임 */}
        <div className={`workspace${sidebarOpen ? '' : ' full'}`}>
          <div className="workspace-inner">
            {children}
          </div>
        </div>
      </div>

      {/* 알림 패널 */}
      {showNotification && (
        <div className="notification-panel-wrap">
          <NotificationPanel
            userId={Number(localStorage.getItem('userId')) || 0}
            onClose={() => setShowNotification(false)}
          />
        </div>
      )}
    </div>
  );
}