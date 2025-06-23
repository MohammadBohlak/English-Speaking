import React, { useState, useEffect, useRef } from "react";
import { data } from "./sentences";

const SENTENCES_PER_PAGE = 30;

const TextToSpeechPage = () => {
  // مصفوفة الجمل ثنائية اللغة
  const [sentences] = useState(data);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentlySpeaking, setCurrentlySpeaking] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [voices, setVoices] = useState([]);
  const [customText, setCustomText] = useState("");
  const [isReadingAll, setIsReadingAll] = useState(false);
  const [currentReadingIndex, setCurrentReadingIndex] = useState(0);

  const readingQueue = useRef([]);
  const isReading = useRef(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      stopSpeaking();
    };
  }, []);

  // حساب عدد الصفحات الإجمالي
  const totalPages = Math.ceil(sentences.length / SENTENCES_PER_PAGE);

  // الحصول على الجمل للصفحة الحالية
  const getCurrentPageSentences = () => {
    const startIndex = (currentPage - 1) * SENTENCES_PER_PAGE;
    const endIndex = startIndex + SENTENCES_PER_PAGE;
    return sentences.slice(startIndex, endIndex);
  };

  const speak = (text, absoluteIndex) => {
    if ("speechSynthesis" in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1.0;

      const englishVoice = voices.find((v) => v.lang.includes("en-US"));
      if (englishVoice) utterance.voice = englishVoice;

      utterance.onstart = () => {
        setCurrentlySpeaking(absoluteIndex);
      };

      utterance.onend = () => {
        setCurrentlySpeaking(null);
        isReading.current = false;
        processQueue();
      };

      utterance.onerror = () => {
        setCurrentlySpeaking(null);
        isReading.current = false;
        processQueue();
      };

      window.speechSynthesis.speak(utterance);
      isReading.current = true;
    }
  };

  const toggleSpeech = (index) => {
    const absoluteIndex = (currentPage - 1) * SENTENCES_PER_PAGE + index;
    if (currentlySpeaking === absoluteIndex) {
      stopSpeaking();
      setIsReadingAll(false);
      return;
    }

    if (currentlySpeaking !== null) {
      stopSpeaking();
    }

    speak(getCurrentPageSentences()[index].en, absoluteIndex);
  };

  const speakCustomText = () => {
    if (customText.trim()) {
      stopSpeaking();
      setIsReadingAll(false);

      const utterance = new SpeechSynthesisUtterance(customText);
      utterance.lang = "en-US";
      utterance.rate = 1.0;

      const englishVoice = voices.find((v) => v.lang.includes("en-US"));
      if (englishVoice) utterance.voice = englishVoice;

      utterance.onstart = () => setCurrentlySpeaking("custom");
      utterance.onend = () => setCurrentlySpeaking(null);
      utterance.onerror = () => setCurrentlySpeaking(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setCurrentlySpeaking(null);
      setIsReadingAll(false);
      readingQueue.current = [];
      isReading.current = false;
    }
  };

  const toggleAccordion = (index) => {
    const absoluteIndex = (currentPage - 1) * SENTENCES_PER_PAGE + index;
    setExpandedIndex(expandedIndex === absoluteIndex ? null : absoluteIndex);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    stopSpeaking();
    setExpandedIndex(null);
  };

  const processQueue = () => {
    if (readingQueue.current.length > 0 && !isReading.current) {
      const nextItem = readingQueue.current.shift();
      speak(nextItem.text, nextItem.index);
    } else if (readingQueue.current.length === 0 && isReadingAll) {
      setIsReadingAll(false);
    }
  };

  // قراءة جميع الجمل في الصفحة الحالية
  const toggleReadAllSentences = () => {
    if (isReadingAll) {
      // إذا كانت القراءة الكلية نشطة، أوقفها
      stopSpeaking();
      setIsReadingAll(false);
      readingQueue.current = [];
    } else {
      // ابدأ القراءة الكلية
      const currentSentences = getCurrentPageSentences();
      if (currentSentences.length === 0) return;

      setIsReadingAll(true);

      // إعداد قائمة القراءة
      readingQueue.current = currentSentences.map((sentence, index) => ({
        text: sentence.en,
        index: (currentPage - 1) * SENTENCES_PER_PAGE + index,
      }));

      // بدء معالجة قائمة القراءة
      processQueue();
    }
  };

  // إنشاء أزرار الصفحات
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          style={{
            padding: "8px 12px",
            margin: "0 2px",
            border: "none",
            backgroundColor: currentPage === 1 ? "#4CAF50" : "#f0f0f0",
            color: currentPage === 1 ? "white" : "#333",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pageNumbers.push(<span key="start-ellipsis">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          style={{
            padding: "8px 12px",
            margin: "0 2px",
            border: "none",
            backgroundColor: currentPage === i ? "#4CAF50" : "#f0f0f0",
            color: currentPage === i ? "white" : "#333",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(<span key="end-ellipsis">...</span>);
      }
      pageNumbers.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          style={{
            padding: "8px 12px",
            margin: "0 2px",
            border: "none",
            backgroundColor: currentPage === totalPages ? "#4CAF50" : "#f0f0f0",
            color: currentPage === totalPages ? "white" : "#333",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {totalPages}
        </button>
      );
    }

    return pageNumbers;
  };

  return (
    <div
      style={{
        padding: "16px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        paddingTop: "80px",
      }}
    >
      {/* الحاوية العائمة لإدخال النص */}
      <div
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          backgroundColor: "#2c3e50",
          padding: "12px 16px",
          display: "flex",
          gap: "10px",
          zIndex: "1000",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        }}
      >
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Type text to speak..."
          style={{
            flex: "1",
            padding: "10px",
            borderRadius: "4px",
            border: "none",
            fontSize: "16px",
          }}
          onKeyPress={(e) => e.key === "Enter" && speakCustomText()}
        />
        <button
          onClick={speakCustomText}
          style={{
            padding: "0 16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          Speak
        </button>
      </div>

      <h1
        style={{
          textAlign: "center",
          color: "#2c3e50",
          marginBottom: "24px",
          fontSize: "1.5rem",
          fontWeight: "600",
        }}
      >
        Text to Speech Converter
      </h1>

      {/* زر قراءة جميع الجمل في الصفحة */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={toggleReadAllSentences}
          style={{
            padding: "10px 20px",
            backgroundColor: isReadingAll ? "#e74c3c" : "#3498db",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "background-color 0.3s",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          }}
        >
          {isReadingAll ? "Stop Reading All" : "Read All Sentences"}
          {isReadingAll && (
            <div
              style={{
                width: "16px",
                height: "16px",
                border: "3px solid rgba(255,255,255,0.3)",
                borderRadius: "50%",
                borderTopColor: "white",
                animation: "spin 1s linear infinite",
              }}
            />
          )}
        </button>
      </div>

      {/* عرض الجمل للصفحة الحالية */}
      {getCurrentPageSentences().map((sentence, index) => {
        const absoluteIndex = (currentPage - 1) * SENTENCES_PER_PAGE + index;
        const isCurrentlySpeaking = currentlySpeaking === absoluteIndex;

        return (
          <div
            key={absoluteIndex}
            style={{
              marginBottom: "12px",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              backgroundColor: isCurrentlySpeaking ? "#e3f2fd" : "#fff",
              transition: "all 0.3s ease",
              border: isCurrentlySpeaking
                ? "2px solid #64b5f6"
                : "1px solid #eee",
              transform: isCurrentlySpeaking ? "scale(1.01)" : "scale(1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 16px",
                gap: "12px",
              }}
            >
              {/* زر التشغيل/الإيقاف الموحد */}
              <button
                onClick={() => toggleSpeech(index)}
                style={{
                  padding: "8px",
                  backgroundColor: isCurrentlySpeaking ? "#e74c3c" : "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background-color 0.3s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
                aria-label={isCurrentlySpeaking ? "Stop" : "Play"}
              >
                {isCurrentlySpeaking ? "⏹" : "🔊"}
              </button>

              {/* نص الجملة */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  cursor: "pointer",
                }}
                onClick={() => toggleAccordion(index)}
              >
                <p
                  style={{
                    margin: 0,
                    fontWeight: isCurrentlySpeaking ? "600" : "500",
                    color: isCurrentlySpeaking ? "#1565c0" : "#2c3e50",
                    whiteSpace: "wrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontSize: "0.95rem",
                    lineHeight: "1.5",
                  }}
                >
                  {absoluteIndex + 1}
                  {"-"} {sentence.en}
                </p>
              </div>

              {/* سهم الأكورديون */}
              <div
                style={{
                  transform:
                    expandedIndex === absoluteIndex
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  transition: "transform 0.3s",
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "8px",
                  flexShrink: 0,
                  color: "#7f8c8d",
                }}
                onClick={() => toggleAccordion(index)}
              >
                ▼
              </div>
            </div>

            {/* محتوى الأكورديون (الترجمة العربية) */}
            {expandedIndex === absoluteIndex && (
              <div
                style={{
                  padding: "0 16px 16px 68px",
                  maxHeight: expandedIndex === absoluteIndex ? "500px" : "0",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease-out",
                  wordBreak: "break-word",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#555",
                    lineHeight: "1.6",
                    textAlign: "right",
                    direction: "rtl",
                    fontSize: "0.9rem",
                    padding: "8px 0",
                  }}
                >
                  {sentence.ar}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* شريط التنقل بين الصفحات */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "20px",
          flexWrap: "wrap",
          gap: "5px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "20px",
            flexWrap: "wrap",
            gap: "5px",
          }}
        >
          {renderPageNumbers()}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "20px",
            flexWrap: "wrap",
            gap: "5px",
          }}
        >
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            style={{
              padding: "8px 12px",
              margin: "0 2px",
              border: "none",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            ≪
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: "8px 12px",
              margin: "0 2px",
              border: "none",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            ⟨
          </button>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 12px",
              margin: "0 2px",
              border: "none",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            ⟩
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 12px",
              margin: "0 2px",
              border: "none",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            ≫
          </button>
        </div>
      </div>

      {/* إضافة أنميشن للدوران */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default TextToSpeechPage;
