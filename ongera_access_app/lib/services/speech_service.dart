import 'dart:async';
import 'dart:io';

import 'package:flutter_tts/flutter_tts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:record/record.dart';

import 'speech_recording_progress.dart';
import 'speech_recording_result.dart';

/// TTS playback + real microphone recording via the [record] package.
///
/// Audio is saved to a temp `.m4a` file ([lastRecordingPath]) for a future
/// FastAPI pronunciation check. Device STT is not used here because it cannot
/// share the mic with [AudioRecorder] at the same time.
class SpeechService {
  SpeechService() {
    _tts.setSpeechRate(0.45);
  }

  static const _recordConfig = RecordConfig(
    encoder: AudioEncoder.aacLc,
    sampleRate: 44100,
    numChannels: 1,
    bitRate: 128000,
  );

  final FlutterTts _tts = FlutterTts();
  final AudioRecorder _recorder = AudioRecorder();

  String? _lastRecordingPath;

  String? get lastRecordingPath => _lastRecordingPath;

  Future<void> speak(String text) async {
    await _tts.setLanguage('rw-RW');
    await _tts.speak(text);
  }

  Future<void> stop() async {
    await _tts.stop();
    if (await _recorder.isRecording()) {
      await _recorder.stop();
    }
  }

  /// Captures microphone audio to a local file.
  Future<SpeechRecordingResult> recordSpeech({
    Duration listenFor = const Duration(seconds: 5),
    SpeechRecordingProgressCallback? onProgress,
  }) async {
    onProgress?.call(SpeechRecordingPhase.preparing);

    if (!Platform.isAndroid && !Platform.isIOS) {
      return const SpeechRecordingResult(
        transcript: '',
        status: SpeechRecordingStatus.unavailable,
        errorMessage: 'Recording is only supported on iOS and Android.',
      );
    }

    await _tts.stop();

    final micGranted = await _ensureMicrophonePermission();
    if (!micGranted) {
      return SpeechRecordingResult(
        transcript: '',
        status: SpeechRecordingStatus.permissionDenied,
        errorMessage: _microphoneDeniedMessage(),
      );
    }

    final audioPath = await _createRecordingPath();
    String? recordingPath;
    StreamSubscription<Amplitude>? amplitudeSub;
    var voiceCaptured = false;

    try {
      await _recorder.start(_recordConfig, path: audioPath);

      if (!await _recorder.isRecording()) {
        return const SpeechRecordingResult(
          transcript: '',
          status: SpeechRecordingStatus.failed,
          errorMessage: 'Could not start the microphone recorder.',
        );
      }

      onProgress?.call(SpeechRecordingPhase.listening, micActive: false);

      amplitudeSub = _recorder
          .onAmplitudeChanged(const Duration(milliseconds: 150))
          .listen((Amplitude amplitude) {
        final active = amplitude.current > -45;
        if (active) voiceCaptured = true;
        onProgress?.call(
          SpeechRecordingPhase.listening,
          micActive: active,
        );
      });

      await Future<void>.delayed(listenFor);
    } catch (error) {
      return SpeechRecordingResult(
        transcript: '',
        status: SpeechRecordingStatus.failed,
        errorMessage: error.toString(),
      );
    } finally {
      await amplitudeSub?.cancel();
      if (await _recorder.isRecording()) {
        recordingPath = await _recorder.stop();
      }
    }

    final savedPath = recordingPath ?? audioPath;
    _lastRecordingPath = savedPath;

    if (!await _recordingFileIsValid(savedPath)) {
      return const SpeechRecordingResult(
        transcript: '',
        status: SpeechRecordingStatus.failed,
        errorMessage: 'No audio was saved. Check microphone access and try again.',
      );
    }

    if (!voiceCaptured) {
      voiceCaptured = await _recordingFileIsValid(savedPath, minBytes: 2048);
    }

    return SpeechRecordingResult(
      transcript: '',
      status: SpeechRecordingStatus.success,
      audioPath: savedPath,
      voiceCaptured: voiceCaptured,
    );
  }

  /// Records speech and returns the saved file path.
  ///
  /// Transcript is empty until a backend STT endpoint processes [audioPath].
  Future<SpeechRecordingResult> recordAndTranscribe({
    Duration listenFor = const Duration(seconds: 5),
    Duration pauseFor = const Duration(seconds: 2),
    SpeechRecordingProgressCallback? onProgress,
  }) {
    return recordSpeech(listenFor: listenFor, onProgress: onProgress);
  }

  /// Compares a transcript to the expected word (for future backend STT).
  bool verifyAttempt({
    required String expectedWord,
    required String transcript,
  }) {
    if (transcript.trim().isEmpty) return false;

    final expected = _normalize(expectedWord);
    final spoken = _normalize(transcript);

    if (spoken == expected) return true;

    return spoken.contains(expected) || expected.contains(spoken);
  }

  Future<bool> _ensureMicrophonePermission() async {
    if (await _recorder.hasPermission(request: true)) {
      return true;
    }

    var status = await Permission.microphone.status;
    if (status.isGranted) {
      return _recorder.hasPermission(request: false);
    }

    status = await Permission.microphone.request();
    if (status.isGranted) {
      return _recorder.hasPermission(request: false);
    }

    return false;
  }

  Future<bool> _recordingFileIsValid(
    String path, {
    int minBytes = 512,
  }) async {
    final file = File(path);
    if (!await file.exists()) return false;
    final length = await file.length();
    return length >= minBytes;
  }

  String _microphoneDeniedMessage() {
    return 'Microphone permission is required. Allow access in Settings if you previously denied it.';
  }

  Future<String> _createRecordingPath() async {
    final dir = await getTemporaryDirectory();
    return '${dir.path}/speech_${DateTime.now().millisecondsSinceEpoch}.m4a';
  }

  String _normalize(String value) =>
      value.trim().toLowerCase().replaceAll(RegExp(r'\s+'), ' ');
}
