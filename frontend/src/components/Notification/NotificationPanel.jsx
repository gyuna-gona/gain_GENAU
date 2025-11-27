import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import NotificationCard from './NotificationCard';
import './NotificationPanel.css';

const NotificationPanel = ({ userId, onClose, onCountUpdate }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const panelRef = useRef(null);
  const socketRef = useRef(null); //websocket ref 추가

  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem('token');

  // 웹소켓 연결 및 실시간 카운트 업데이트
  useEffect(() => {
    // 웹소켓 연결
    const socket = new WebSocket('ws://localhost:8080/ws/notifications');
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('알림 웹소켓 연결 성공');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'NOTIFICATION_COUNT_UPDATED' && 
            message.userId === userId) {
          console.log('알림 카운트 업데이트:', message.unreadCount);
          
          // 부모 컴포넌트의 카운트 업데이트
          if (onCountUpdate) {
            onCountUpdate(message.unreadCount);
          }
        }
      } catch (error) {
        console.error('알림 메시지 파싱 오류:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('알림 웹소켓 오류:', error);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [userId, onCountUpdate]);

  // 알림 가져오기
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/notifications?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('알림 불러오기 실패');
        return res.json();
      })
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId, API_BASE, token]);

  // 패널 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleDelete = async (id) => {
  try {
    await fetch(`${API_BASE}/notifications/${id}?userId=${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // 로컬 상태 즉시 업데이트 (웹소켓과 이중 보장)
    setItems((prev) => {
      const newItems = prev.filter((n) => n.noticeId !== id);
      
      // 삭제된 알림이 읽지 않은 알림이었다면 카운트 감소
      const deletedItem = prev.find(n => n.noticeId === id);
      if (deletedItem && !deletedItem.isRead && onCountUpdate) {
        const newUnreadCount = newItems.filter(item => !item.isRead).length;
        onCountUpdate(newUnreadCount);
      }
      
      return newItems;
    });
    
    console.log('알림 삭제 완료:', id);
  } catch (e) {
    console.error('삭제 실패', e);
  }
};

  const handleMarkRead = async (id) => {
  try {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setItems((prev) =>
      prev.map((n) => (n.noticeId === id ? { ...n, isRead: true } : n))
    );
    
    // 부모 컴포넌트에 즉시 반영 (웹소켓과 이중 보장)
    if (onCountUpdate) {
      const newCount = items.filter(n => n.noticeId !== id && !n.isRead).length;
      onCountUpdate(newCount);
    }
  } catch (e) {
    console.error('읽음 표시 실패', e);
  }
};

  const handleMarkedAll = async () => {
    const unreadIds = items.filter((n) => !n.isRead).map((n) => n.noticeId);
    if (unreadIds.length === 0) return;

    try {
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`${API_BASE}/notifications/${id}/read`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      
      // 로컬 상태 업데이트
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('일괄 읽음 실패', e);
    }
  };

  const panel = (
    <div className="noti-overlay">
      <div className="noti-panel" ref={panelRef}>
        <div className="noti-header">
          <span className="noti-title">알림</span>
          <button
            className="btn-mark-all"
            onClick={handleMarkedAll}
            disabled={items.every((n) => n.isRead)}
          >
            모두 읽음
          </button>
        </div>

        {loading && <div className="noti-loading">로딩 중…</div>}
        {error && <div className="noti-error">에러: {error}</div>}
        {!loading && items.length === 0 && (
          <div className="noti-empty">새 알림이 없습니다.</div>
        )}

        <ul className="noti-list">
          {items.map((n) => (
            <NotificationCard
              key={n.noticeId}
              noticeId={n.noticeId}
              message={n.noticeMessage}
              createdAt={n.noticeCreated}
              isRead={n.isRead}
              onDelete={handleDelete}
              onMarkRead={handleMarkRead}
            />
          ))}
        </ul>
      </div>
    </div>
  );

  return ReactDOM.createPortal(panel, document.body);
};

export default NotificationPanel;

