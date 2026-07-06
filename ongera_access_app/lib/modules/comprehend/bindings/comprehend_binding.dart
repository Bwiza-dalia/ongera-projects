import 'package:get/get.dart';

import '../../../data/repositories/vocab_repository.dart';
import '../../../services/speech_service.dart';
import '../controllers/comprehend_controller.dart';

class ComprehendBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut(VocabRepository.new);
    Get.lazyPut(SpeechService.new);
    Get.put(
      ComprehendController(
        vocabRepository: Get.find<VocabRepository>(),
        speechService: Get.find<SpeechService>(),
      ),
    );
  }
}
