import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import './TodoBoard.css';
import TodoCard from '../TodoCard/TodoCard';
import AddTodoPopup from '../TodoPopup/AddTodoPopup';
import EditTodoPopup from '../TodoPopup/EditTodoPopup';
import DetailTodoPopup from '../TodoPopup/DetailTodoPopup';

const API_BASE = 'http://localhost:8080';
const SCROLL_AMOUNT = 250;

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

// 배경색에 투명도 적용 유틸
const formatBGColor = (color) => {
  if (!color) return 'rgba(0,123,255,0.10)';
  if (color.startsWith('#')) return color + '22'; // HEX 색상에 13% 투명도 추가
  if (color.startsWith('hsl')) return color.replace('hsl(', 'hsla(').replace(')', ', 0.13)');
  return color;
};

// DB 색상 우선 -> 없거나 기본값이면 동적생성 fallback
const getBGColor = (catId, catColor) => {
  if (catColor && catColor !== '#007bff' && catColor !== '#000000') return formatBGColor(catColor);
  return formatBGColor(generateCategoryColor(catId));
};

// 카테고리 목록 조회 API
const fetchCategories = async (teamId) => {
  const response = await fetch(`${API_BASE}/teams/${teamId}/categories`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  if (!response.ok) throw new Error('카테고리 목록 불러오기 실패');
  return response.json();
};

// 카테고리별 투두 목록 조회 API
const fetchTodosByCategory = async (teamId) => {
  const response = await fetch(`${API_BASE}/todos/team/${teamId}/by-category`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  
  if (!response.ok) throw new Error('카테고리별 할 일 목록 불러오기 실패');
  
  const data = await response.json();
  
  
  // fileForm 필드 누락 문제 해결
  const processedData = data.map(categoryTodo => ({
    ...categoryTodo,
    todos: categoryTodo.todos?.map(todo => ({
      ...todo,
      // fileForm이 누락된 경우 빈 문자열로 처리
      fileForm: todo.fileForm ?? todo.file_form ?? '',
      // 다른 가능한 필드명들도 체크
      uploadedFilePath: todo.uploadedFilePath ?? todo.uploaded_file_path ?? null,
      uploadedFileName: todo.uploadedFileName ?? todo.uploaded_file_name ?? null
    })) || []
  }));
  
  return processedData;
};

async function fetchTeamMembers(teamId) {
  const res = await fetch(`${API_BASE}/teams/${teamId}/members`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  if (!res.ok) throw new Error("팀원 목록 불러오기 실패");
  const data = await res.json();
  
  return data;
}

const TodoBoard = ({ teamId, userId, teamName }) => {

  const queryClient = useQueryClient();
  const [popupCatId, setPopupCatId] = useState(null);
  const [newTodo, setNewTodo] = useState({ title: '', content: '', date: '', fileForm: '', assignees: [] });
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [menuTodoId, setMenuTodoId] = useState(null);
  const [editTodo, setEditTodo] = useState({ title: '', content: '', date: '', fileForm: '', assignees: [] });
  const [detailTodo, setDetailTodo] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // 카테고리별 색상 캐시
  const [categoryColors, setCategoryColors] = useState({});

  // 카테고리 목록 조회
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', teamId],
    queryFn: () => fetchCategories(teamId),
    enabled: Boolean(teamId),
  });

  // 카테고리별 투두 목록 조회
  const { data: categoryTodos = [], isLoading: todosLoading, error } = useQuery({
    queryKey: ['categoryTodos', teamId],
    queryFn: () => fetchTodosByCategory(teamId),
    enabled: Boolean(teamId),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teammates', teamId],
    queryFn: () => fetchTeamMembers(teamId),
    enabled: Boolean(teamId),
  });

  // 카테고리별 색상 생성 및 캐싱 (TodoCalendar.jsx와 동일)
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

  // 카테고리와 투두를 매칭하여 최종 데이터 생성
  // combinedCategoryData 생성 로직 개선 및 useMemo로 최적화
  const combinedCategoryData = useMemo(() => {
    // 디버깅용 로그
    console.log('데이터 매칭 시작:', {
      categories: categories,
      categoryTodos: categoryTodos,
      categoriesLength: categories?.length,
      categoryTodosLength: categoryTodos?.length
    });

    if (!Array.isArray(categories) || !Array.isArray(categoryTodos)) {
      console.log('배열이 아님:', { categories, categoryTodos });
      return [];
    }

    const result = categories.map(category => {
      const categoryWithTodos = categoryTodos.find(ct => ct.catId === category.catId);
      
      const combinedCategory = {
        catId: category.catId,
        categoryName: category.catName,
        catColor: category.catColor,
        todos: Array.isArray(categoryWithTodos?.todos) ? categoryWithTodos.todos : []
      };

      console.log(`카테고리 [${category.catName}] 매칭 결과:`, {
        catId: category.catId,
        catColor: category.catColor,
        todosCount: combinedCategory.todos.length,
        todos: combinedCategory.todos
      });

      return combinedCategory;
    });

    console.log('최종 combinedCategoryData:', result);
    return result;
  }, [categories, categoryTodos]);


  const getMemberName = (idOrArray) => {
    const memberNames = [];
    const ids = Array.isArray(idOrArray) ? idOrArray : [idOrArray];

    if (ids.length === 0 || (ids.length === 1 && !ids[0])) {
      return '미지정';
    }

    ids.forEach(id => {
      const member = teamMembers.find((m) => m.userId === Number(id));
      memberNames.push(member ? member.userName : '미지정');
    });

    return memberNames.join(', ');
  };

  const handleOpenPopup = (catId) => {
    setPopupCatId(catId);
    setNewTodo({ title: '', content: '', date: '', fileForm: '', assignees: [] });
    setUploadedFile(null); // 파일도 초기화
  };

  const handleClosePopup = () => {
    setPopupCatId(null);
    setUploadedFile(null); // 팝업 닫을 때 파일 초기화
  };

  // 투두 상세 정보 조회 함수
  const handleOpenDetail = async (todo) => {
    try {
      
      setSelectedCategoryId(todo.catId);
      
      const response = await fetch(`${API_BASE}/todos/team/${teamId}/category/${todo.catId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`상세정보 불러오기 실패: ${response.status} ${response.statusText}`);
      }
      
      const detailTodos = await response.json();
      
      const fullTodo = detailTodos.find(t => t.todoId === todo.todoId);
      if (fullTodo) {
        
        // 팀 이름을 todo 객체에 주입해서 팝업으로 전달
        setDetailTodo({ ...fullTodo, teamName });
        setUploadedFile(null);
      } else {
        console.error('해당 todoId를 찾을 수 없음:', todo.todoId);
        console.log('사용 가능한 todoId들:', detailTodos.map(t => t.todoId));
        throw new Error("투두를 찾을 수 없습니다");
      }
    } catch (err) {
      console.error('상세정보 로드 실패:', err);
      alert('상세정보를 불러올 수 없습니다: ' + err.message);
    }
  };

  const handleCloseDetail = () => {
    setDetailTodo(null);
    setSelectedCategoryId(null);
    setUploadedFile(null); // 상세 팝업 닫을 때도 파일 초기화
  };

  // refreshDetail 함수 - 강제 새로고침 로직 추가
  const refreshDetail = async () => {
    if (!detailTodo || !selectedCategoryId) return;
    
    try {
      
      // 캐시 무효화를 강제로 실행
      await queryClient.invalidateQueries(['categoryTodos', teamId]);
      await queryClient.invalidateQueries(['categoryDetailTodos', teamId, selectedCategoryId]);
      
      // 캐시된 데이터 제거
      queryClient.removeQueries(['categoryTodos', teamId]);
      queryClient.removeQueries(['categoryDetailTodos', teamId, selectedCategoryId]);
      
      // URL 수정: categories → category
      const url = `${API_BASE}/todos/team/${teamId}/category/${selectedCategoryId}?t=${Date.now()}`;
      console.log('새로고침 API 요청 URL:', url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache',
        },
      });
      
      console.log('새로고침 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('새로고침 API 응답 에러:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`상세정보 불러오기 실패: ${response.status} ${response.statusText}`);
      }
      
      const detailTodos = await response.json();
      
      console.log('서버에서 받은 상세 투두 목록:', detailTodos);
      
      const fullTodo = detailTodos.find(t => t.todoId === detailTodo.todoId);
      if (fullTodo) {
        setDetailTodo(fullTodo);
        setUploadedFile(null);
      } else {
        console.error('해당 todoId를 찾을 수 없음:', detailTodo.todoId);
        console.log('사용 가능한 todoId들:', detailTodos.map(t => t.todoId));
      }
      
      // 전체 투두 목록도 새로고침
      await queryClient.refetchQueries(['categoryTodos', teamId]);
      
    } catch (err) {
      console.error('상세정보 새로고침 실패: ', err);
    }
  };

  // handleChange 함수 개선 - fileForm 처리 추가
  const handleChange = (e) => {
    const { name, value, selectedOptions } = e.target;
    let newValue = value;

    if (name === 'assignees') {
      newValue = Array.from(selectedOptions)
        .map(option => option.value)
        .filter(v => v !== '');
    }
    
    setNewTodo(old => {
      const updated = { ...old, [name]: newValue };
      return updated;
    });
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      setUploadedFile(file);
      console.log('📎 파일 선택됨:', file.name);
    }
  };

  // handleAddTodo 함수 개선 - fileForm 처리 강화
  const handleAddTodo = async () => {

    // assgineeId를 배열 형태로 변환
    let assigneeIds = [];
    if (Array.isArray(newTodo.assignees) && newTodo.assignees.length > 0) {
      assigneeIds = newTodo.assignees.map(id => Number(id));
    }
    
    // fileForm 값 안전 처리
    let fileFormValue = '';
    if (newTodo.fileForm && newTodo.fileForm.trim() !== '') {
      fileFormValue = newTodo.fileForm.trim();
    }
    
    const requestBody = {
      catId: popupCatId,
      teamId,
      assigneeIds: assigneeIds,
      todoTitle: newTodo.title?.trim() || '',
      todoDes: newTodo.content?.trim() || '',
      dueDate: newTodo.date || '',
      fileForm: fileFormValue, // 안전하게 처리된 값
    };

    try {
      const response = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "서버 오류");
      }

      const result = await response.json();
      console.log('할 일 추가 성공:', result);

      // 캐시 무효화 및 새로고침
      await queryClient.invalidateQueries(['categoryTodos', teamId]);
      await queryClient.refetchQueries(['categoryTodos', teamId]);
      
      handleClosePopup();
      
    } catch (err) {
      console.error('할 일 등록 실패:', err);
      alert('할 일 등록에 실패했습니다: ' + err.message);
    }
  };

  // handleEditTodo 함수 개선 - fileForm 초기화 확실히
  const handleEditTodo = (todo) => {
    console.log('편집 시작 - 원본 투두:', todo);
    setSelectedTodo(todo);

    setEditTodo({
      title: todo.todoTitle || '',
      content: todo.todoDes || '',
      date: todo.dueDate || '',
      fileForm: todo.fileForm || '', // null/undefined 처리
      assignees: Array.isArray(todo.assignees)
        ? todo.assignees.map(id => String(id))
        : [],
    });
    setUploadedFile(null); // 편집 시작할 때 업로드된 파일 초기화
  };

  // handleUpdateTodo 함수 대폭 개선
  const handleUpdateTodo = async () => {
    if (!selectedTodo) return;

    let assigneeIds = [];
    if (Array.isArray(editTodo.assignees) && editTodo.assignees.length > 0) {
      assigneeIds = editTodo.assignees.map(id => Number(id));
    }

    console.log('할 일 수정 시작:', { selectedTodo, editTodo, uploadedFile });

    const requestBody = {
      todoTitle: editTodo.title,
      todoDes: editTodo.content,
      dueDate: editTodo.date,
      fileForm: editTodo.fileForm || '', // 빈 문자열로 기본값
      assigneeIds: assigneeIds,
    };

    console.log('UPDATE 요청 상세:', {
    selectedTodo: selectedTodo,
    editTodo: editTodo,
    requestBody: requestBody,
    URL: `${API_BASE}/todos/${selectedTodo.todoId}`,
    token: localStorage.getItem('token') ? '존재함' : '없음'
  });

    try {
      const response = await fetch(`${API_BASE}/todos/${selectedTodo.todoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "수정 실패");
      }

      const result = await response.json();
      console.log('할 일 수정 성공:', result);

      // 캐시 완전 제거 후 새로고침
      queryClient.removeQueries(['categoryTodos', teamId]);
      queryClient.removeQueries(['categoryDetailTodos', teamId, selectedCategoryId]);
      queryClient.removeQueries(['weeklyTodos', userId]);

      // 새 데이터 fetch
      await queryClient.refetchQueries(['categoryTodos', teamId]);
      
      // 상세 팝업이 열려있다면 즉시 업데이트
      if (detailTodo && detailTodo.todoId === selectedTodo.todoId) {
        // 낙관적 업데이트로 즉시 UI 반영
        const updatedDetailTodo = {
          ...detailTodo,
          todoTitle: editTodo.title,
          todoDes: editTodo.content,
          dueDate: editTodo.date,
          fileForm: editTodo.fileForm || '',
          assigneeIds: assigneeIds,
        };
        setDetailTodo(updatedDetailTodo);
        
        // 잠시 후 서버에서 최신 데이터 다시 가져오기
        setTimeout(async () => {
          await refreshDetail();
        }, 500);
      }
      
      setSelectedTodo(null);
      
    } catch (err) {
      console.error("할 일 수정 실패: ", err);
      alert('할 일 수정에 실패했습니다: ' + err.message);
      
      // 실패 시 상세 정보 새로고침
      if (detailTodo && detailTodo.todoId === selectedTodo.todoId) {
        await refreshDetail();
      }
    }
  };

  const handleCancleEdit = () => {
    setSelectedTodo(null);
    setUploadedFile(null); // 편집 취소할 때도 파일 초기화
  };

  const handleDeleteTodo = async (todoId) => {
    // 권한 확인 추가
    const todo = combinedCategoryData
      .flatMap(cat => cat.todos)
      .find(t => t.todoId === todoId);

    if (todo) {
      const currentUserIdNum = Number(userId);
      const creatorId = Number(todo.creatorId);

      if (currentUserIdNum !== creatorId) {
        alert('이 할 일을 삭제할 권한이 없습니다.\n(생성자만 삭제 가능)');
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE}/todos/${todoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error("삭제 실패");

      // 캐시 무효화 및 새로고침
      await queryClient.invalidateQueries(['categoryTodos', teamId]);
      await queryClient.refetchQueries(['categoryTodos', teamId]);
      
      setMenuTodoId(null);
      
      // 삭제된 투두의 상세 팝업이 열려있다면 닫기
      if (detailTodo && detailTodo.todoId === todoId) {
        handleCloseDetail();
      }
      
    } catch (err) {
      console.error('할 일 삭제 실패:', err);
      alert('할 일 삭제에 실패했습니다: ' + err.message);
    }
  };

  const toggleTodoChecked = async (todoId, checked) => {
    // 권한 확인 추가
    const todo = combinedCategoryData
      .flatMap(cat => cat.todos)
      .find(t => t.todoId === todoId);

    if (todo) {
      const currentUserIdNum = Number(userId);
      const creatorId = Number(todo.creatorId);

      let canCheck = false;

      if (!todo.assignees || todo.assignees.length === 0) {
        canCheck = currentUserIdNum === creatorId;
      } else {
        canCheck = todo.assignees.some(id => Number(id) === currentUserIdNum);
      }

      if (!canCheck) {
        alert('할 일 완료 체크는 담당자만 가능합니다.');
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE}/todos/${todoId}/check`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ todoChecked: checked }),
      });
      
      if (!response.ok) throw new Error('체크 상태 변경 실패');
      
      // 캐시 무효화 및 새로고침
      await queryClient.invalidateQueries(['categoryTodos', teamId]);
      
      // 상세 팝업이 열려있고 해당 투두라면 새로고침
      if (detailTodo && detailTodo.todoId === todoId) {
        setTimeout(async () => {
          await refreshDetail();
        }, 200);
      }
      
    } catch (err) {
      console.error('상태 변경 실패:', err);
      alert('체크 상태 변경에 실패했습니다: ' + err.message);
    }
  };

  const wrapperRef = useRef(null);
  const [canScroll, setCanScroll] = useState(false);

  const checkScrollable = () => {
    const el = wrapperRef.current;
    if (!el) return;
    setCanScroll(el.scrollWidth > el.clientWidth);
  };

  useEffect(() => {
    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, [combinedCategoryData]);

  const addClickEffect = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.add('clicked');
    setTimeout(() => el.classList.remove('clicked'), 300);
  };


  const isLoading = categoriesLoading || todosLoading;

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>오류 발생: {error.message}</div>;

  return (
    <>
      <div className="board-scroll-container">
        <div className="todo-board-wrapper" ref={wrapperRef}>
          <div className="todo-board">
            {/* 안전한 렌더링 - 디버깅 로그 포함 */}
            {combinedCategoryData && combinedCategoryData.length > 0 ? (
              combinedCategoryData.map((category) => {
                const categoryBoxStyle = {
                  backgroundColor: getBGColor(category.catId, category.catColor)
                };

                return (
                  <div key={category.catId} className="category-box" style={categoryBoxStyle}> 
                    <h3 className="category-title" style={{color: category.catColor}}>
                      {category.categoryName}의 할 일
                    </h3>
                    <div className="todo-list">
                      {category.todos && category.todos.length > 0 ? (
                        category.todos.map((todo) => {
                          return (
                            <TodoCard
                              key={todo.todoId}
                              todo={todo}
                              currentUserId={userId}
                              onToggleChecked={toggleTodoChecked}
                              onEdit={handleEditTodo}
                              onDelete={handleDeleteTodo}
                              onOpenDetail={handleOpenDetail}
                            />
                          );
                        })
                      ) : (
                        <div className="empty-todo-message">
                          투두를 생성하세요
                        </div>
                      )}
                    </div>
                    <button className="add-todo-btn" onClick={() => handleOpenPopup(category.catId)}>+</button>
                  </div>
                );
              })
            ) : (
              <div className="no-categories">
                <p>목록을 먼저 생성해주세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {popupCatId && (
        <AddTodoPopup
          newTodo={newTodo}
          teamMembers={teamMembers}
          onChange={setNewTodo}
          onAdd={handleAddTodo}
          onClose={handleClosePopup}
          uploadedFile={uploadedFile}
          onFileSelect={handleFileSelect}
        />
      )}

      {selectedTodo && (
        <EditTodoPopup
          editTodo={editTodo}
          teamMembers={teamMembers}
          onChange={setEditTodo}
          onSave={handleUpdateTodo}
          onCancel={handleCancleEdit}
          uploadedFile={uploadedFile}
          onFileSelect={handleFileSelect}
        />
      )}

      {detailTodo && (
        <DetailTodoPopup
          detailTodo={detailTodo}
          getMemberName={getMemberName}
          uploadedFile={uploadedFile}
          onFileSelect={handleFileSelect}
          onClose={handleCloseDetail}
          currentUserId={userId}
          onRefreshDetail={refreshDetail}
          teamName={teamName}
        />
      )}
    </>
  );
};

export default TodoBoard;