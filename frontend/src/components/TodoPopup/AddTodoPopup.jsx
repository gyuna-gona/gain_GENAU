import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './TodoPopup.css';

const AddTodoPopup = ({ 
  newTodo, 
  teamMembers, 
  onChange, 
  onAdd, 
  onClose,
}) => {
  const [customFileFormat, setCustomFileFormat] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 }); 
  const toggleRef = useRef(null); 

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'fileForm') {
      if (value === '기타') {
        setShowCustomInput(true);
        setCustomFileFormat('');
        onChange({ ...newTodo, fileForm: '' });
      } else {
        setShowCustomInput(false);
        setCustomFileFormat('');
        onChange({ ...newTodo, fileForm: value });
      }
      return;
    }

    onChange({ ...newTodo, [name]: value });
  };

  const handleCustomFormatChange = (e) => {
    const value = e.target.value.toUpperCase();
    setCustomFileFormat(value);
    onChange({ ...newTodo, fileForm: value });
  };

  const handleAssigneeToggle = (userId) => {
    const selected = newTodo.assignees || [];
    if (selected.includes(userId)) {
      onChange({ ...newTodo, assignees: selected.filter(id => id !== userId) });
    } else {
      onChange({ ...newTodo, assignees: [...selected, userId] });
    }
  };

  // 드롭다운 위치 계산
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

  const handleSubmit = () => {
    if (!newTodo.title?.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!newTodo.date) {
      alert('마감일을 선택해주세요.');
      return;
    }

    if (!newTodo.content?.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    if (showCustomInput && !customFileFormat.trim()) {
      alert('파일 형식을 입력해주세요.');
      return;
    }

    onAdd();
  };

  // 드롭다운 내부 요소
  const dropdownMenu = showAssigneeDropdown ? createPortal(
    <div
      className="assignee-dropdown-menu"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        maxHeight: 'calc(3 * 2.4em)', // 3개까지만 표시
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
        const selected = newTodo.assignees?.includes(String(m.userId));
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
  ) : null;

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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className='todo-popup add-todo'
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ alignSelf: 'flex-start', marginBottom: '0.5vw' }}>할 일 추가</h3>

        {/* 제목 + 마감일 */}
        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="title">제목</label>
            <input
              id="title"
              name="title"
              placeholder="제목을 입력하세요"
              value={newTodo.title || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group half">
            <label htmlFor="date">마감일</label>
            <input
              id="date"
              name="date"
              type="date"
              value={newTodo.date || ""}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* 내용 */}
        <div className="form-group" style={{ width: '100%' }}>
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            name="content"
            placeholder="내용을 입력하세요"
            value={newTodo.content || ""}
            onChange={handleChange}
            rows={4}
            required
          />
        </div>

        {/* 담당자 + 파일 형식 */}
        <div className="form-row">
          {/* 담당자 */}
          <div className="form-group half" style={{ position: 'relative' }}>
            <label>담당자</label>
            <div
              ref={toggleRef} //  위치 계산용 ref
              className={`assignee-dropdown-toggle ${showAssigneeDropdown ? 'open' : ''}`}
              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
            >
              {newTodo.assignees && newTodo.assignees.length > 0
                ? newTodo.assignees
                    .map(id => teamMembers.find(m => String(m.userId) === id)?.userName)
                    .filter(Boolean)
                    .join(', ')
                : '담당자 지정 안함'}
            </div>
          </div>

          {/* 파일 형식 */}
          <div className="form-group half">
            <label htmlFor="fileForm">요구 파일 형식</label>
            <select
              id="fileForm"
              name="fileForm"
              value={showCustomInput ? "기타" : newTodo.fileForm || ""}
              onChange={handleChange}
            >
              <option value="">파일 형식 지정 안함</option>
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX (Word 문서)</option>
              <option value="XLSX">XLSX (Excel 문서)</option>
              <option value="PPTX">PPTX (PowerPoint 문서)</option>
              <option value="JPG">JPG (이미지)</option>
              <option value="PNG">PNG (이미지)</option>
              <option value="GIF">GIF (이미지)</option>
              <option value="TXT">TXT (텍스트)</option>
              <option value="기타">기타 (직접 입력)</option>
            </select>

            {showCustomInput && (
              <div className="custom-format-input">
                <input
                  type="text"
                  placeholder="파일 확장자 입력 (예: PDF, DOCX)"
                  value={customFileFormat}
                  onChange={handleCustomFormatChange}
                  style={{ marginTop: "8px" }}
                />
                <small style={{ display: "block", marginTop: "4px", color: "#666" }}>
                  확장자만 입력하세요 (점 없이, 예: PDF, DOCX, JPG)
                </small>
              </div>
            )}
          </div>
        </div>

        {/* 버튼 */}
        <div className="popup-buttons">
          <button className="btn-cancel" onClick={onClose}>취소</button>
          <button className="btn-submit" onClick={handleSubmit}>등록</button>
        </div>
      </div>

      {/* 드롭다운을 팝업 외부로 렌더링 */}
      {dropdownMenu}
    </div>
  );

  return createPortal(popupContent, document.body);
};

export default AddTodoPopup;