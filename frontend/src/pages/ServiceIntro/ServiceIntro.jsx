import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './ServiceIntro.css';
import solutionTodoImg1 from '../../assets/solution-todo.png';
import solutionTodoImg2 from '../../assets/solution-todo2.png';
import solutionTodoImg3 from '../../assets/solution-todo3.png';
import solutionTodoImg4 from '../../assets/solution-todo4.png';
import solutionTodoImg5 from '../../assets/solution-todo5.png';
import solutionTodoImg6 from '../../assets/solution-todo6.png';
import solutionTeamImg1 from '../../assets/solution-team.png';
import solutionTeamImg2 from '../../assets/solution-team2.png';
import solutionTeamImg3 from '../../assets/solution-team3.png';
import solutionWeekImg1 from '../../assets/solution-week.png';
import solutionWeekImg2 from '../../assets/solution-week2.png';
import solutionFileImg1 from '../../assets/solution-file.png';
import solutionFileImg2 from '../../assets/solution-file2.png';
import solutionFileImg3 from '../../assets/solution-file3.png';
import solutionFileImg4 from '../../assets/solution-file4.png';
import solutionSecurityImg1 from '../../assets/solution-security.png';
import solutionSecurityImg2 from '../../assets/solution-security2.png';
import solutionSecurityImg3 from '../../assets/solution-security3.png';

const solutionList = [
  {
    title: '간편한 투두 관리',
    desc: '다양한 팀스페이스를 생성하고 원하는 목록을 생성하여 목록별로 할 일을 빠르고 쉽게 등록하고 관리하세요.',
    img: [
      solutionTodoImg1,
      solutionTodoImg2,
      solutionTodoImg3,
      solutionTodoImg4,
      solutionTodoImg5,
      solutionTodoImg6
    ],
    imgDesc: [
      '팀 추가 버튼을 통해 새로운 팀 스페이스 추가',
      '목록 관리 버튼으로 내 목적에 맞는 목록 추가',
      '목록 보드를 통해 팀 스페이스 내의 목록 확인',
      '목록보드 하단의 +버튼으로 투두 추가',
      '투두 클릭 시 상세 정보 열람 및 파일 제출 가능',
      '캘린더에서 투두의 마감일 확인'
    ]
  },
  {
    title: '팀 협업 지원',
    desc: '팀원들을 초대하고 소통하며 여러 사람들과 다양한 형태의 협업을 진행해 보세요.',
    img: [solutionTeamImg1, solutionTeamImg2, solutionTeamImg3],
    imgDesc: [
      '멤버 초대 버튼을 통해 팀원 초대',
      '이메일 기반 팀원 추가',
      '팀 멤버에서 팀원 확인'
    ]
  },
  {
    title: '이번 주 투두 확인',
    desc: '한 주내의 투두를 한번에 확인하고 관리할 수 있어요.',
    img: [solutionWeekImg1, solutionWeekImg2],
    imgDesc: [
      '메인에서 나의 이번 주 투두를 한번에 확인',
      '메인에서도 파일 관리 가능'
    ]
  },
  {
    title: '파일 업로드 및 관리',
    desc: '원하는 형식의 파일을 지정하고 제출하여 스토리지를 통해 파일을 확인하세요.',
    img: [solutionFileImg1, solutionFileImg2, solutionFileImg3, solutionFileImg4],
    imgDesc: [
      '투두 생성 시 제출 파일 지정',
      '형식에 맞는 파일 제출',
      '파일 형식 확인 및 자동 변환',
      '스토리지를 통한 파일 확인'
    ]
  },
  {
    title: '투두 접근 권한 관리',
    desc: '권한 지정을 통해 업무에 필요한 파일을 안전하게 공유하고 관리하세요.',
    img: [solutionSecurityImg1, solutionSecurityImg2, solutionSecurityImg3],
    imgDesc: [
      '담당자 지정을 통한 파일 제출자 제한',
      '권한 없는 사용자는 투두 수정/ 삭제 접근 차단',
      '담당자가 아닌 사용자는 파일 제출 불가'
    ]
  }
];

