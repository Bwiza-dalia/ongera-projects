enum SpeechRecordingStatus {
  success,
  permissionDenied,
  unavailable,
  failed,
}

class SpeechRecordingResult {
  const SpeechRecordingResult({
    required this.transcript,
    required this.status,
    this.audioPath,
    this.errorMessage,
    this.voiceCaptured = false,
  });

  final String transcript;
  final SpeechRecordingStatus status;
  final String? audioPath;
  final String? errorMessage;

  /// True when the mic picked up audible input during the session.
  final bool voiceCaptured;

  bool get isSuccess => status == SpeechRecordingStatus.success;
}
