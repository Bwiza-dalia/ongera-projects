import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ongera_access_app/modules/widgets/exit_session_dialog.dart';
import 'package:ongera_access_app/modules/widgets/exercise_intro_screen.dart';
import 'package:ongera_access_app/modules/widgets/how_to_dialog.dart';
import 'package:ongera_access_app/modules/widgets/progress_section.dart';

import '../../../core/constants/app_assets.dart';

import '../../../core/theme/app_colors.dart';
import '../../widgets/module_app_bar.dart';
import '../../widgets/result_overlay.dart';
import '../../widgets/top_action.dart';
import '../controllers/comprehend_controller.dart';
import '../models/comprehend_phase.dart';
import '../widgets/comprehend_actions_panel.dart';
import '../widgets/image_choice_grid.dart';

class ComprehendView extends GetView<ComprehendController> {
  const ComprehendView({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      if (!controller.sessionStarted.value) {
        return ExerciseIntroScreen(
          title: 'comprehend.screen_title'.tr,
          videoAsset: AppAssets.comprehendGuideline,
          accentColor: AppColors.therapyBlue,
          onBegin: controller.startSession,
        );
      }
      return _GameScreen(controller: controller);
    });
  }
}

class _GameScreen extends StatelessWidget {
  const _GameScreen({required this.controller});

  final ComprehendController controller;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // ── Scaffold (main game) ─────────────────────────────────────────
        PopScope(
          canPop: false,
          onPopInvokedWithResult: (didPop, _) async {
            if (didPop) return;
            final shouldExit = await showExitSessionDialog(context);
            if (shouldExit && context.mounted) Get.back();
          },
          child: Scaffold(
            backgroundColor: AppColors.pureWhite,
            appBar: ModuleAppBar(
              title: 'comprehend.screen_title'.tr,
              hideProgress: true,
              hideSettings: true,
              actions: [
                TopAction(
                  icon: Icons.ondemand_video,
                  label: 'comprehend.how_to'.tr,
                  onTap: () => showHowToDialog(
                    context,
                    videoAsset: AppAssets.comprehendGuideline,
                    accentColor: AppColors.therapyBlue,
                  ),
                ),
                TopAction(
                  icon: Icons.lightbulb_outline_rounded,
                  label: 'comprehend.hints'.tr,
                  onTap: () {},
                ),
              ],
            ),
            body: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Left column — horizontal image row dominates
                    Expanded(
                      flex: 5,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(
                            child: ImageChoiceGrid(controller: controller),
                          ),
                          const SizedBox(height: 8),
                          Obx(
                            () => ProgressSection(
                              collected: controller.itemsCompleted.value,
                              total: controller.totalItems,
                              fraction: controller.progressFraction,
                              hints: controller.itemsCompleted.value,
                              expanded: true,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    // Right column — instruction + listen + check
                    Expanded(
                      flex: 2,
                      child: ComprehendActionsPanel(controller: controller),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),

        // ── Result overlay — covers AppBar + body ───────────────────────
        Obx(() {
          final isRevealed = controller.phase.value == ComprehendPhase.revealed;
          final correct = controller.lastAnswerCorrect.value == true;

          return ResultOverlay(correct: correct, isRevealed: isRevealed);
        }),
      ],
    );
  }
}
