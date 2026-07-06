import 'package:get/get.dart';

import '../../../data/repositories/vocab_repository.dart';
import '../../../services/speech_service.dart';
import '../controllers/at_the_market_controller.dart';

class AtTheMarketBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut(VocabRepository.new);
    Get.lazyPut(SpeechService.new);
    Get.put(
      AtTheMarketController(
        vocabRepository: Get.find<VocabRepository>(),
        speechService: Get.find<SpeechService>(),
      ),
    );
  }
}
