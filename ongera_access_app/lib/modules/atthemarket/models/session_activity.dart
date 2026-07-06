enum SessionActivity {
  idle,
  playingAudio,

  /// Permissions + speech engine setup — not listening yet.
  preparing,

  /// Microphone is active and speech is being captured.
  listening,
}
