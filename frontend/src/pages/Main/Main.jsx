import React, { useEffect, useState, useRef } from 'react';
import './Main.css';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Popup from '../../components/Popup/Popup';
import MainIntro from '../../components/MainIntro/MainIntro';
import SidebarProfile from '../../components/SidebarProfile/SidebarProfile';
import TeamInfoPopup from '../../components/Popup/TeamProfilePopup';
import DetailTodoPopup from '../../components/TodoPopup/DetailTodoPopup';

function Main() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [user, setUser] = useState({ userName: '', profileImg: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [showTeamInfo, setShowTeamInfo] = useState(false);
  const [teamInfo, setTeamInfo] = useState(null);
  const [categoryColorMap, setCategoryColorMap] = useState({});
  const [selectedTodo, setSelectedTodo] = useState(null);
  //const [selectedFile, setSelectedFile] = useState(null);

  const nav = useNavigate();
  const userId = Number(localStorage.getItem('userId') || 0);
  const token = localStorage.getItem('token');
  const hasInitialized = useRef(false);
  //const fileInputRef = useRef(null);

  const generateConsistentColor = (seed) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const hue = Math.abs(hash) % 360;
    const saturation = 20 + (Math.abs(hash) % 21);
    const lightness = 70 + (Math.abs(hash) % 21);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const getConsistentColor = (name) => {
    if (categoryColorMap[name]) {
      return categoryColorMap[name];
    }
    const newColor = generateConsistentColor(name);
    setCategoryColorMap(prev => ({
      ...prev,
      [name]: newColor
    }));
    return newColor;
  };

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  const fetchTeams = async () => {
    if (!token || !userId) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teams/my-teams`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          nav('/login');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('팀 목록 불러오기 실패:', error);
      setTeams([]);
    }
  };

  const fetchUser = async () => {
    if (!token || !userId) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          nav('/login');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setUser({ userName: data.userName, profileImg: data.profileImg });
    } catch (error) {
      console.error('사용자 정보 불러오기 실패:', error);
    }
  };

  const fetchTeamInfo = async (teamId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teams/${teamId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          nav('/login');
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setTeamInfo(data);
      setShowTeamInfo(true);
    } catch (err) {
      console.error('팀 정보 로딩 실패:', err);
    }
  };

  const fetchTeamWeeklyTodos = async (teamId) => {
    if (!token || !teamId) {
      throw new Error('인증 정보 또는 팀 ID가 없습니다');
    }
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/todos/team/${teamId}/weekly`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        nav('/login');
        throw new Error('인증 실패');
      }
      throw new Error(`팀 ${teamId} 주간 할 일 불러오기 실패`);
    }
    return response.json();
  };

  const fetchAllTeamsWeeklyTodos = async () => {
    if (!teams.length) return [];
    try {
      const promises = teams.map(async (team) => {
        try {
          const todos = await fetchTeamWeeklyTodos(team.teamId);
          return {
            teamId: team.teamId,
            teamName: team.teamName,
            todos: todos || []
          };
        } catch (error) {
          console.error(`팀 ${team.teamName} 할 일 조회 실패:`, error);
          return {
            teamId: team.teamId,
            teamName: team.teamName,
            todos: []
          };
        }
      });
      const results = await Promise.all(promises);
      return results.filter(result => result.todos.length > 0);
    } catch (error) {
      console.error('전체 팀 할 일 조회 실패:', error);
      return [];
    }
  };

  const {
    data: weeklyTodos = [],
    isLoading: weeklyLoading,
    error: weeklyError,
    refetch: refetchWeeklyTodos,
  } = useQuery({
    queryKey: ['allTeamsWeeklyTodos', teams.map(t => t.teamId).join(',')],
    queryFn: fetchAllTeamsWeeklyTodos,
    enabled: teams.length > 0 && Boolean(token),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const initializeData = async () => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    setIsLoading(true);
    await Promise.all([fetchTeams(), fetchUser()]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!token || !userId) {
      nav('/login');
      return;
    }
    initializeData();
  }, []);

  const handleCreated = () => {
    hasInitialized.current = false;
    fetchTeams();
    refetchWeeklyTodos();
  };

  const handleTeamRightClick = (e, teamId) => {
    e.preventDefault();
    fetchTeamInfo(teamId);
  };

  const handleUpdateOrDelete = (action, data) => {
    if (action === 'update') {
      fetchTeams();
    } else if (action === 'delete' || action === 'leave') {
      fetchTeams();
    }
    setShowTeamInfo(false);
  };

  const handleCloseModal = () => {
    setSelectedTodo(null);
    refetchWeeklyTodos();
  };

  const getMemberName = (ids) => {
    return Array.isArray(ids) ? ids.join(', ') : ids;
  };

  const hasTeams = teams.length > 0;

  if (isLoading) {
    return (
      <div className="main-background">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#666'
        }}>
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <SidebarProfile
      teams={teams}
      userName={user.userName}
      userProfileImg={user.profileImg}
      activeTeamId={null}
      onTeamClick={(teamId) => nav(`/team/${teamId}`)}
      onMainClick={() => nav('/Main')}
      onPlusClick={() => setIsPopupOpen(true)}
      onContextMenu={handleTeamRightClick}
    >
      {hasTeams ? (
        <div className="team-boards-container">
          <h2 className="main-title">이번 주 내 할 일</h2>
          {weeklyLoading && <div className="loading-message">할 일 로딩 중...</div>}
          {weeklyError && (
            <div className="error-message">
              할 일 불러오기 오류: {weeklyError.message}
            </div>
          )}
          {!weeklyLoading && !weeklyError && (
            <div className="team-boards-grid-wrapper">
              <div className="team-boards-grid">
                {weeklyTodos.length ? (
                  weeklyTodos.map(({ teamId, teamName, todos }) => {
                    // 먼저 내가 담당자인 할 일만 필터링
                    const myTodos = todos.filter((todo) => {
                      return (
                        Array.isArray(todo.assignees) &&
                        todo.assignees.some((id) => String(id) === String(userId))
                      );
                    });

                    if (!myTodos || myTodos.length === 0) return null;

                    return (
                      <div key={teamId} className="team-board">
                        <div className="team-board-header">
                          <h3 className="team-board-title">{teamName}</h3>
                          {/* 전체 개수 대신 내 할 일 개수로 표시 */}
                          <span className="todo-count">{myTodos.length}건</span>
                        </div>
                        <div className="team-board-content">
                          <ul className="board-todo-list">
                            {/* todo.map 대신 필터링된 myTodos.map 사용하기 */}
                            {myTodos.map((todo) => (
                              <li key={todo.todoId} className="board-todo-item">
                                <div className="todo-item-header">
                                  <span
                                    className="todo-category"
                                    style={{
                                      backgroundColor: getConsistentColor(
                                        todo.catName || todo.categoryName
                                      ),
                                    }}
                                  >
                                    {todo.catName || todo.categoryName}
                                  </span>
                                  <span className="todo-due-date">
                                    {new Date(todo.dueDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="todo-item-content">
                                  <h4 className="todo-item-title">{todo.todoTitle}</h4>
                                </div>
                                <div className="todo-item-actions">
                                  <button
                                    className="file-submit-btn"
                                    onClick={() => {
                                      setSelectedTodo({ ...todo, teamName: teamName });
                                    }}
                                  >
                                    파일 제출 {todo.fileForm ? `(${todo.fileForm})` : ''}
                                  </button>
                                  {todo.uploadedFilePath && (
                                    <span className="file-uploaded-indicator">
                                      ✅ 제출완료
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-teams-message">
                    <p>할 일이 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <MainIntro onClick={() => setIsPopupOpen(true)} />
      )}

      {selectedTodo && (
        <DetailTodoPopup
          detailTodo={selectedTodo}
          onClose={handleCloseModal}
          currentUserId={userId}
          onRefreshDetail={refetchWeeklyTodos}
          getMemberName={getMemberName}
          teamName={selectedTodo.teamName}
        />
      )}

      {/* 팀 생성 팝업 */}
      {isPopupOpen && (
        <Popup
          onClose={() => setIsPopupOpen(false)}
          onTeamCreated={handleCreated}
        />
      )}

      {/* 팀 정보 팝업 */}
      {showTeamInfo && teamInfo && (
        <TeamInfoPopup
          teamInfo={teamInfo}
          currentUserId={userId}
          onClose={() => setShowTeamInfo(false)}
          onUpdatedOrDeleted={handleUpdateOrDelete}
        />
      )}
    </SidebarProfile>
  );
}

export default Main;


