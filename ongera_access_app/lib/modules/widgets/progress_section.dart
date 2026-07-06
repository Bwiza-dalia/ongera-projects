import 'package:flutter/material.dart';
import 'package:ongera_access_app/core/theme/app_theme.dart';
import 'package:get/get.dart';

import '../../core/theme/app_colors.dart';

class ProgressSection extends StatelessWidget {
  const ProgressSection({
    super.key,
    required this.collected,
    required this.total,
    required this.hints,
    required this.fraction,
    this.expanded = false,
  });

  final int collected;
  final int total;
  final int hints;
  final double fraction;
  final bool expanded;

  @override
  Widget build(BuildContext context) {
    final hintLabel = 'ku_isoko.hints_used'.trParams({'count': '$hints'});
    final progressLabel = 'ku_isoko.progress_count'.trParams({
      'current': '$collected',
      'total': '$total',
    });

    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = !expanded && constraints.maxWidth < 220;

        if (expanded) {
          return Row(
            children: [
              Text(
                progressLabel,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.small,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: fraction,
                    minHeight: 8,
                    backgroundColor: AppColors.dividerColor,
                    color: AppColors.mintGreen,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Icon(
                Icons.lightbulb_outline_rounded,
                size: 18,
                color: hints > 0 ? AppColors.warmAmber : AppColors.mutedText,
              ),
              const SizedBox(width: 4),
              Text(
                hintLabel,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.small,
              ),
            ],
          );
        }

        if (compact) {
          return Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Flexible(
                child: Text(
                  '$collected/$total',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.end,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppColors.mutedText,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                flex: 2,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: fraction,
                    minHeight: 6,
                    backgroundColor: AppColors.dividerColor,
                    color: AppColors.mintGreen,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Icon(
                Icons.lightbulb_outline_rounded,
                size: 16,
                color: hints > 0 ? AppColors.warmAmber : AppColors.mutedText,
              ),
            ],
          );
        }

        return Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Flexible(
              child: Text(
                progressLabel,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.end,
                style: AppText.small,
              ),
            ),
            const SizedBox(width: 10),
            Flexible(
              flex: 2,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 96),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: fraction,
                    minHeight: 6,
                    backgroundColor: AppColors.dividerColor,
                    color: AppColors.mintGreen,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Icon(
              Icons.lightbulb_outline_rounded,
              size: 18,
              color: hints > 0 ? AppColors.warmAmber : AppColors.mutedText,
            ),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                hintLabel,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.small,
              ),
            ),
          ],
        );
      },
    );
  }
}
