import React, { useState, useEffect } from 'react';
import SidebarProfile from '../../components/SidebarProfile/SidebarProfile';
import InvitePopup from '../../components/Popup/InvitePopup';
import TeamInfoPopup from '../../components/Popup/TeamProfilePopup';
import Popup from '../../components/Popup/Popup';
import Managebtn from '../../components/Managebtn/Managebtn';
import TodoBoard from '../../components/TodoBoard/TodoBoard';
import TodoCalendar from '../../components/TodoCalendar/TodoCalendar';
import { IoFileTrayFullOutline } from 'react-icons/io5';
import { GoPeople } from 'react-icons/go';
import { FiUserPlus } from 'react-icons/fi';
import { IoMdCheckboxOutline } from "react-icons/io";
import { FaCrown } from 'react-icons/fa';
import { AiOutlineDelete, AiOutlineDownload } from 'react-icons/ai';
import { getColorForName } from '../../utils/colorUtils';
import { useParams, useNavigate } from 'react-router-dom';
import './TeamSpace.css';

function TeamSpace() {
  const [teams, setTeams] = useState([]);
  const [user, setUser] = useState({ id: null, userName: '', profileImg: '' });
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [panel, setPanel] = useState('todo');
  const [showTodoCalendar, setShowTodoCalendar] = useState(false);
  const [members, setMembers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteOnCreate, setInviteOnCreate] = useState(false);
  const [teamInfo, setTeamInfo] = useState(null);
  const [showTeamInfo, setShowTeamInfo] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [teamFiles, setTeamFiles] = useState([]);
  const [fileLoading, setFileLoading] = useState(false);

  const userId = user.id;
  const token = localStorage.getItem('token');
  const { teamId } = useParams();
  const nav = useNavigate();

  const getAuthHeaders = () => {
    // 1. 토큰이 null이 아닌지 확인하고,
    const tokenString = token || ''; 
    // 2. 'Bearer '가 이미 있는지 확인하여 한 번만 붙도록 보장
    const authToken = tokenString.startsWith('Bearer ') 
    ? tokenString 
    : `Bearer ${tokenString}`;
    
    return {
      'Authorization': authToken, // 수정된 authToken 사용
      'Accept': 'application/json'
    };
  };

  useEffect(() => {
    fetchTeams();
    fetchUser();
  }, []);

  useEffect(() => {
    if (panel === 'storage' && activeTeamId) {
      fetchTeamFiles(activeTeamId);
    }
  }, [panel, activeTeamId]);

  useEffect(() => {
    if (teamId) {
      const tid = Number(teamId);
      setActiveTeamId(tid);
      setPanel('todo');
      setShowTodoCalendar(false);
      fetchMembers(tid);
      fetchTeamInfo(tid);
    } else {
      setActiveTeamId(null);
    }
  }, [teamId]);

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teams/my-teams`, {
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
      setTeams(data);
    } catch (err) {
      setTeams([]);
    }
  };

  const fetchUser = async () => {
    try {
      // 3. 불필요한 쿼리 파라미터 제거 
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me`, {
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

      // 4. 응답받은 ID를 state에 저장
      setUser({ id: data.userId, userName: data.userName, profileImg: data.profileImg });
    } catch (err) {
      setUser({ id: null, userName: '', profileImg: '' });
    }
  };

  const fetchMembers = async (tid) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teams/${tid}/members`, {
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
      const sorted = data.sort((a, b) => (b.manager === true) - (a.manager === true));
      setMembers(sorted);
    } catch (err) {
        setMembers([]);
    }
  };

  const fetchTeamInfo = async (tid) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teams/${tid}`, {
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
    } catch (err) {
      setTeamInfo(null);
    }
  };

  const fetchTeamFiles = async (tid) => {
    setFileLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/storage/${tid}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        setTeamFiles([]);
        setFileLoading(false);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.files)) {
        setTeamFiles(data.files);
      } else if (Array.isArray(data)) {
        setTeamFiles(data);
      } else {
        setTeamFiles([]);
      }
    } catch (err) {
      setTeamFiles([]);
    }
    setFileLoading(false);
  };

  const handleDeleteFile = async (filename) => {
    if (!window.confirm('정말로 이 파일을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/storage/${activeTeamId}/delete?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTeamFiles(files => files.filter(f => f !== filename));
    } catch (err) {
      alert('파일 삭제 실패: ' + err.message);
    }
  };

  const handleDownloadFile = async (filename) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/storage/${activeTeamId}/download?filename=${encodeURIComponent(filename)}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('파일 다운로드 실패: ' + err.message);
    }
  };

  const handlePreviewFile = async (filename) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/storage/${activeTeamId}/download?filename=${encodeURIComponent(filename)}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      alert('파일 미리보기 실패: ' + err.message);
    }
  };

  const handleTodoFileChanged = () => {
    if (panel === 'storage' && activeTeamId) fetchTeamFiles(activeTeamId);
  };

  const handleTeamClick = (tid) => {
    if (activeTeamId === tid) return;
    setActiveTeamId(tid);
    // 팀 이동 시 모든 팝업/모달/패널 닫기
    setShowInvite(false);
    setInviteOnCreate(false);
    setShowTeamInfo(false);
    setIsPopupOpen(false);
    setPanel('todo');
    setShowTodoCalendar(false);
    fetchMembers(tid);
    fetchTeamInfo(tid);
  };

  const handleTeamRightClick = (e, tid) => {
    e.preventDefault();
    fetchTeamInfo(tid).then(() => setShowTeamInfo(true));
  };

  const handleTeamCreated = (team) => {
    fetchTeams();
    nav(`/team/${team.teamId}`);
    setTimeout(() => {
      setGuideStep(0);
      setShowGuide(true);
    }, 300);
  };

  const handleUpdateOrDelete = () => {
    fetchTeams();
    nav('/Main');
    setShowTeamInfo(false);
  };

  const handlePanelToggle = (panelKey) => {
    setPanel(panelKey);
    if (panelKey === 'invite') setShowInvite(true);
    if (panelKey !== 'todo') setShowTodoCalendar(false);
  };

  const handleInviteClose = () => {
    setShowInvite(false);
    setInviteOnCreate(false);
    setPanel('todo');
  };

  return (
    <div className="sidebar-profile-layout">
      <SidebarProfile
        teams={teams}
        userName={user.userName}
        userProfileImg={user.profileImg}
        onTeamClick={handleTeamClick}
        onMainClick={() => nav('/Main')}
        onPlusClick={() => setIsPopupOpen(true)}
        popupPosition="top-right"
        onContextMenu={handleTeamRightClick}
        activeTeamId={activeTeamId}
      >
        <div className="teamspace-simple">
          <nav className="teamspace-tabs">
            <button className={panel === 'todo' ? 'active' : ''} onClick={() => handlePanelToggle('todo')}>
              <IoMdCheckboxOutline className="teamspace-todo-icon"/>
              할 일 관리
            </button>
            <button className={panel === 'storage' ? 'active' : ''} onClick={() => handlePanelToggle('storage')}>
              <IoFileTrayFullOutline className="teamspace-menu-icon" />
              파일 스토리지
            </button>
            <button className={panel === 'members' ? 'active' : ''} onClick={() => handlePanelToggle('members')}>
              <GoPeople className="teamspace-menu-icon" />
              팀 멤버
            </button>
            <button className={panel === 'invite' ? 'active' : ''} onClick={() => handlePanelToggle('invite')}>
              <FiUserPlus className="teamspace-menu-icon" />
              멤버 초대
            </button>
          </nav>
        <div className="teamspace-content">
          {panel === 'todo' && (
            <>
            {!showTodoCalendar && (
              <div className="calendar-toggle-bar">
                <button
                className="calendar-slide-btn closed"
                onClick={() => setShowTodoCalendar(true)}
                aria-label="캘린더 열기"
                >
                  <span className="calendar-slide-text">캘린더 토글</span>
                  &gt;
                </button>
              </div>
            )}
            <div className="todo-calendar-flex">
              {showTodoCalendar && (
                <div className="calendar-wrap-with-btn">
                  <TodoCalendar
                    menuItems={menuItems}
                    teamId={activeTeamId}
                    userId={userId}
                  />
                  {/* 닫기 버튼: 달력 오른쪽에만 */}
                  <button
                    className="calendar-slide-btn calendar-close-btn"
                    onClick={() => setShowTodoCalendar(false)}
                    aria-label="캘린더 닫기"
                  >
                    &lt;
                  </button>
                </div>
              )}
              <div className="todo-board-wrap">
                <TodoBoard
                  teamId={activeTeamId}
                  userId={userId}
                  onFileChanged={handleTodoFileChanged}
                  teamName={teamInfo?.teamName}
                />
              </div>
            </div>    
            <Managebtn
              teamId={activeTeamId}
              menuItems={menuItems}
              setMenuItems={setMenuItems}
            />
          </>
          )}
          
          {panel === 'storage' && (
            <section>
              <h4 className="panel-title">팀 파일</h4>
              {fileLoading ? (
                <div className="file-loading">불러오는 중...</div>
              ) : teamFiles.length === 0 ? (
                <div className="file-empty">저장된 파일이 없습니다.</div>
              ) : (
                <ul className="file-list">
                  {teamFiles.map(filename => (
                    <li key={filename} className="file-list-item">
                      <span
                        className="file-name"
                        onClick={() => handlePreviewFile(filename)}
                        title="미리보기"
                      >
                        {filename}
                      </span>
                      <button
                        className="file-btn"
                        onClick={() => handleDownloadFile(filename)}
                        title="다운로드"
                      >
                        <AiOutlineDownload />
                      </button>
                      <button
                        className="file-btn file-delete-btn"
                        onClick={() => handleDeleteFile(filename)}
                        title="삭제"
                      >
                        <AiOutlineDelete />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {panel === 'members' && (
            <section>
              <h4 className="panel-title">팀 멤버</h4>
              <ul className="member-list">
                {members.map((m, idx) => (
                  <li key={idx} className="member-list-item">
                    <span className="member-profile-box" style={{ backgroundColor: getColorForName(m.userName) }}>
                      {m.profileImg ? (
                        <img
                          src={m.profileImg.startsWith('/uploads') ? `${import.meta.env.VITE_API_BASE_URL}${m.profileImg}` : m.profileImg}
                          alt="프로필"
                          className="member-profile-img"
                        />
                      ) : (
                        <span className="member-profile-default">{m.userName[0]}</span>
                      )}
                    </span>
                    <span className="member-name">
                      {m.userName} {m.manager && <FaCrown className="crown" />}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {panel === 'invite' && showInvite && (
            <section>
              <h4 className="panel-title">멤버 추가하기</h4>
              {teamInfo && (
                <InvitePopup
                  teamId={activeTeamId}
                  teamName={teamInfo.teamName}
                  onClose={handleInviteClose}                  
                />
              )}
            </section>
          )}
        </div>
      </div>
      {isPopupOpen && <Popup onClose={() => setIsPopupOpen(false)} onTeamCreated={handleTeamCreated} />}
      {(showInvite || inviteOnCreate) && teamInfo && (
        <InvitePopup teamId={activeTeamId} teamName={teamInfo.teamName} onClose={handleInviteClose} />
      )}
      {showTeamInfo && teamInfo && (
        <TeamInfoPopup
          teamInfo={teamInfo}
          currentUserId={userId}
          onClose={() => setShowTeamInfo(false)}
          onUpdatedOrDeleted={handleUpdateOrDelete}
        />
      )}
      </SidebarProfile>
    </div>
  );  
}

export default TeamSpace;