// 카드형 차별점/주요 서비스 데이터
const differentiators = [
  {
    icon: '💡',
    title: '실시간 협업',
    desc: '팀원과 동시에 작업하고 즉시 결과를 공유합니다.'
  },
  {
    icon: '🗂️',
    title: '팀 단위 투두·캘린더',
    desc: '팀별로 할 일과 일정을 한 번에 관리합니다.'
  },
  {
    icon: '🔒',
    title: '권한 기반 파일 제출',
    desc: '역할별로 파일 제출·수정 권한을 제어합니다.'
  },
  {
    icon: '📁',
    title: '자동 파일 변환·조회',
    desc: '제출 파일을 자동 변환하고 바로 확인할 수 있습니다.'
  }
];

export default function ServiceIntro() {
  const navigate = useNavigate();
  const sectionsRef = useRef([]);
  const [activeSolution, setActiveSolution] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.3 }
    );
    sectionsRef.current.forEach(section => {
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setCurrentSlide(0);
  }, [activeSolution]);

  const handleNextSlide = () => {
    if (currentSlide < solutionList[activeSolution].img.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };
  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="service-intro-container">
      <section className="intro-section fade-in-section" ref={el => (sectionsRef.current[0] = el)}>
        <h1>GENAU에 오신 것을 환영합니다!</h1>
        <p>
          <b>GENAU</b>는 <b>팀 단위의 투두 관리</b>에 최적화된 협업 플랫폼입니다.<br />
          팀원들과 함께 할 일을 공유하고, 진행 상황을 한눈에 파악하며<br />
          효율적으로 협업하세요.
        </p>
        <button className="login-button" onClick={handleLoginClick}>
          로그인하러 가기
        </button>
      </section>

      <section className="agenda-section fade-in-section" ref={el => (sectionsRef.current[1] = el)}>
        <div className="solution-layout">
          <div className="solution-list">
            {solutionList.map((item, idx) => (
              <div
                key={item.title}
                className={`solution-item${activeSolution === idx ? ' active' : ''}`}
                onClick={() => setActiveSolution(idx)}
              >
                <div className="solution-title">{item.title}</div>
              </div>
            ))}
            <div className="solution-desc">{solutionList[activeSolution].desc}</div>
          </div>

          <div className="solution-image-area">
            <button
              className="solution-slide-btn"
              onClick={handlePrevSlide}
              aria-label="이전"
              disabled={currentSlide === 0}
            >
              <FiChevronLeft size={32} color={currentSlide === 0 ? '#d0d4e0' : '#2d3a5e'} />
            </button>
            <img
              src={solutionList[activeSolution].img[currentSlide]}
              alt={solutionList[activeSolution].title}
              className="solution-img active"
              draggable="false"
            />
            <button
              className="solution-slide-btn"
              onClick={handleNextSlide}
              aria-label="다음"
              disabled={currentSlide === solutionList[activeSolution].img.length - 1}
            >
              <FiChevronRight size={32} color={currentSlide === solutionList[activeSolution].img.length - 1 ? '#d0d4e0' : '#2d3a5e'} />
            </button>
            <div className="solution-slide-desc">
              {solutionList[activeSolution].imgDesc[currentSlide]}
            </div>
          </div>
        </div>
      </section>

      {/* 카드형 차별점/주요 서비스 섹션 */}
      <section className="differentiator-section fade-in-section" ref={el => (sectionsRef.current[2] = el)}>
        <h2 className="differentiator-title">GENAU의 차별점</h2>
        <div className="differentiator-card-list">
          {differentiators.map((item, idx) => (
            <div className="differentiator-card" key={idx}>
              <div className="differentiator-icon">{item.icon}</div>
              <div className="differentiator-card-title">{item.title}</div>
              <div className="differentiator-card-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
