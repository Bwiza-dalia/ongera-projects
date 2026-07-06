import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/theme/app_colors.dart';

/// Vendor avatar + speech bubble — top of the left column.
class VendorSpeechPanel extends StatelessWidget {
  const VendorSpeechPanel({
    super.key,
    this.onReplay,
  });

  final VoidCallback? onReplay;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _VendorAvatar(onReplay: onReplay),
        const SizedBox(width: 12),
        Expanded(
          child: _SpeechBubble(prompt: 'ku_isoko.vendor_prompt'.tr),
        ),
      ],
    );
  }
}

class _VendorAvatar extends StatelessWidget {
  const _VendorAvatar({this.onReplay});

  final VoidCallback? onReplay;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: AppColors.mintGreen.withValues(alpha: 0.22),
        shape: BoxShape.circle,
        border: Border.all(
          color: AppColors.mintGreen.withValues(alpha: 0.35),
          width: 2,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Image.asset(
        AppAssets.vendorAvatar,
        fit: BoxFit.cover,
        alignment: Alignment.topCenter,
        errorBuilder: (_, _, _) => const Icon(
          Icons.storefront_rounded,
          color: AppColors.navyObsidian,
          size: 28,
        ),
      ),
    );
  }
}

class _SpeechBubble extends StatelessWidget {
  const _SpeechBubble({required this.prompt});

  final String prompt;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF3F5FA),
        borderRadius: BorderRadius.circular(14),
      ),
      clipBehavior: Clip.antiAlias,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(width: 4, color: AppColors.warmAmber),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 14, 16, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '"$prompt"',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.navyObsidian,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
