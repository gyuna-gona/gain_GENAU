import React, { useState, useRef, useEffect } from 'react';
import { LuPencilLine, LuTrash } from 'react-icons/lu';
import './TodoCard.css';

const TodoCard = ({
    todo,
    currentUserId,
    onToggleChecked,
    onEdit,
    onDelete,
    onOpenDetail
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // 수정 권한: 생성자 또는 담당자
    const canEditTodo = () => {
        if (!currentUserId || !todo.creatorId) return false;
        const currentUserIdNum = Number(currentUserId);
        const creatorId = Number(todo.creatorId);

        // 생성자인 경우
        if (currentUserIdNum === creatorId) return true;

        // assignees 배열에서 현재 사용자 확인
        if (todo.assignees && Array.isArray(todo.assignees)) {
            return todo.assignees.some(id => Number(id) === currentUserIdNum);
        }

        return false;
    };

    // 삭제 권한: 생성자만
    const canDeleteTodo = () => {
        if (!currentUserId || !todo.creatorId) return false;
        const currentUserIdNum = Number(currentUserId);
        const creatorId = Number(todo.creatorId);
        return currentUserIdNum === creatorId;
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    const handleEdit = (e) => {
        e.stopPropagation();

        // 디버깅 로그 추가
        console.log('편집 버튼 클릭 - todo 객체 상세:', {
            todoId: todo.todoId,
            creatorId: todo.creatorId,
            assignees: todo.assignees,
            assigneeNames: todo.assigneeNames,
            currentUserId: currentUserId,
            canEdit: canEditTodo(),
            전체객체: todo
        });

        if (!canEditTodo()) {
            alert('이 할 일을 수정할 권한이 없습니다.\n(생성자 또는 담당자만 수정 가능)');
            return;
        }
        onEdit(todo);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (!canDeleteTodo()) {
            alert('이 할 일을 삭제할 권한이 없습니다.\n(생성자만 삭제 가능)');
            return;
        }
        if (window.confirm('정말로 이 할 일을 삭제하시겠습니까?')) {
            onDelete(todo.todoId);
        }
    };

    return (
        <div className="todo-row">
            <input
                type="checkbox"
                className="todo-checkbox"
                checked={todo.todoChecked}
                disabled={true} // 직접 체크/해제 불가
                onChange={(e) => onToggleChecked(todo.todoId, e.target.checked)}
            />

            <div className={`todo-card ${todo.todoChecked ? 'done' : ''}`}>
                <div className="card-body" onClick={() => onOpenDetail(todo)}>
                    <div className="todo-header">
                        <span className="todo-title">{todo.todoTitle}</span>
                        <span className="todo-date">{todo.dueDate}</span>
                    </div>
                    <div className="todo-content">{todo.todoDes}</div>
                </div>

                <div className="card-controls">
                    <button
                        className={`icon-button edit-btn ${!canEditTodo() ? 'disabled' : ''}`}
                        onClick={handleEdit}
                        title={canEditTodo() ? "수정하기 (생성자/담당자)" : "수정 권한 없음"}
                        disabled={!canEditTodo()}
                    >
                        <LuPencilLine size={13} />
                    </button>
                    <button
                        className={`icon-button delete-btn ${!canDeleteTodo() ? 'disabled' : ''}`}
                        onClick={handleDelete}
                        title={canDeleteTodo() ? "삭제하기 (생성자만)" : "삭제 권한 없음"}
                        disabled={!canDeleteTodo()}
                    >
                        <LuTrash size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TodoCard;
