import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/theme/app_colors.dart';

class ResultOverlay extends StatelessWidget {
  const ResultOverlay({super.key, required this.correct, required this.isRevealed});

  final bool correct;
  final bool isRevealed;

  @override
  Widget build(BuildContext context) {
    final color = correct ? AppColors.mintGreen : AppColors.errorRed;
    final icon = correct ? Icons.check_rounded : Icons.close_rounded;
    final label = correct ? 'common.correct'.tr : 'common.not_quite'.tr;

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 280),
      child: !isRevealed
          ? const SizedBox.shrink(key: ValueKey('empty'))
          : Material(
              key: const ValueKey('overlay'),
              color: Colors.transparent,
              child: Container(
                width: double.infinity,
                height: double.infinity,
                color: AppColors.scrim,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: color.withValues(alpha: 0.45),
                              blurRadius: 28,
                              spreadRadius: 4,
                            ),
                          ],
                        ),
                        child: Icon(
                          icon,
                          size: 58,
                          color: AppColors.pureWhite,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        label,
                        style: const TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.w800,
                          color: AppColors.pureWhite,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
