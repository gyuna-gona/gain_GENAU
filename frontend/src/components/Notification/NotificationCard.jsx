import React from 'react';
import { LuX, LuCircleCheckBig } from 'react-icons/lu';
import './NotificationCard.css';

const NotificationCard =({
    noticeId,
    message,
    createdAt,
    isRead,
    onDelete,
    onMarkRead
}) => {
    return (
        <li className={`notification-card ${isRead ? 'read' : 'unread'}`}>
            <div className='noti-msg'>{message}</div>
            <div className="meta">
                <span className="time">
                    {new Date(createdAt).toLocaleString('ko-KR', {hour12:false})}
                </span>
                <div className='actions'>
                    {!isRead && (
                        <button
                            className='btn-mark-read'
                            onClick={() => onMarkRead(noticeId)}
                            title="읽음 표시"
                        >
                            <LuCircleCheckBig />
                        </button>
                    )}
                    <button
                        className='btn-delete'
                        onClick={() => onDelete(noticeId)}
                        title='삭제'
                    >
                        <LuX />
                    </button>
                </div>
            </div>
        </li>
    );
};

export default NotificationCard;