import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { IoClose } from 'react-icons/io5';
import './AcceptInvitation.css';

function AcceptInvitation() {
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [teamId, setTeamId] = useState(null);
  const navigate = useNavigate();

  // 1. 처음 초대 링크 접근 시만 localStorage 비우고 로그인 리디렉트
  useEffect(() => {
    const token = params.get('token');
    const justCleared = sessionStorage.getItem('justCleared');
    if (!justCleared) {
      localStorage.clear();
      sessionStorage.setItem('justCleared', 'true');
      if (!token) {
        setError('유효하지 않은 접근입니다.');
        setLoading(false);
        return;
      }
      setError('로그인이 필요합니다. 다시 로그인해 주세요.');
      setLoading(false);
      setTimeout(() => {
        navigate(`/login?token=${token}`, { replace: true });
      }, 2000);
      return;
    }
    // 로그인 후 돌아온 경우에는 localStorage를 비우지 않음
  }, [params, navigate]);

  // 2. 로그인 후 돌아왔을 때만 초대 토큰 검증
  useEffect(() => {
    const token = params.get('token');
    const userId = localStorage.getItem('userId');
    const jwt = localStorage.getItem('token');
    if (!token || !userId || !jwt) return;

    const fetchValidation = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/invitations/validate?token=${token}`);
        const data = await res.json();
        if (!res.ok || !data.valid) {
          throw new Error('초대 링크가 만료되었거나 이미 사용되었습니다.');
        }
        setTeamId(data.teamId);
        setUserName(data.email);
        //setInvitationEmail(data.email); // 초대받은 이메일 저장
        setTeamName(data.teamName);
        setTeamDesc(data.teamDesc);
        setError('');
      } catch (err) {
        setError('유효성 확인 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchValidation();
  }, [params]);

  // 3. 초대 수락 후에만 팀 정보 조회
  const fetchTeamInfo = async (teamId) => {
    try {
      const teamRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teams/${teamId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!teamRes.ok) throw new Error('팀 정보를 불러오는 데 실패했습니다.');
      const teamData = await teamRes.json();
      setTeamName(teamData.teamName);
      setTeamDesc(teamData.teamDesc);
    } catch (err) {
      console.error('[TEAM INFO ERROR]', err);
      setError('팀 정보 조회 중 오류가 발생했습니다.');
    }
  };

  // 4. 초대 수락 핸들러
  const handleAccept = async () => {
    const token = params.get('token');
    const userId = localStorage.getItem('userId');
  
    if (!userId) {
      setError('로그인이 필요합니다. 다시 로그인해 주세요.');
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/invitations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ token, userId }),
      });

      if (!res.ok) {
        throw new Error("메일 전송에 실패했습니다."); 
      }

      await fetchTeamInfo(teamId);

      setAccepted(true);
      setShowWelcome(true);
      sessionStorage.removeItem('justCleared');
    } catch (err) {
      console.error('[ACCEPT ERROR]', err);
      setError('초대 수락에 실패했습니다. 다시 시도해주세요.');  // ← 여기!
    }
  };


  // 5. UI 렌더링
  return (
    <div className={`accept-wrapper${accepted && showWelcome ? ' dim-background' : ''}`}>
      <div className="accept-box">
        {/* X버튼을 팝업 박스 기준에 고정 */}
        {accepted && showWelcome && (
          <button className="welcome-close-fixed" onClick={() => {
            setShowWelcome(false);
            navigate(`/team/${teamId}`);
          }}
            aria-label="닫기"
          >
            <IoClose />
          </button>
        )}
        
        {loading ? (
          <p className="accept-message">유효성 확인 중...</p>
        ) : error ? (
          <p className="accept-error">❌ {error}</p>
        ) : accepted && showWelcome ? (
          <div className="welcome-popup">
            <h3># <strong>{teamName}</strong>에 오신 걸 환영합니다!</h3>
            <p>{teamName}의 팀스페이스입니다.</p>
            <div className="welcome-desc">{teamDesc}</div>
          </div>
        ) : (
          <>
          <h2 className="accept-title">GENAU 팀 초대</h2>
          <p className="accept-message">
            <strong>{userName}</strong>님, <strong>{teamName}</strong>에 초대되었습니다.
          </p>
          <button className="accept-btn" onClick={handleAccept} disabled={!!error}>
            초대 수락하기
          </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AcceptInvitation;