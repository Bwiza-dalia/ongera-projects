import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../services/speech_recording_progress.dart';
import '../../widgets/speech_status_banner.dart';
import '../controllers/at_the_market_controller.dart';
import '../models/cue_level.dart';

/// Right column — response actions, cueing ladder, session stats.
class SessionActionsPanel extends StatelessWidget {
  const SessionActionsPanel({super.key, required this.controller});

  final AtTheMarketController controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.cloudGray,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 6),
                Obx(() {
                  final busy = controller.isBusy;
                  final preparing = controller.isPreparing;
                  final listening = controller.isListening;
                  final partial = controller.liveTranscript.value;
                  final micDetected = controller.micActive.value;
                  final itemWord = controller.currentItem?.word;

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _ResponseActions(
                        onListen: controller.onListen,
                        onRepeat: controller.onRepeat,
                        onHelpMe: controller.onHelpMe,
                        disabled: busy,
                      ),
                      if (preparing || listening) ...[
                        const SizedBox(height: 6),
                        SpeechStatusBanner(
                          phase: listening
                              ? SpeechRecordingPhase.listening
                              : SpeechRecordingPhase.preparing,
                          partialTranscript: partial,
                          micActive: micDetected,
                          prompt: itemWord != null
                              ? 'ku_isoko.speak_word_now'
                                  .trParams({'word': itemWord})
                              : 'ku_isoko.speak_now'.tr,
                        ),
                      ],
                    ],
                  );
                }),
                const SizedBox(height: 6),
                const Divider(color: AppColors.dividerColor, height: 1),
                const SizedBox(height: 6),
                _SectionLabel('ku_isoko.cue_ladder_heading'.tr),
                const SizedBox(height: 6),
                Expanded(
                  child: Obx(() {
                    final hints = controller.revealedCueHints;

                    return _AccumulatedCuePanel(hints: hints);
                  }),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ResponseActions extends StatelessWidget {
  const _ResponseActions({
    required this.onListen,
    required this.onRepeat,
    required this.onHelpMe,
    this.disabled = false,
  });

  final VoidCallback onListen;
  final VoidCallback onRepeat;
  final VoidCallback onHelpMe;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _ColoredActionButton(
            label: 'ku_isoko.listen'.tr,
            icon: Icons.volume_up_rounded,
            backgroundColor: AppColors.therapyBlue,
            foregroundColor: AppColors.pureWhite,
            onPressed: disabled ? null : onListen,
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: _ColoredActionButton(
            label: 'ku_isoko.repeat'.tr,
            icon: Icons.mic_rounded,
            backgroundColor: AppColors.mintGreen,
            foregroundColor: AppColors.navyObsidian,
            onPressed: disabled ? null : onRepeat,
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: _ColoredActionButton(
            label: 'ku_isoko.hint'.tr,
            icon: Icons.help_outline_rounded,
            backgroundColor: AppColors.warmAmber,
            foregroundColor: AppColors.pureWhite,
            onPressed: disabled ? null : onHelpMe,
          ),
        ),
      ],
    );
  }
}

class _AccumulatedCuePanel extends StatelessWidget {
  const _AccumulatedCuePanel({required this.hints});

  final List<({CueLevel level, String text})> hints;

  @override
  Widget build(BuildContext context) {
    if (hints.isEmpty) {
      return Container(
        alignment: Alignment.center,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.pureWhite,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.dividerColor),
        ),
        child: Text(
          'ku_isoko.no_hint_yet'.tr,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13,
            height: 1.4,
            color: AppColors.mutedText,
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.pureWhite,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.therapyBlue.withValues(alpha: 0.45),
        ),
      ),
      child: ListView.separated(
        itemCount: hints.length,
        separatorBuilder: (_, _) => const Padding(
          padding: EdgeInsets.symmetric(vertical: 8),
          child: Divider(color: AppColors.dividerColor, height: 1),
        ),
        itemBuilder: (context, index) {
          final hint = hints[index];
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _CueBadge(level: hint.level),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  hint.text,
                  style: const TextStyle(
                    fontSize: 13,
                    height: 1.4,
                    fontWeight: FontWeight.w600,
                    color: AppColors.therapyBlue,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.9,
        color: AppColors.mutedText,
      ),
    );
  }
}

class _ColoredActionButton extends StatelessWidget {
  const _ColoredActionButton({
    required this.label,
    required this.icon,
    required this.backgroundColor,
    required this.foregroundColor,
    this.onPressed,
  });

  final String label;
  final IconData icon;
  final Color backgroundColor;
  final Color foregroundColor;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;

    return Material(
      color: enabled
          ? backgroundColor
          : backgroundColor.withValues(alpha: 0.45),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(10),
        child: SizedBox(
          height: 36,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: foregroundColor),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: foregroundColor,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CueBadge extends StatelessWidget {
  const _CueBadge({required this.level});

  final CueLevel level;

  @override
  Widget build(BuildContext context) {
    final isFullModel = level == CueLevel.fullModel;

    return Container(
      width: 26,
      height: 26,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppColors.therapyBlue,
        shape: BoxShape.circle,
      ),
      child: isFullModel
          ? const Icon(
              Icons.volume_up_rounded,
              size: 14,
              color: AppColors.pureWhite,
            )
          : Text(
              '${level.stepNumber}',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.pureWhite,
              ),
            ),
    );
  }
}
