enum SpeechRecordingPhase {
  /// Requesting mic permission and initializing speech recognition.
  preparing,

  /// Microphone is open and the app is listening.
  listening,
}

typedef SpeechRecordingProgressCallback = void Function(
  SpeechRecordingPhase phase, {
  String? partialTranscript,
  bool? micActive,
});
