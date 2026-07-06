import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/theme/app_colors.dart';
import '../../services/speech_recording_progress.dart';

/// Shows whether speech capture is preparing or actively listening.
class SpeechStatusBanner extends StatefulWidget {
  const SpeechStatusBanner({
    super.key,
    required this.phase,
    this.partialTranscript,
    this.micActive = false,
    this.prompt,
  });

  final SpeechRecordingPhase phase;
  final String? partialTranscript;
  final bool micActive;
  final String? prompt;

  @override
  State<SpeechStatusBanner> createState() => _SpeechStatusBannerState();
}

class _SpeechStatusBannerState extends State<SpeechStatusBanner>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final listening = widget.phase == SpeechRecordingPhase.listening;
    final borderColor =
        listening ? AppColors.mintGreen : AppColors.therapyBlue;
    final accentColor =
        listening ? AppColors.mintGreen : AppColors.therapyBlue;
    final prompt = widget.prompt ?? 'ku_isoko.speak_now'.tr;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.pureWhite,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              if (listening)
                FadeTransition(
                  opacity: Tween<double>(begin: 0.45, end: 1).animate(
                    CurvedAnimation(
                      parent: _pulseController,
                      curve: Curves.easeInOut,
                    ),
                  ),
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                  ),
                )
              else
                Icon(Icons.mic_external_on_outlined, size: 18, color: accentColor),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  listening
                      ? 'speech.listening'.tr
                      : 'speech.mic_preparing'.tr,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: accentColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            listening ? prompt : 'speech.mic_permission_hint'.tr,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppColors.mutedText,
              height: 1.35,
            ),
          ),
          if (listening && widget.partialTranscript != null &&
              widget.partialTranscript!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              'speech.heard_transcript'
                  .trParams({'transcript': widget.partialTranscript!}),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.navyObsidian,
                height: 1.35,
              ),
            ),
          ] else if (listening && widget.micActive) ...[
            const SizedBox(height: 6),
            Text(
              'speech.sound_detected'.tr,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.mintGreen,
                height: 1.35,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
