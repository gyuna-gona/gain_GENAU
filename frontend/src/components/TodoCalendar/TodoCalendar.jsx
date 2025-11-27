import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './TodoCalendar.css';

const API_BASE = 'http://localhost:8080';
const WEBSOCKET_URL = 'ws://localhost:8080/ws/todos';

// 카테고리별 투두 목록 조회 함수
const fetchTodosByCategory = async (teamId) => {
  const safeTeamId = String(teamId);
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/todos/team/${safeTeamId}/by-category`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`투두 목록 불러오기 실패: ${response.status} - ${errorText}`);
  }
  return response.json();
};

// 확실히 구분되는 동적 색상 생성 함수
const generateCategoryColor = (catId) => {
  if (!catId) return '#FF4757'; // 기본 색상
  
  // catId를 기반으로 안정적인 해시 생성
  let hash = 0;
  const str = String(catId);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  
  const absHash = Math.abs(hash);
  
  // 색상환을 큰 구간으로 나누어 확실히 다른 색상 생성
  const colorZones = [
    { min: 0, max: 30, name: '빨강' },     // 빨강~주황
    { min: 60, max: 90, name: '노랑' },    // 노랑~연두
    { min: 120, max: 150, name: '초록' },  // 초록
    { min: 180, max: 210, name: '청록' },  // 청록~하늘
    { min: 240, max: 270, name: '파랑' },  // 파랑~남색
    { min: 300, max: 330, name: '보라' },  // 보라~자주
  ];
  
  // 색상 구간 선택
  const zoneIndex = absHash % colorZones.length;
  const selectedZone = colorZones[zoneIndex];
  
  // 선택된 구간 내에서 색조 결정
  const hueRange = selectedZone.max - selectedZone.min;
  const hue = selectedZone.min + (absHash % hueRange);
  
  // 채도와 명도를 크게 변화시켜 더 확실한 차이 만들기
  const saturationOptions = [70, 85, 95]; // 낮음, 중간, 높음
  const lightnessOptions = [45, 60, 75];  // 어둠, 중간, 밝음
  
  const saturation = saturationOptions[absHash % saturationOptions.length];
  const lightness = lightnessOptions[(absHash >> 2) % lightnessOptions.length];
  
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  
  return color;
};

// 색상 대비 개선을 위한 보조 함수
const getContrastColor = (backgroundColor) => {
  // 배경색이 밝으면 어두운 텍스트, 어두우면 밝은 텍스트
  const rgb = backgroundColor.match(/\d+/g);
  if (rgb && rgb.length >= 3) {
    const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
    return brightness > 128 ? '#333333' : '#FFFFFF';
  }
  return '#333333';
};

const TodoCalendar = ({ teamId, userId, onTodoTitleEdited }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [forceUpdate, setForceUpdate] = useState(0); // 강제 리렌더링용 상태
  const socketRef = useRef(null);
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient); // queryClient 안정화

  // 카테고리별 색상 캐시
  const [categoryColors, setCategoryColors] = useState({});

  // 현재 로그인한 사용자 정보 가져오기
  const [currentUser, setCurrentUser] = useState(null);

  // API 호출하기
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch(`${API_BASE}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-type': 'application/json'
          },
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('현재 로그인한 사용자: ', userData);
          setCurrentUser(userData); 
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패: ', error);
      }
    };

    getCurrentUser();
  }, []);


  // queryClient ref 업데이트
  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  // 카테고리 목록
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', teamId],
    queryFn: async () => {
      const safeTeamId = String(teamId);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/teams/${safeTeamId}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`카테고리 목록 불러오기 실패: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    enabled: Boolean(teamId) && typeof teamId !== 'object',
  });

  // 카테고리별 투두 목록
  const { data: categoryTodos = [], isLoading, error } = useQuery({
    queryKey: ['categoryTodos', teamId],
    queryFn: () => fetchTodosByCategory(teamId),
    enabled: Boolean(teamId) && typeof teamId !== 'object',
  });

  // 카테고리별 색상 생성 및 캐싱 (개선됨)
  const getCategoryColor = useCallback((catId, catName) => {
    const cacheKey = `${catId}_${catName}`;
    
    // 이미 캐시된 색상이 있으면 반환
    if (categoryColors[cacheKey]) {
      return categoryColors[cacheKey];
    }

    // 서버에서 제공하는 색상이 있는지 확인
    const matchedCategory = categories.find(cat => cat.catId === catId);
    let color;
    
    if (matchedCategory?.catColor && 
        matchedCategory.catColor !== '#007bff' && 
        matchedCategory.catColor !== '#000000') {
      color = matchedCategory.catColor;
    } else {
      // 대비가 강한 색상 생성
      color = generateCategoryColor(catId);
    }

    // 색상 캐시에 저장
    setCategoryColors(prev => {
      const newColors = {
        ...prev,
        [cacheKey]: color
      };
      return newColors;
    });

    return color;
  }, [categories, categoryColors]);

  // 웹소켓 메시지 핸들러를 useCallback으로 안정화
  const handleWebSocketMessage = useCallback((event) => {
    console.log('웹소켓 메시지 수신:', event.data);
    try {
      const message = JSON.parse(event.data);
      
      if (message.type === 'TODO_UPDATED') {
        console.log("실시간 TODO 업데이트 수신:", message);

        // 안정화된 queryClient 사용
        queryClientRef.current.setQueryData(['categoryTodos', teamId], (oldData) => {
                console.log('📊 기존 캐시 데이터:', oldData);
                if (!oldData || !Array.isArray(oldData)) {
                    console.warn('캐시 데이터가 없거나 형식이 올바르지 않음:', oldData);
                    return oldData;
                }

                const newData = oldData.map(category => {
                    if (!category.todos || !Array.isArray(category.todos)) {
                        return category;
                    }

                    const updatedTodos = category.todos.map(todo => {
                        if (todo.todoId === message.todoId) {
                            console.log(`TODO 업데이트: 
                                제목: ${todo.todoTitle} → ${message.newTitle}
                                날짜: ${todo.dueDate} → ${message.newDueDate}`);
                            
                            return { 
                                ...todo, 
                                todoTitle: message.newTitle,
                                dueDate: message.newDueDate // 날짜도 업데이트
                            };
                        }
                        return todo;
                    });

                    return { ...category, todos: updatedTodos };
                });

                console.log('업데이트된 캐시 데이터:', newData);
                return newData;
            });

            // 강제 리렌더링 트리거
            setForceUpdate(prev => prev + 1);
        }
    } catch (error) {
        console.error('메시지 파싱 오류:', error);
    }
}, [teamId]);

  // 웹소켓 연결 관리
  useEffect(() => {
    console.log('TodoCalendar useEffect 실행됨');
    console.log('teamId:', teamId, 'typeof:', typeof teamId);
    
    if (!teamId || typeof teamId === 'object') {
      console.log('웹소켓 연결 조건 불만족');
      return;
    }

    // 기존 연결이 있으면 먼저 정리
    if (socketRef.current) {
      console.log('기존 웹소켓 연결 정리');
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }

    console.log('웹소켓 연결 조건 통과!');
    const socket = new WebSocket(WEBSOCKET_URL);
    socketRef.current = socket;

    socket.onopen = (event) => {
      console.log('웹소켓 연결 성공:', event);
    };

    // 안정화된 메시지 핸들러 사용
    socket.onmessage = handleWebSocketMessage;

    socket.onerror = (error) => {
      console.error('웹소켓 연결 오류:', error);
    };

    socket.onclose = (event) => {
      console.log('웹소켓 연결 종료:', event.code, event.reason);
    };

    return () => {
      console.log('웹소켓 연결 정리');
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close();
        }
        socketRef.current = null;
      }
    };
  }, [teamId, handleWebSocketMessage]); // 안정화된 핸들러를 의존성에 포함

  const formatLocalDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

// 색상 적용된 이벤트 데이터 생성
  const eventsByDate = useMemo(() => {
    console.log('eventsByDate 재계산됨, forceUpdate:', forceUpdate);
    console.log('카테고리 투두 데이터:', categoryTodos);
    
    const events = categoryTodos
      .flatMap(category =>
        (category.todos || []).map(todo => {
          const matchedCategory = categories.find(cat => cat.catId === category.catId);
          const catColor = getCategoryColor(category.catId, category.catName);
          
          console.log(`할일 색상 적용: ${todo.todoTitle} -> 카테고리: ${category.catName} (ID: ${category.catId}) -> 색상: ${catColor}`);
          
          return {
            ...todo,
            catId: category.catId,
            catName: category.catName || matchedCategory?.catName || '미분류',
            catColor: catColor, // 동적으로 생성된 색상 적용
          };
        })
      )
      .reduce((acc, todo) => {
        if (!todo.dueDate) return acc;
        const key = formatLocalDate(new Date(todo.dueDate));
        acc[key] = acc[key] || [];
        acc[key].push(todo);
        return acc;
      }, {});

    console.log('최종 이벤트 데이터:', events);
    return events;
  }, [categoryTodos, categories, forceUpdate, getCategoryColor]);

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const key = formatLocalDate(date);
    const todaysEvents = eventsByDate[key] || [];
    if (!todaysEvents.length) return null;

    return (
      <ul className='calendar-event-list'>
        {todaysEvents.map(todo => {

          // 배경색 투명도 조정 (완료 여부에 따라)
          const backgroundOpacity = todo.todoChecked ? 0.2 : 0.4; // 완료시 더 연하게
          const backgroundColor = todo.catColor.replace('hsl(', 'hsla(').replace(')', `, ${backgroundOpacity})`);

          // 담당자 확인 로직 
          const currentUserId = currentUser?.userId;
          const isMyTask = todo.assigneeId === currentUserId ||
                          todo.assigneeId === currentUser?.userId;

          if (todo.assigneeId) {
            console.log(`👤 담당자 확인: 할일="${todo.todoTitle}", 담당자ID=${todo.assigneeId}, 현재사용자ID=${currentUserId}, 내할일=${isMyTask}`);
          }

          return (
            <li
            key={`${todo.todoId}-${forceUpdate}`} //key에 forceUpdate 포함
            className={`calendar-event-item ${todo.todoChecked ? 'completed' : ''}`}
            title={`${todo.todoTitle} - ${todo.todoDes || '설명 없음'} (${todo.catName})`}
            style={{
              borderLeft: `5px solid ${todo.catColor}`,
              backgroundColor: backgroundColor
            }}
            >
              <span
                className={`event-title ${todo.todoChecked ? 'completed-text' : ''}`}
                style={{
                  display: 'inline-block',
                  maxWidth: '90%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  verticalAlign: 'middle',
                  color: todo.todoChecked ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.85)',
                  fontWeight: isMyTask ? 'bold' : 'normal'
                }}
              > 
                {todo.todoTitle}
              </span>
              {todo.todoChecked && <span className="check-mark">✓</span>}
            </li>
          );
        })}
      </ul>
    );
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const key = formatLocalDate(date);
    const todaysEvents = eventsByDate[key] || [];
    if (todaysEvents.length === 0) return null;
    const hasCompleted = todaysEvents.some(todo => todo.todoChecked);
    const hasIncomplete = todaysEvents.some(todo => !todo.todoChecked);
    if (hasIncomplete) return 'has-events incomplete';
    if (hasCompleted) return 'has-events completed';
    return 'has-events';
  };

  if (isLoading) return <div className="calendar-loading">캘린더 로딩 중...</div>;
  if (error) return <div className="calendar-error">캘린더 오류: {error.message}</div>;

  return (
    <div className='todo-calendar'>
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        tileContent={tileContent}
        tileClassName={tileClassName}
        locale="ko-KR"
        formatDay={(locale, date) => String(date.getDate())}
      />
    </div>
  );
};

export default TodoCalendar;
