import React from "react";
import "../styles/TextToSpeechPage.css";

const SentenceItem = React.memo(
  ({
    sentence,
    index,
    currentPage,
    currentlySpeaking,
    expandedIndex,
    toggleSpeech,
    toggleAccordion,
  }) => {
    const absoluteIndex = (currentPage - 1) * 30 + index;
    const isCurrentlySpeaking = currentlySpeaking === absoluteIndex;

    return (
      <div
        className={`sentence-container ${
          isCurrentlySpeaking ? "speaking" : ""
        }`}
      >
        <div className="sentence-header">
          <button
            onClick={() => toggleSpeech(index)}
            className={`play-button ${isCurrentlySpeaking ? "stop" : ""}`}
            aria-label={isCurrentlySpeaking ? "Stop" : "Play"}
          >
            {isCurrentlySpeaking ? "⏹" : "🔊"}
          </button>
          <div className="sentence-text" onClick={() => toggleAccordion(index)}>
            <p
              className={`sentence-en ${isCurrentlySpeaking ? "speaking" : ""}`}
            >
              {absoluteIndex + 1} - {sentence.en}
            </p>
          </div>
          <div
            className={`accordion-arrow ${
              expandedIndex === absoluteIndex ? "expanded" : ""
            }`}
            onClick={() => toggleAccordion(index)}
          >
            ▼
          </div>
        </div>
        {expandedIndex === absoluteIndex && (
          <div className="accordion-content">
            <p className="sentence-ar">{sentence.ar}</p>
          </div>
        )}
      </div>
    );
  }
);

export default SentenceItem;
