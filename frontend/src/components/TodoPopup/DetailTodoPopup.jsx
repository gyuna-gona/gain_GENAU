import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import "./DetailTodo.css";
import { FaRegCalendar } from "react-icons/fa";
import { LuUser, LuDownload, LuTrash2 } from "react-icons/lu";
import { TbCheckbox } from "react-icons/tb";
import { LuPaperclip } from "react-icons/lu";


const API_BASE = "http://localhost:8080";

const DetailTodoPopup = ({
  detailTodo,
  uploadedFile,
  onFileSelect,
  onClose,
  currentUserId,
  onRefreshDetail,
  getMemberName,
  teamName,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submittedFiles, setSubmittedFiles] = useState([]);

  const [convertProgress, setConvertProgress] = useState(0);
  const [isConvertingNow, setIsConvertingNow] = useState(false);
  const [isConversionFinished, setIsConversionFinished] = useState(false);
  const progressRef = useRef(null);

  // 변환 게이지
  useEffect(() => {
    if (isConvertingNow) {
      progressRef.current = setInterval(() => {
        setConvertProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressRef.current);
            setIsConvertingNow(false);
            setIsConversionFinished(true);
            return 100;
          }
          return prev + 2;
        });
      }, 120);
    }
    return () => clearInterval(progressRef.current);
  }, [isConvertingNow]);

  // 에러 메세지 자동 제거
  useEffect(() => {
    if (!uploadError) return;
    const t = setTimeout(() => setUploadError(""), 5000);
    return () => clearTimeout(t);
  }, [uploadError]);

  // (12.01 수정됨) 기존 제출된 파일 목록 불러오기
  const fetchFileList = useCallback(async () => {
    if (!detailTodo?.todoId) return;

    try {
      const res = await fetch(
        `${API_BASE}/todos/${detailTodo.todoId}/files`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setSubmittedFiles(data);
       } else if (Array.isArray(data?.files)) {
        setSubmittedFiles(data.files);
       }
    } catch (e) {
      console.error("파일 목록 조회 실패", e);
    }
  }, [detailTodo?.todoId]);

  // fetchFileList 호출
  useEffect(() => {
    fetchFileList();
  }, [fetchFileList]);

  // 담당자 체크
  const hasAssignees =
    Array.isArray(detailTodo?.assignees) && detailTodo.assignees.length > 0;

  const isAssignee =
    hasAssignees &&
    detailTodo.assignees.some(
      (id) => String(id) === String(currentUserId)
    );

  // 파일 업로드 가능 여부 확인
  const canUpload = !hasAssignees || isAssignee;
  
  // 파일 선택
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsConversionFinished(false);

    const requiredExt = detailTodo.fileForm?.toLowerCase() || null;

    const newItems = files.map((file) => {
      const currentExt = file.name.split(".").pop()?.toLowerCase() || "";
      const needsConvert =
        requiredExt && currentExt && currentExt !== requiredExt;

      return { file, needsConvert };
    });

    setSelectedFiles((prev) => [...prev, ...newItems]);

    if (requiredExt) {
      const anyNeed = newItems.some((f) => f.needsConvert);
      if (anyNeed) {
        setConvertProgress(0);
        setIsConvertingNow(true);
      } else {
        setConvertProgress(100);
        setIsConversionFinished(true);
      }
    } else {
      setConvertProgress(100);
      setIsConversionFinished(true);
    }
  };

  // ============================================================
  // 파일 업로드 및 변환(변환 필요한 파일만 API 호출)
  const handleFileUpload = async () => {
    if (!detailTodo || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const requiredExt = detailTodo.fileForm?.toLowerCase() || null;

    // 1) 먼저 원본 파일 제출 → fileId 확보
    const submitForm = new FormData();
    selectedFiles.forEach((item) => {
      submitForm.append("file", item.file);
    });

    let uploadedFiles = [];

    try {
      const res = await fetch(
        `${API_BASE}/todos/${detailTodo.todoId}/submit`,
        {
          method: "POST",
          body: submitForm,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "업로드 실패");
      }

      const data = await res.json();

      uploadedFiles = Array.isArray(data?.uploadedFiles)
        ? data.uploadedFiles
        : data;
    } catch (err) {
      setUploadError("업로드 실패: " + err.message);
      setIsUploading(false);
      return;
    }

    // 2) 업로드된 파일 중 확장자가 다른 것만 convert API 호출
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const fileInfo = uploadedFiles[i];
        const fileId = fileInfo.id;

        const originalFile = selectedFiles[i].file;
        const currentExt = originalFile.name.split(".").pop().toLowerCase();

        // 변환이 필요한 경우에만 API 호출
        if (requiredExt && currentExt !== requiredExt) {
          const convertForm = new FormData();
          
          // 파일을 다시 보내지 않고 targetFormat만 보내도록 수정
          // 이미 업로드된 파일을 변환하는 것이므로 파일 본문은 불필요
          // convertForm.append("file", originalFile); <--- 삭제함
          convertForm.append("file", originalFile);
          convertForm.append("targetFormat", requiredExt);

          const convertRes = await fetch(
            `${API_BASE}/todos/${detailTodo.todoId}/files/${fileId}/convert`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: convertForm,
            }
          );

          if (!convertRes.ok) {
          const txt = await convertRes.text();
          throw new Error(txt || "변환 실패");
          }
        }
      }
    } catch (err) {
      // 변환 실패해도 업로드는 성공했기 때문에 중단하지 않음
      setUploadError("변환 실패: " + err.message);
    } finally {
      await fetchFileList();

      try {
        if (onRefreshDetail) await onRefreshDetail();
      } catch {}

      setIsUploading(false);

      // 성공적으로 완료되었을 때만 초기화
      if (!uploadError) {
        setSelectedFiles([]);
        setConvertProgress(100);
        setIsConversionFinished(true);
        onClose();
      }
    }
  };
  // ============================================================

  // 다운로드
  const handleDownloadFile = async (fileId, fileName) => {
    if (!detailTodo) return;
    try {
      const response = await fetch(
        `${API_BASE}/todos/${detailTodo.todoId}/files/${fileId}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("파일 다운로드 실패");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setUploadError(`파일 다운로드 실패: ${error.message}`);
    }
  };

  // 파일 삭제
  const handleDeleteFile = async (fileId) => {
    if (!detailTodo) return;
    if (!window.confirm("이 파일을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(
        `${API_BASE}/todos/${detailTodo.todoId}/files/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "파일 삭제 실패");
      }

      setSubmittedFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (error) {
      setUploadError(`파일 삭제 실패: ${error.message}`);
    }
  };

  if (!detailTodo) return null;

  const names = getMemberName(detailTodo.assignees);
  const namesArr = Array.isArray(names)
    ? names
    : String(names || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  
  const assigneeDisplay =
    namesArr.length === 0
      ? "담당자 없음"
      : namesArr.length === 1
      ? namesArr[0]
      : `${namesArr[0]} 외 ${namesArr.length - 1}명`;

  const canDeleteExisting =
    (hasAssignees && isAssignee) || !hasAssignees;


  // DetailTodoPopup 내용물 구성
  const popupContent = (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="detail-todo-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{detailTodo.todoTitle}</h3>

        <p className="team-category">
          {teamName || detailTodo.teamName || "팀명 없음"} :{" "}
          {detailTodo.categoryName}
        </p>

        <div className="detail-title">할 일 상세</div>

        <div className="container">
          <div className="left">
            <div className="row">
              <FaRegCalendar className="detail-icon" />
              {detailTodo.dueDate}
            </div>

            <div className="row">
              <LuUser className="detail-icon" />
              {assigneeDisplay}
            </div>

            <div className="row">
              <TbCheckbox className="detail-icon" />
              <span
                className={`status-tag ${
                  detailTodo.todoChecked ? "completed" : "pending"
                }`}
              >
                {detailTodo.todoChecked ? "완료" : "미완료"}
              </span>
            </div>
          </div>

          <div className="right">
            <div className="detail-todo-content">
              {detailTodo.todoDes}
            </div>
          </div>
        </div>

        <div className="file-submit-title">
          <strong>파일 제출</strong>
        </div>

        <p className="file-title">
          파일 형식:
          <span className="file-format-display">
            {detailTodo.fileForm || "제한 없음"}
          </span>
        </p>

        <div className="file-section">
          {submittedFiles.length > 0 &&
            submittedFiles.map((file) => (
              <div key={file.id} className="file-info">
                <div className="file-details">
                  <span className="file-prefix">
                    <LuPaperclip />
                  </span>

                  <span className="file-name">{file.fileName}</span>

                  <div className="file-actions">
                    <button
                      className="icon-download"
                      onClick={() =>
                        handleDownloadFile(file.id, file.fileName)
                      }
                      title="다운로드"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <LuDownload />
                    </button>

                    {canDeleteExisting && (
                      <button
                        className="icon-delete"
                        onClick={() =>
                          handleDeleteFile(file.id)
                        }
                        title="삭제"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <LuTrash2 />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {canUpload ? (
          <div className="upload-section">
            <input
              type="file"
              multiple
              accept="*/*"
              onChange={handleFileSelect}
              disabled={isUploading}
            />

            {selectedFiles.length > 0 && (
              <div className="upload-preview-list">
                {selectedFiles.map((item, index) => {
                  const file = item.file;
                  const requiredExt =
                    detailTodo.fileForm?.toLowerCase() || "";
                  const currentExt =
                    file.name.split(".").pop()?.toLowerCase() ||
                    "";
                  const needsConvert =
                    requiredExt &&
                    currentExt &&
                    currentExt !== requiredExt;

                  return (
                    <div
                      className="upload-preview"
                      key={`${file.name}-${index}`}
                    >
                      <span className="file-prefix">
                        <LuPaperclip />
                      </span>
                      <span className="file-preview-name">
                        {file.name}
                      </span>
                      <span>
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>

                      {detailTodo.fileForm &&
                        (() => {
                          if (needsConvert) {
                            if (
                              isConvertingNow &&
                              !isConversionFinished
                            ) {
                              return (
                                <span className="format-check-inline">
                                  <div className="conversion-bar">
                                    <div
                                      className="conversion-bar-fill"
                                      style={{
                                        width: `${convertProgress}%`,
                                      }}
                                    />
                                  </div>
                                </span>
                              );
                            }

                            if (isConversionFinished) {
                              return (
                                <div className="approval-wrapper">
                                  <div className="approval-group">
                                    <p className="approved">
                                      승인
                                    </p>
                                  </div>
                                  <button
                                    className="file-remove"
                                    onClick={() => {
                                      setSelectedFiles(
                                        (prev) =>
                                          prev.filter(
                                            (_, i) => i !== index
                                          )
                                      );
                                    }}
                                  >
                                    ✖
                                  </button>
                                </div>
                              );
                            }
                          }

                          if (!needsConvert) {
                            return (
                              <div className="approval-wrapper">
                                <div className="approval-group">
                                  <p className="approved">승인</p>
                                </div>
                                <button
                                  className="file-remove"
                                  onClick={() => {
                                    setSelectedFiles((prev) =>
                                      prev.filter(
                                        (_, i) => i !== index
                                      )
                                    );
                                  }}
                                >
                                  ✖
                                </button>
                              </div>
                            );
                          }

                          return null;
                        })()}
                    </div>
                  );
                })}
              </div>
            )}

            {uploadError && (
              <div className="message error">{uploadError}</div>
            )}
            {uploadSuccess && (
              <div className="message success">
                {uploadSuccess}
              </div>
            )}

            <div className="popup-buttons">
              <button
                className="btn-submit"
                onClick={handleFileUpload}
                disabled={
                  isUploading || selectedFiles.length === 0
                }
              >
                {isUploading ? "업로드 중..." : "제출"}
              </button>
              <button
                className="btn-cancel"
                onClick={async () => {
                  if (onRefreshDetail) await onRefreshDetail();
                  onClose();
                }}
              >
                닫기
              </button>

            </div>
          </div>
        ) : (
          <div className="popup-buttons">
            <button
              className="btn-cancel full-width"
              onClick={async () => {
                if (onRefreshDetail) await onRefreshDetail();
                onClose();
              }}
            >
              닫기
            </button>

          </div>
        )}
      </div>
    </div>
  );

  return createPortal(popupContent, document.body);
};

export default DetailTodoPopup;