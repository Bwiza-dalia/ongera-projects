import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../controllers/comprehend_controller.dart';
import '../models/comprehend_phase.dart';

class ComprehendActionsPanel extends StatelessWidget {
  const ComprehendActionsPanel({super.key, required this.controller});

  final ComprehendController controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cloudGray,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Instruction card ───────────────────────────────────────────
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.hearing_rounded,
                  size: 40,
                  color: AppColors.therapyBlue,
                ),
                const SizedBox(height: 12),
                Text(
                  'comprehend.prompt'.tr,
                  textAlign: TextAlign.center,
                  style: AppText.body,
                ),
              ],
            ),
          ),

          // ── Listen button ──────────────────────────────────────────────
          Obx(() {
            final isListening =
                controller.phase.value == ComprehendPhase.listening;
            return isListening
                ? _ListeningBanner()
                : _ListenAgainButton(onPressed: controller.onListenAgain);
          }),

          const SizedBox(height: 10),

          // ── Check button ───────────────────────────────────────────────
          Obx(() {
            final canCheck = controller.canCheck;
            return _CheckButton(
              enabled: canCheck,
              onPressed: canCheck ? controller.onCheck : null,
            );
          }),
        ],
      ),
    );
  }
}

class _ListeningBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 13),
      decoration: BoxDecoration(
        color: AppColors.therapyBlueLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.therapyBlue.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.volume_up_rounded, color: AppColors.therapyBlue, size: 18),
          const SizedBox(width: 8),
          Text(
            'comprehend.listen_carefully'.tr,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.therapyBlue,
            ),
          ),
        ],
      ),
    );
  }
}

class _ListenAgainButton extends StatelessWidget {
  const _ListenAgainButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.pureWhite,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 13),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.dividerColor),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.replay_rounded, size: 16, color: AppColors.mutedText),
              const SizedBox(width: 6),
              Text(
                'comprehend.hear_again'.tr,
                style: AppText.small,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CheckButton extends StatelessWidget {
  const _CheckButton({required this.enabled, this.onPressed});

  final bool enabled;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: enabled
          ? AppColors.mintGreen
          : AppColors.mintGreen.withValues(alpha: 0.35),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(14),
        child: SizedBox(
          height: 52,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.check_circle_outline_rounded,
                size: 20,
                color: AppColors.navyObsidian,
              ),
              const SizedBox(width: 8),
              Text(
                'comprehend.check'.tr,
                style: AppText.heading3,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
