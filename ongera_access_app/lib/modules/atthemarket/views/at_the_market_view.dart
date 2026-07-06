import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/exercise_intro_screen.dart';
import '../../widgets/exit_session_dialog.dart';
import '../../widgets/module_app_bar.dart';
import '../../widgets/progress_section.dart';
import '../controllers/at_the_market_controller.dart';
import '../widgets/session_actions_panel.dart';
import '../widgets/vendor_speech_panel.dart';

class AtTheMarketView extends GetView<AtTheMarketController> {
  const AtTheMarketView({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      if (!controller.sessionStarted.value) {
        return ExerciseIntroScreen(
          title: 'At the Market',
          videoAsset: AppAssets.atTheMarketGuideline,
          accentColor: AppColors.mintGreen,
          onBegin: controller.startSession,
        );
      }
      return _GameScreen(controller: controller);
    });
  }
}

class _GameScreen extends StatelessWidget {
  const _GameScreen({required this.controller});

  final AtTheMarketController controller;

  @override
  Widget build(BuildContext context) {
    return PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) async {
          if (didPop) return;
          final shouldExit = await showExitSessionDialog(context);
          if (shouldExit && context.mounted) Get.back();
        },
        child: Scaffold(
          backgroundColor: AppColors.pureWhite,
          appBar: ModuleAppBar(title: 'ku_isoko.screen_title'.tr),
          body: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const VendorSpeechPanel(),
                        const SizedBox(height: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Expanded(
                                child: Obx(() {
                                  final item = controller.currentItem;
                                  final imagePath =
                                      item?.imageUrl ?? AppAssets.irishPotato;

                                  return _ItemImageCard(assetPath: imagePath);
                                }),
                              ),
                              const SizedBox(height: 12),
                              Obx(() {
                                final collected = controller.itemsCollected
                                    .value;
                                final total = controller.sessionItems.length;
                                final hints = controller.hintsUsed.value;
                                final fraction = controller.progressFraction;

                                return ProgressSection(
                                  collected: collected,
                                  total: total,
                                  hints: hints,
                                  fraction: fraction,
                                  expanded: true,
                                );
                              }),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(child: SessionActionsPanel(controller: controller)),
                ],
              ),
            ),
          ),
        )
    );
  }
}

class _ItemImageCard extends StatelessWidget {
  const _ItemImageCard({required this.assetPath});

  final String assetPath;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.cloudGray,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.mintGreen.withValues(alpha: 0.55),
          width: 2,
        ),
      ),
      child: Image.asset(assetPath, fit: BoxFit.contain),
    );
  }
}
