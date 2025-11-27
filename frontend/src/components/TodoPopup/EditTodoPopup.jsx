import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './TodoPopup.css';

const EditTodoPopup = ({ editTodo, teamMembers, onChange, onSave, onCancel }) => {
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const toggleRef = useRef(null); //  위치 계산용

  //  드롭다운 위치 계산
  useEffect(() => {
    if (showAssigneeDropdown && toggleRef.current) {
      const rect = toggleRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [showAssigneeDropdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...editTodo, [name]: value });
  };

  const handleAssigneeToggle = (userId) => {
    const selected = editTodo.assignees || [];
    if (selected.includes(userId)) {
      onChange({ ...editTodo, assignees: selected.filter(id => id !== userId) });
    } else {
      onChange({ ...editTodo, assignees: [...selected, userId] });
    }
  };

  // 드롭다운 메뉴 (포털)
  const dropdownMenu = showAssigneeDropdown
    ? createPortal(
        <div
          className="assignee-dropdown-menu"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            maxHeight: 'calc(3 * 2.4em)', //  3개까지만 표시
            overflowY: 'auto',
            overflowX: 'hidden',
            border: '1px solid #ccc',
            borderRadius: '0.6vw',
            backgroundColor: '#fff',
            zIndex: 100002,
            boxShadow: '0 0.4vw 1vw rgba(0,0,0,0.1)',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {teamMembers.map((m) => {
            const selected = editTodo.assignees?.includes(String(m.userId));
            return (
              <div
                key={m.userId}
                onClick={() => handleAssigneeToggle(String(m.userId))}
                style={{
                  padding: '6px 12px',
                  cursor: 'pointer',
                  backgroundColor: selected ? '#cce5ff' : 'transparent',
                  color: selected ? '#004085' : '#000',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.userName}
              </div>
            );
          })}
        </div>,
        document.body
      )
    : null;

  const popupContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className='todo-popup edit-todo'
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <h3 style={{ alignSelf: 'flex-start', marginBottom: '0.5vw' }}>할 일 수정하기</h3>

        {/* 제목 + 마감일 */}
        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="title">제목</label>
            <input
              id="title"
              name="title"
              placeholder="제목"
              value={editTodo.title || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group half">
            <label htmlFor="date">마감일</label>
            <input
              id="date"
              name="date"
              type="date"
              value={editTodo.date || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* 내용 */}
        <div className="form-group" style={{ width: '100%' }}>
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            name="content"
            placeholder="내용"
            value={editTodo.content || ""}
            onChange={handleChange}
            rows={4}
          />
        </div>

        {/* 담당자 + 파일 형식 */}
        <div className="form-row">
          {/* 담당자 */}
          <div className="form-group half" style={{ position: 'relative' }}>
            <label>담당자</label>
            <div
              ref={toggleRef}
              className={`assignee-dropdown-toggle ${showAssigneeDropdown ? 'open' : ''}`}
              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
            >
              {editTodo.assignees && editTodo.assignees.length > 0
                ? editTodo.assignees
                    .map(id => teamMembers.find(m => String(m.userId) === id)?.userName)
                    .filter(Boolean)
                    .join(', ')
                : '담당자 지정 안함'}
            </div>
          </div>

          {/* 파일 형식 */}
          <div className="form-group half">
            <label htmlFor="fileForm">파일 형식</label>
            <select
              id="fileForm"
              name="fileForm"
              value={editTodo.fileForm || ""}
              onChange={handleChange}
            >
              <option value="">파일 형식 지정 안함</option>
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX</option>
              <option value="XLSX">XLSX</option>
              <option value="PPTX">PPTX</option>
              <option value="JPG">JPG</option>
              <option value="PNG">PNG</option>
              <option value="GIF">GIF</option>
              <option value="TXT">TXT</option>
              <option value="기타">기타</option>
            </select>
          </div>
        </div>

        {/* 버튼 */}
        <div className="popup-buttons">
          <button className="btn-cancel" onClick={onCancel}>취소</button>
          <button className="btn-submit" onClick={onSave}>저장</button>
        </div>
      </div>

      {/* 포털로 띄운 드롭다운 */}
      {dropdownMenu}
    </div>
  );

  return createPortal(popupContent, document.body);
};

export default EditTodoPopup;
