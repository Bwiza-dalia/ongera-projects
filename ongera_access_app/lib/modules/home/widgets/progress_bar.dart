import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class AppProgressBar extends StatelessWidget {
  final double value; // 0.0 to 1.0
  final Color track;
  final Color fill;
  final double height;

  const AppProgressBar({
    super.key,
    required this.value,
    this.track = AppColors.therapyBlueLight,
    this.fill = AppColors.therapyBlue,
    this.height = 8,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(height / 2),
      child: LinearProgressIndicator(
        value: value,
        minHeight: height,
        backgroundColor: track,
        valueColor: AlwaysStoppedAnimation<Color>(fill),
      ),
    );
  }
}