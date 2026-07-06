import 'dart:ui';

import 'package:flutter/cupertino.dart';

class TherapyModule {
  final String title;
  final IconData icon; // Path to your asset image
  final Color iconColor;
  final Color backgroundColor;

  const TherapyModule({
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.backgroundColor,
  });
}