import 'package:flutter/material.dart';

class StatItem extends StatelessWidget {
  final String value;
  final String label;
  final Color color;

  const StatItem({super.key, required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w500, color: color)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 12, color: color.withOpacity(0.7))),
      ],
    );
  }
}
