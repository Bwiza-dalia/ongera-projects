import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/constants/app_assets.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

/// Shows a full-screen encouragement overlay when the user tries to leave
/// an active exercise session. Returns [true] if they chose to exit.
Future<bool> showExitSessionDialog(BuildContext context) async {
  final exit = await showGeneralDialog<bool>(
    context: context,
    barrierDismissible: false,
    barrierLabel: 'session.exit_barrier'.tr,
    barrierColor: Colors.transparent,
    transitionDuration: const Duration(milliseconds: 220),
    pageBuilder: (_, __, ___) => _ExitSessionScreen(),
    transitionBuilder: (_, animation, __, child) {
      return FadeTransition(
        opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
        child: child,
      );
    },
  );
  return exit ?? false;
}

class _ExitSessionScreen extends StatelessWidget {
  const _ExitSessionScreen();

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.pureWhite,
      child: SafeArea(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Left — message + buttons ──────────────────────────────
            Expanded(
              flex: 3,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(40, 32, 32, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Spacer(),

                    // Encouragement message
                    Text(
                      'session.exit_title'.tr,
                      style: AppText.heading1.copyWith(
                        color: AppColors.navyObsidian,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'session.exit_body'.tr,
                      style: AppText.body.copyWith(
                        color: AppColors.mutedText,
                        height: 1.55,
                      ),
                    ),

                    const Spacer(),

                    // Buttons
                    Row(
                      children: [
                        // End session — outlined secondary
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () =>
                                Navigator.of(context).pop(true),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              side: const BorderSide(
                                color: AppColors.dividerColor,
                                width: 1.5,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: Text(
                              'session.exit_confirm'.tr,
                              style: AppText.body.copyWith(
                                color: AppColors.mutedText,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        // Keep going — filled primary
                        Expanded(
                          flex: 2,
                          child: FilledButton.icon(
                            onPressed: () =>
                                Navigator.of(context).pop(false),
                            style: FilledButton.styleFrom(
                              backgroundColor: AppColors.mintGreen,
                              foregroundColor: AppColors.navyObsidian,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            icon: const Icon(Icons.arrow_forward_rounded,
                                size: 18),
                            iconAlignment: IconAlignment.end,
                            label: Text(
                              'session.exit_continue'.tr,
                              style: AppText.body.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppColors.navyObsidian,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // ── Right — guide avatar ───────────────────────────────────
            Expanded(
              flex: 2,
              child: Container(
                color: AppColors.mintGreenLight,
                child: Image.asset(
                  AppAssets.vendorAvatar,
                  fit: BoxFit.contain,
                  alignment: Alignment.bottomCenter,
                  errorBuilder: (_, _, _) => const SizedBox.shrink(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
