import 'dart:math';

import 'package:get/get.dart';

import '../../../routes/app_routes.dart';
import '../../../data/repositories/vocab_repository.dart';
import '../../../services/speech_service.dart';
import '../../atthemarket/models/vocab_item.dart';
import '../models/comprehend_phase.dart';

class ComprehendController extends GetxController {
  ComprehendController({
    required this.vocabRepository,
    required this.speechService,
  });

  final VocabRepository vocabRepository;
  final SpeechService speechService;

  final sessionItems = <VocabItem>[].obs;
  final currentItemIndex = 0.obs;
  final phase = ComprehendPhase.listening.obs;

  final choiceItems = <VocabItem>[].obs;
  final selectedId = Rx<String?>(null);
  final lastAnswerCorrect = Rx<bool?>(null);

  final itemsCompleted = 0.obs;
  final correctCount = 0.obs;

  final sessionStarted = false.obs;

  VocabItem? get currentItem =>
      sessionItems.isEmpty ? null : sessionItems[currentItemIndex.value];

  int get totalItems => sessionItems.length;

  double get progressFraction =>
      totalItems == 0 ? 0 : (itemsCompleted.value / totalItems).clamp(0.0, 1.0);

  int get accuracyPercent {
    final done = itemsCompleted.value;
    if (done == 0) return 0;
    return ((correctCount.value / done) * 100).round().clamp(0, 100);
  }

  bool get canCheck =>
      phase.value == ComprehendPhase.selecting && selectedId.value != null;

  @override
  void onInit() {
    super.onInit();
    _loadSession();
  }

  void startSession() {
    sessionStarted.value = true;
    _prepareQuestion();
  }

  @override
  void onClose() {
    speechService.stop();
    super.onClose();
  }

  Future<void> _loadSession() async {
    final all = await vocabRepository.loadItems();
    sessionItems.assignAll(all.take(10).toList());
    // TTS auto-play deferred until user taps "Let's Begin"
  }

  Future<void> _prepareQuestion() async {
    selectedId.value = null;
    lastAnswerCorrect.value = null;
    _buildChoices();
    phase.value = ComprehendPhase.listening;
    await _playWord();
    phase.value = ComprehendPhase.selecting;
  }

  void _buildChoices() {
    final item = currentItem;
    if (item == null) return;
    final pool = sessionItems.where((v) => v.id != item.id).toList()
      ..shuffle(Random());
    final all = [item, ...pool.take(2)]..shuffle(Random());
    choiceItems.assignAll(all);
  }

  Future<void> _playWord() async {
    final item = currentItem;
    if (item == null) return;
    await speechService.speak(item.word);
  }

  void onChoiceTapped(String id) {
    if (phase.value != ComprehendPhase.selecting) return;
    selectedId.value = id;
  }

  void onCheck() {
    if (!canCheck) return;
    final correct = selectedId.value == currentItem?.id;
    lastAnswerCorrect.value = correct;
    if (correct) correctCount.value++;
    itemsCompleted.value++;
    phase.value = ComprehendPhase.revealed;
    Future.delayed(const Duration(milliseconds: 1600), _advance);
  }

  Future<void> onListenAgain() async {
    if (phase.value == ComprehendPhase.listening) return;
    phase.value = ComprehendPhase.listening;
    await _playWord();
    phase.value = ComprehendPhase.selecting;
  }

  void _advance() {
    if (currentItemIndex.value >= sessionItems.length - 1) {
      Get.offNamed(Routes.ATTHEMARKET);
      return;
    }
    currentItemIndex.value++;
    _prepareQuestion();
  }
}
