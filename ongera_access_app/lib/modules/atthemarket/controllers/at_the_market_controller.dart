import 'package:get/get.dart';

import '../../../data/repositories/vocab_repository.dart';
import '../../../services/speech_recording_progress.dart';
import '../../../services/speech_recording_result.dart';
import '../../../services/speech_service.dart';
import '../models/cue_level.dart';
import '../models/session_activity.dart';
import '../models/vocab_item.dart';

class AtTheMarketController extends GetxController {
  AtTheMarketController({
    required this._vocabRepository,
    required this._speechService,
  });

  final VocabRepository _vocabRepository;
  final SpeechService _speechService;

  final sessionItems = <VocabItem>[].obs;
  final currentItemIndex = 0.obs;
  final itemsCollected = 0.obs;
  final hintsUsed = 0.obs;
  final revealedCueLevels = <CueLevel>[].obs;
  final activity = SessionActivity.idle.obs;
  final hasListenedToCurrentItem = false.obs;
  final mustRepeatBeforeNextHelp = false.obs;
  final liveTranscript = ''.obs;
  final micActive = false.obs;

  final sessionStarted = false.obs;

  final accuracyPercent = 82.obs;
  final avgHints = 0.0.obs;
  final streakDays = 4.obs;

  int _totalAttempts = 0;
  int _correctAttempts = 0;

  int get totalItems => sessionItems.length;

  VocabItem? get currentItem {
    if (sessionItems.isEmpty) return null;
    return sessionItems[currentItemIndex.value];
  }

  double get progressFraction {
    if (totalItems <= 0) return 0;
    return (itemsCollected.value / totalItems).clamp(0.0, 1.0);
  }

  bool get isBusy =>
      activity.value == SessionActivity.playingAudio ||
      activity.value == SessionActivity.preparing ||
      activity.value == SessionActivity.listening;

  bool get isListening => activity.value == SessionActivity.listening;

  bool get isPreparing => activity.value == SessionActivity.preparing;

  /// All cue steps revealed so far for the current item (oldest first).
  List<({CueLevel level, String text})> get revealedCueHints {
    final item = currentItem;
    if (item == null || revealedCueLevels.isEmpty) return const [];

    return revealedCueLevels
        .map((level) => (level: level, text: _hintTextForLevel(item, level)))
        .toList();
  }

  CueLevel? get nextCueLevel {
    if (revealedCueLevels.isEmpty) return CueLevel.semantic;
    return revealedCueLevels.last.next;
  }

  String _hintTextForLevel(VocabItem item, CueLevel level) {
    return switch (level) {
      CueLevel.semantic => item.semanticHint,
      CueLevel.phonemic => 'ku_isoko.phonemic_first'
          .trParams({'sound': item.phonemicHint}),
      CueLevel.syllable => item.syllableBreakdown,
      CueLevel.fullModel =>
        'ku_isoko.full_model_repeat'.trParams({'word': item.word}),
      CueLevel.none => '',
    };
  }

  @override
  void onInit() {
    super.onInit();
    _loadSession();
  }

  @override
  void onClose() {
    _speechService.stop();
    super.onClose();
  }

  Future<void> _loadSession() async {
    final allItems = await _vocabRepository.loadItems();
    sessionItems.assignAll(allItems.take(10).toList());
    _resetItemState();
    // TTS and session deferred until user taps "Let's Begin"
  }

  void startSession() => sessionStarted.value = true;

  Future<void> onListen() async {
    final item = currentItem;
    if (item == null || isBusy) return;

    activity.value = SessionActivity.playingAudio;
    try {
      await _speechService.speak(item.word);
      hasListenedToCurrentItem.value = true;
    } finally {
      activity.value = SessionActivity.idle;
    }
  }

  Future<void> onRepeat() async {
    final item = currentItem;
    if (item == null || isBusy) return;

    if (!hasListenedToCurrentItem.value) {
      Get.snackbar(
        'ku_isoko.listen_first_title'.tr,
        'ku_isoko.listen_first_body'.trParams({'word': item.word}),
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 3),
      );
      return;
    }

    activity.value = SessionActivity.preparing;
    micActive.value = false;

