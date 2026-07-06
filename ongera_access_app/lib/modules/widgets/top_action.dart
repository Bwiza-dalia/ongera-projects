import 'package:flutter/material.dart';
import 'package:ongera_access_app/core/theme/app_theme.dart';

import '../../core/theme/app_colors.dart';

class TopAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const TopAction({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20),
            const SizedBox(width: 6),
            Text(label, style: AppText.small.copyWith(color: AppColors.navyObsidian),),
          ],
        ),
      ),
    );
  }
}
