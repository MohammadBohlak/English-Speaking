import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { data } from "../data/sentences";
import SentenceItem from "./SentenceItem";
import "../styles/TextToSpeechPage.css";

const SENTENCES_PER_PAGE = 30;

const TextToSpeechPage = () => {
  const [sentences] = useState(data);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentlySpeaking, setCurrentlySpeaking] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [voices, setVoices] = useState([]);
  const [customText, setCustomText] = useState("");
  const [isReadingAll, setIsReadingAll] = useState(false);

  const readingQueue = useRef([]);
  const isReading = useRef(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      } else {
        setTimeout(loadVoices, 100);
      }
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      stopSpeaking();
    };
  }, []);

  const totalPages = Math.ceil(sentences.length / SENTENCES_PER_PAGE);

  const currentPageSentences = useMemo(() => {
    const startIndex = (currentPage - 1) * SENTENCES_PER_PAGE;
    const endIndex = startIndex + SENTENCES_PER_PAGE;
    return sentences.slice(startIndex, endIndex);
  }, [currentPage, sentences]);

  const processQueue = useCallback(() => {
    if (readingQueue.current.length > 0 && !isReading.current) {
      const nextItem = readingQueue.current.shift();
      speak(nextItem.text, nextItem.index);
    } else if (readingQueue.current.length === 0 && isReadingAll) {
      setIsReadingAll(false);
    }
  }, [isReadingAll]);

  const speak = useCallback(
    (text, absoluteIndex) => {
      if ("speechSynthesis" in window && text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 1.0;
        const englishVoice = voices.find((v) => v.lang.includes("en-US"));
        if (englishVoice) utterance.voice = englishVoice;
        utterance.onstart = () => setCurrentlySpeaking(absoluteIndex);
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
    },
    [voices, processQueue]
  );

  const toggleSpeech = useCallback(
    (index) => {
      const absoluteIndex = (currentPage - 1) * SENTENCES_PER_PAGE + index;
      if (currentlySpeaking === absoluteIndex) {
        stopSpeaking();
        setIsReadingAll(false);
        return;
      }
      if (currentlySpeaking !== null) {
        stopSpeaking();
      }
      speak(currentPageSentences[index].en, absoluteIndex);
    },
    [currentPage, currentlySpeaking, currentPageSentences, speak]
  );

  const speakCustomText = useCallback(() => {
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
  }, [customText, voices]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setCurrentlySpeaking(null);
      setIsReadingAll(false);
      readingQueue.current = [];
      isReading.current = false;
    }
  }, []);

  const toggleAccordion = useCallback(
    (index) => {
      const absoluteIndex = (currentPage - 1) * SENTENCES_PER_PAGE + index;
      setExpandedIndex(expandedIndex === absoluteIndex ? null : absoluteIndex);
    },
    [currentPage, expandedIndex]
  );

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(page);
      stopSpeaking();
      setExpandedIndex(null);
    },
    [stopSpeaking]
  );

  const toggleReadAllSentences = useCallback(() => {
    if (isReadingAll) {
      stopSpeaking();
      setIsReadingAll(false);
      readingQueue.current = [];
    } else {
      const sentencesToRead = currentPageSentences.slice(0, 10);
      if (sentencesToRead.length === 0) return;
      setIsReadingAll(true);
      readingQueue.current = sentencesToRead.map((sentence, index) => ({
        text: sentence.en,
        index: (currentPage - 1) * SENTENCES_PER_PAGE + index,
      }));
      processQueue();
    }
  }, [isReadingAll, currentPageSentences, processQueue]);

  const renderPageNumbers = useCallback(() => {
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
          className={`page-button ${currentPage === 1 ? "active" : ""}`}
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
          className={`page-button ${currentPage === i ? "active" : ""}`}
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
          className={`page-button ${
            currentPage === totalPages ? "active" : ""
          }`}
        >
          {totalPages}
        </button>
      );
    }

    return pageNumbers;
  }, [currentPage, totalPages, handlePageChange]);

  return (
    <div className="tts-container">
      <div className="custom-text-container">
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Type text to speak..."
          className="custom-text-input"
          onKeyPress={(e) => e.key === "Enter" && speakCustomText()}
        />
        <button onClick={speakCustomText} className="speak-button">
          Speak
        </button>
      </div>

      <h1 className="tts-title">Text to Speech Converter</h1>

      <div className="read-all-container">
        <button
          onClick={toggleReadAllSentences}
          className={`read-all-button ${isReadingAll ? "stop" : ""}`}
        >
          {isReadingAll ? (
            <>
              Stop Reading All
              <div className="spinner" />
            </>
          ) : (
            "Read All Sentences"
          )}
        </button>
      </div>

      {currentPageSentences.map((sentence, index) => (
        <SentenceItem
          key={(currentPage - 1) * SENTENCES_PER_PAGE + index}
          sentence={sentence}
          index={index}
          currentPage={currentPage}
          currentlySpeaking={currentlySpeaking}
          expandedIndex={expandedIndex}
          toggleSpeech={toggleSpeech}
          toggleAccordion={toggleAccordion}
        />
      ))}

      <div className="pagination-container">
        <div className="pagination">
          <div className="page-numbers">{renderPageNumbers()}</div>
          <div className="pagination-buttons">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="nav-button"
            >
              ≪
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="nav-button"
            >
              ⟨
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="nav-button"
            >
              ⟩
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="nav-button"
            >
              ≫
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeechPage;
