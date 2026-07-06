import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';

class MenuSection extends StatelessWidget {
  const MenuSection({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.cloudGray,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
      child: Text(
        title,
        style: AppText.small.copyWith(fontWeight: FontWeight.w600),
      ),
    );
  }
}

class MenuItem extends StatelessWidget {
  const MenuItem({super.key, required this.title, required this.onTap, this.color});

  final String title;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(title, style: AppText.body.copyWith(color: color)),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}