    final result = await _speechService.recordSpeech(
      onProgress: (phase, {partialTranscript, micActive}) {
        activity.value = phase == SpeechRecordingPhase.listening
            ? SessionActivity.listening
            : SessionActivity.preparing;
        if (micActive != null) {
          this.micActive.value = micActive;
        }
      },
    );

    activity.value = SessionActivity.idle;

    if (result.status == SpeechRecordingStatus.permissionDenied) {
      Get.snackbar(
        'ku_isoko.mic_needed_title'.tr,
        result.errorMessage ?? 'ku_isoko.mic_needed_body'.tr,
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 3),
      );
      return;
    }

    if (result.status == SpeechRecordingStatus.unavailable ||
        result.status == SpeechRecordingStatus.failed) {
      Get.snackbar(
        'ku_isoko.recording_failed_title'.tr,
        result.errorMessage ?? 'ku_isoko.recording_failed_body'.tr,
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 3),
      );
      return;
    }

    if (!result.voiceCaptured) {
      Get.snackbar(
        'ku_isoko.no_voice_title'.tr,
        'ku_isoko.no_voice_body'.tr,
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 3),
      );
      return;
    }

    _totalAttempts++;

    final isCorrect = _speechService.verifyAttempt(
      expectedWord: item.word,
      transcript: result.transcript,
    );

    mustRepeatBeforeNextHelp.value = false;

    if (isCorrect) {
      _correctAttempts++;
      _updateAccuracy();
      await _handleCorrectAttempt();
    } else {
      Get.snackbar(
        'ku_isoko.voice_recorded_title'.tr,
        result.transcript.isEmpty
            ? 'ku_isoko.voice_recorded_saved'.tr
            : 'ku_isoko.voice_recorded_wrong'
                .trParams({'transcript': result.transcript}),
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 3),
      );
    }
  }

  Future<void> onHelpMe() async {
    final item = currentItem;
    if (item == null || isBusy) return;

    if (mustRepeatBeforeNextHelp.value) {
      Get.snackbar(
        'ku_isoko.repeat_first_title'.tr,
        'ku_isoko.repeat_first_body'.trParams({'word': item.word}),
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 3),
      );
      return;
    }

    final nextLevel = nextCueLevel;

    if (nextLevel == null) {
      Get.snackbar(
        'ku_isoko.last_cue_title'.tr,
        'ku_isoko.last_cue_body'.tr,
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 3),
      );
      return;
    }

    revealedCueLevels.add(nextLevel);
    hintsUsed.value++;
    mustRepeatBeforeNextHelp.value = true;
    _updateAvgHints();

    if (nextLevel == CueLevel.fullModel) {
      activity.value = SessionActivity.playingAudio;
      try {
        await _speechService.speak(item.word);
        hasListenedToCurrentItem.value = true;
      } finally {
        activity.value = SessionActivity.idle;
      }
    }
  }

  Future<void> _handleCorrectAttempt() async {
    itemsCollected.value++;

    Get.snackbar(
      'ku_isoko.well_done_title'.tr,
      currentItem != null
          ? 'ku_isoko.well_done_word'.trParams({'word': currentItem!.word})
          : 'ku_isoko.correct'.tr,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Get.theme.colorScheme.primary.withValues(alpha: 0.9),
      duration: const Duration(seconds: 2),
    );

    if (currentItemIndex.value >= sessionItems.length - 1) {
      await Future<void>.delayed(const Duration(milliseconds: 800));
      Get.snackbar(
        'ku_isoko.session_complete_title'.tr,
        'ku_isoko.session_complete_body'.trParams({
          'collected': '${itemsCollected.value}',
          'total': '$totalItems',
        }),
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 4),
      );
      return;
    }

    currentItemIndex.value++;
    _resetItemState();
  }

  void _resetItemState() {
    revealedCueLevels.clear();
    hasListenedToCurrentItem.value = false;
    mustRepeatBeforeNextHelp.value = false;
    activity.value = SessionActivity.idle;
  }

  void _updateAccuracy() {
    if (_totalAttempts == 0) return;
    accuracyPercent.value =
        ((_correctAttempts / _totalAttempts) * 100).round().clamp(0, 100);
  }

  void _updateAvgHints() {
    if (itemsCollected.value == 0) {
      avgHints.value = hintsUsed.value.toDouble();
      return;
    }
    avgHints.value = hintsUsed.value / itemsCollected.value;
  }
}
