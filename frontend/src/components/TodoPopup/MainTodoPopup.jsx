import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./DetailTodo.css";
import { FaRegCalendar } from "react-icons/fa";
import { LuUser, LuDownload, LuTrash2 } from "react-icons/lu";
import { TbCheckbox } from "react-icons/tb";
import { LuPaperclip } from "react-icons/lu";


const API_BASE = "http://localhost:8080";

const MainTodoPopup = ({
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
  const [selectedFile, setSelectedFile] = useState(null);
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

  // 에러 자동 제거
  useEffect(() => {
    if (!uploadError) return;
    const t = setTimeout(() => setUploadError(""), 5000);
    return () => clearTimeout(t);
  }, [uploadError]);

  // 파일 선택
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setIsConversionFinished(false);

    const requiredExt = detailTodo.fileForm?.toLowerCase();
    const currentExt = file.name.split(".").pop()?.toLowerCase();

    if (requiredExt && currentExt !== requiredExt) {
      handleAutoConvert(file, requiredExt);
    } else {
      setIsConversionFinished(true);
      setConvertProgress(100);
    }
  };

  // 자동 변환
  const handleAutoConvert = async (file, targetFormat) => {
    setIsConvertingNow(true);
    setConvertProgress(0);
    setIsConversionFinished(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetFormat", targetFormat);

      const res = await fetch(`${API_BASE}/todos/${detailTodo.todoId}/convert`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!res.ok) throw new Error("변환 실패");
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("빈 파일 반환됨");

      setTimeout(() => {
        setConvertProgress(100);
        setIsConvertingNow(false);
        setIsConversionFinished(true);
        const convertedFile = new File(
          [blob],
          `${file.name.split(".")[0]}_converted.${targetFormat}`,
          { type: blob.type }
        );
        setSelectedFile(convertedFile);
      }, 500);
    } catch (err) {
      clearInterval(progressRef.current);
      setConvertProgress(0);
      setIsConvertingNow(false);
      setIsConversionFinished(false);

      const retry = window.confirm("파일 변환에 실패했습니다. 다시 시도하시겠습니까?");
      if (retry) setTimeout(() => handleAutoConvert(file, targetFormat), 1000);
      else {
        setSelectedFile(null);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";
      }
    }
  };

  // 업로드
  const handleFileUpload = async () => {
    const fileToUpload = selectedFile || uploadedFile;
    if (!fileToUpload || !detailTodo) return;
    setIsUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const response = await fetch(
        `${API_BASE}/todos/${detailTodo.todoId}/submit?teammatesId=${currentUserId}`,
        {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!response.ok) throw new Error("파일 업로드 실패");
      setUploadSuccess("파일이 성공적으로 업로드되었습니다.");
      if (onRefreshDetail) await onRefreshDetail();
      onClose();
    } catch (error) {
      setUploadError(`파일 업로드 실패: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 다운로드
  const handleFileDownload = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/todos/${detailTodo.todoId}/download`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!response.ok) throw new Error("파일 다운로드 실패");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getFileName();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setUploadError(`파일 다운로드 실패: ${error.message}`);
    }
  };

  const handleFileDelete = async () => {
  if (!hasUploadedFile) return alert("삭제할 파일이 없습니다.");
  if (!window.confirm(`기존 파일 "${getFileName()}"을 삭제하시겠습니까?`)) return;

  try {
    const response = await fetch(
      `${API_BASE}/todos/${detailTodo.todoId}/upload-file`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
    if (!response.ok) throw new Error("파일 삭제 실패");

    // 전체 리렌더링 대신 내부 상태만 변경
    detailTodo.uploadedFilePath = null;
    detailTodo.fileName = null;

    // 파일 섹션에 즉시 반영되도록 로컬 상태 변경
    setTimeout(() => setUploadSuccess(""), 2000);
  } catch (error) {
    setUploadError(`파일 삭제 실패: ${error.message}`);
  }
};


  const hasUploadedFile = (() => {
    const fields = ["uploadedFilePath", "fileName", "file_path", "fileUrl"];
    return fields.some((k) => !!detailTodo?.[k]);
  })();

  const getFileName = () => {
    const fileFields = [
      "uploadedFileName",
      "fileName",
      "file_name",
      "uploadedFilePath",
      "filePath",
    ];
    for (const f of fileFields) {
      const v = detailTodo?.[f];
      if (v) return String(v).split(/[\\/]/).pop();
    }
    return "알 수 없는 파일";
  };

  const assignees = detailTodo.assignees || [];
  const hasAssignees = assignees.length > 0;

  const canUpload = hasAssignees
    ? assignees.some((id) => String(id) === String(currentUserId))
    : true;

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

  const popupContent = (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="detail-todo-popup" onClick={(e) => e.stopPropagation()}>
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
            <div className="detail-todo-content">{detailTodo.todoDes}</div>
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

        {/*기존 업로드 파일이 있을 때 */}
        <div className="file-section">
        {hasUploadedFile && (
            <div className="file-info">
            <div className="file-details">
                <span className="file-name">{getFileName()}</span>
                <div className="file-actions">
                <button
                    className="icon-download"
                    onClick={handleFileDownload}
                    title="다운로드"
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <LuDownload />
                </button>
                {canUpload && (
                    <button
                    className="icon-delete"
                    onClick={handleFileDelete}
                    title="삭제"
                    onMouseDown={(e) => e.preventDefault()}
                    >
                    <LuTrash2 />
                    </button>
                )}
                </div>
            </div>
            </div>
        )}
        </div>


        {/* 담당자일 때 업로드 영역 */}
        {canUpload ? (
          <div className="upload-section">
            <input
              type="file"
              accept={
                detailTodo.fileForm
                  ? `.${detailTodo.fileForm.toLowerCase()}`
                  : "*/*"
              }
              onChange={handleFileSelect}
              disabled={isUploading}
            />

        {selectedFile && (
        <div className="upload-preview">
            {/* 📎 클립 아이콘 + 파일명 */}
            <span className="file-prefix">
            <LuPaperclip />
            </span>
            <span className="file-preview-name">{selectedFile.name}</span>
            <span>({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>

            {(() => {
            if (!detailTodo.fileForm) return null;
            const requiredExt = detailTodo.fileForm.toLowerCase();
            const currentExt = selectedFile.name.split(".").pop()?.toLowerCase();

            if (isConvertingNow && !isConversionFinished) {
                return (
                <span className="format-check-inline">
                    <div className="conversion-bar">
                    <div
                        className="conversion-bar-fill"
                        style={{ width: `${convertProgress}%` }}
                    />
                    </div>
                </span>
                );
            }

            if (isConversionFinished || currentExt === requiredExt) {
                return (
                <div className="approval-wrapper">
                    <div className="approval-group">
                    <p className="approved">승인</p>
                    </div>
                    <button
                    className="file-remove"
                    onClick={() => {
                        setSelectedFile(null);
                        setConvertProgress(0);
                        setIsConversionFinished(false);
                        const fileInput = document.querySelector('input[type="file"]');
                        if (fileInput) fileInput.value = "";
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
        )}


            {uploadError && <div className="message error">{uploadError}</div>}
            {uploadSuccess && (
              <div className="message success">{uploadSuccess}</div>
            )}

            <div className="popup-buttons">
              <button
                className="btn-submit"
                onClick={handleFileUpload}
                disabled={isUploading || isConvertingNow}
              >
                {isUploading ? "업로드 중..." : "제출"}
              </button>
              <button className="btn-cancel" onClick={onClose}>
                닫기
              </button>
            </div>
          </div>
        ) : (
          // 권한 없는 사용자일 때 닫기 버튼 표시
          <div className="popup-buttons">
            <button className="btn-cancel full-width" onClick={onClose}>
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(popupContent, document.body);
};

export default MainTodoPopup;