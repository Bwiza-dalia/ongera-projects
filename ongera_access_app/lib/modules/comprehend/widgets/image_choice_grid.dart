import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../controllers/comprehend_controller.dart';
import '../models/comprehend_phase.dart';

class ImageChoiceGrid extends StatelessWidget {
  const ImageChoiceGrid({super.key, required this.controller});

  final ComprehendController controller;

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final choices = controller.choiceItems;
      final selected = controller.selectedId.value;
      final phase = controller.phase.value;
      final correct = controller.lastAnswerCorrect.value;
      final correctId = controller.currentItem?.id;
      final isRevealed = phase == ComprehendPhase.revealed;
      final isListening = phase == ComprehendPhase.listening;

      return Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: List.generate(choices.length, (index) {
          final item = choices[index];
          final isSelected = item.id == selected;
          final isCorrectAnswer = item.id == correctId;
          final isLast = index == choices.length - 1;

          // Border colour
          Color borderColor = AppColors.dividerColor;
          double borderWidth = 1.5;
          if (isRevealed) {
            if (isCorrectAnswer) {
              borderColor = AppColors.mintGreen;
              borderWidth = 3;
            } else if (isSelected) {
              borderColor = AppColors.errorRed;
              borderWidth = 3;
            }
          } else if (isSelected) {
            borderColor = AppColors.therapyBlue;
            borderWidth = 3;
          }

          // Corner badge for revealed state
          Widget? badge;
          if (isRevealed && isSelected) {
            final isRight = correct == true;
            badge = Positioned(
              top: 8,
              right: 8,
              child: _Badge(
                icon: isRight ? Icons.check_rounded : Icons.close_rounded,
                color: isRight ? AppColors.mintGreen : AppColors.errorRed,
              ),
            );
          } else if (isRevealed && isCorrectAnswer && correct == false) {
            badge = const Positioned(
              top: 8,
              right: 8,
              child: _Badge(
                icon: Icons.check_rounded,
                color: AppColors.mintGreen,
              ),
            );
          }

          return Expanded(
            child: Padding(
              padding: EdgeInsets.only(right: isLast ? 0 : 10),
              child: GestureDetector(
                onTap: isListening || isRevealed
                    ? null
                    : () => controller.onChoiceTapped(item.id),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  decoration: BoxDecoration(
                    color: AppColors.cloudGray,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: borderColor, width: borderWidth),
                  ),
                  child: Stack(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(8),
                        child: Image.asset(
                          item.imageUrl,
                          fit: BoxFit.contain,
                          width: double.infinity,
                          height: double.infinity,
                          errorBuilder: (_, _, _) => const Center(
                            child: Icon(
                              Icons.image_not_supported_rounded,
                              color: AppColors.mutedText,
                              size: 36,
                            ),
                          ),
                        ),
                      ),
                      ?badge,
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
      );
    });
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.icon, required this.color});

  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      child: Icon(icon, size: 18, color: AppColors.pureWhite),
    );
  }
}
