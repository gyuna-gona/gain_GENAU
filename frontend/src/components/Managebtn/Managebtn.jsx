import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; 
import { useQueryClient } from '@tanstack/react-query';
import './Managebtn.css';

const API_BASE = 'http://localhost:8080';

const Managebtn = ({ teamId, menuItems, setMenuItems }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [listToDelete, setListToDelete] = useState(null);
  const [listToRename, setListToRename] = useState(null);

  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!teamId) return;
    fetchCategories();
  }, [teamId]);

  const fetchCategories = () => {
    fetch(`${API_BASE}/teams/${teamId}/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setMenuItems(data))
      .catch((err) => console.error('목록 불러오기 실패:', err));
  };

  const handleAddList = () => {
    if (!newListName.trim()) return;

    fetch(`${API_BASE}/teams/${teamId}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ catName: newListName }),
    })
      .then((res) => res.json())
      .then(() => {
        setNewListName('');
        setIsPopupOpen(false);
        fetchCategories();
        queryClient.invalidateQueries(['todos', teamId]);
      })
      .catch((err) => console.error('목록 추가 실패:', err));
  };

  const handleDeleteList = () => {
    fetch(`${API_BASE}/teams/${teamId}/categories/${listToDelete.catId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(() => {
        setIsDeleteConfirmOpen(false);
        setListToDelete(null);
        fetchCategories();
        queryClient.invalidateQueries(['todos', teamId]);
      })
      .catch((err) => console.error('삭제 실패:', err));
  };

  const handleRenameList = () => {
    if (!newListName.trim()) return;

    fetch(`${API_BASE}/teams/${teamId}/categories/${listToRename.catId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ catName: newListName }),
    })
      .then(() => {
        setIsRenameOpen(false);
        setNewListName('');
        setListToRename(null);
        fetchCategories();
        queryClient.invalidateQueries(['todos', teamId]);
      })
      .catch((err) => console.error('이름 변경 실패:', err));
  };

  // Portal로 렌더링할 팝업 컴포넌트
  const renderPopup = (content) => {
    return createPortal(
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsPopupOpen(false);
            setIsDeleteConfirmOpen(false);
            setIsRenameOpen(false);
          }
        }}
      >
        <div 
          className="popup-container"
          style={{ zIndex: 100000 }}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      {isOpen && <div className="accordion-overlay" onClick={() => setIsOpen(false)} />}

      <div
        className={`accordion-container ${isOpen ? 'show' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isOpen && (
          <>
            {Array.isArray(menuItems) &&
              menuItems.map((item, index) => (
                <div className="accordion-item" key={item.catId}>
                  <div
                    className="accordion-title"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    {openIndex === index ? '▼' : '▶'} {item.catName}
                  </div>
                  {openIndex === index && (
                    <div className="accordion-content">
                      <div
                        className="accordion-link"
                        onClick={() => {
                          setListToRename(item);
                          setIsRenameOpen(true);
                          setNewListName(item.catName);
                        }}
                      >
                        목록 이름 변경
                      </div>
                      <div
                        className="accordion-link delete"
                        onClick={() => {
                          setListToDelete(item);
                          setIsDeleteConfirmOpen(true);
                        }}
                      >
                        목록 삭제
                      </div>
                    </div>
                  )}
                </div>
              ))}
            <div className="accordion-add" onClick={() => setIsPopupOpen(true)}>
              + 목록 추가하기
            </div>
          </>
        )}
      </div>

      {/* Portal로 렌더링되는 팝업들 */}
      {isPopupOpen && renderPopup(
        <>
          <h3>목록 추가</h3>
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="목록 이름을 입력하세요"
          />
          <div className="popup-buttons">
            <button onClick={handleAddList}>추가</button>
            <button onClick={() => setIsPopupOpen(false)}>취소</button>
          </div>
        </>
      )}

      {isDeleteConfirmOpen && renderPopup(
        <>
          <h3>정말 삭제합니까?</h3>
          <div className="popup-buttons">
            <button onClick={handleDeleteList}>확인</button>
            <button onClick={() => setIsDeleteConfirmOpen(false)}>취소</button>
          </div>
        </>
      )}

      {isRenameOpen && renderPopup(
        <>
          <h3>목록 이름 변경</h3>
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="새 목록 이름을 입력하세요"
          />
          <div className="popup-buttons">
            <button onClick={handleRenameList}>완료</button>
            <button onClick={() => setIsRenameOpen(false)}>취소</button>
          </div>
        </>
      )}

      <button className="menu-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        목록 관리하기
      </button>
    </>
  );
};

export default Managebtn;

