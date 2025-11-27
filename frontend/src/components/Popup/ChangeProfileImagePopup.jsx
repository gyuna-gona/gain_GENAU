import React, { useState } from 'react';
import './ChangeProfileImagePopup.css';
import { IoClose } from 'react-icons/io5';

export default function ChangeProfileImagePopup({ userId, onClose, onImageChange }) {
  const token = localStorage.getItem('token');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert('이미지를 선택해주세요.');
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file); // 서버 @RequestParam("file")와 일치시킴

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/me/image?userId=${userId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!response.ok) throw new Error('업로드 실패');
      const result = await response.json();
      onImageChange(result.imageUrl); // 백엔드 Map.of("imageUrl", …)과 일치
      onClose();
    } catch (error) {
      console.error(error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="image-popup">
        <button className="close-btn" onClick={onClose}>
          <IoClose size={24} />
        </button>
        <h2>프로필 이미지 변경</h2>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {preview && <img src={preview} alt="preview" className="preview-img" />}
        <button className= "upload-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? '업로드 중...' : '업로드'}
        </button>
      </div>
    </div>
  );
}
